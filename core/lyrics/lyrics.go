package lyrics

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"regexp"
	"strings"
)

// Lyrics represents the structure of lyrics fetched from the API
type Lyrics struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Lyrics string `json:"lyrics"`
}

// FetchLyrics fetches lyrics from Genius API based on song title and artist
func FetchLyrics(title, artist string) (*Lyrics, error) {
	apiToken := os.Getenv("GENIUS_API_TOKEN")
	if apiToken == "" {
		return nil, fmt.Errorf("Genius API token not set")
	}

	query := fmt.Sprintf("%s %s", title, artist)
	searchURL := fmt.Sprintf("https://api.genius.com/search?q=%s", query)

	req, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Genius API returned status code %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Response struct {
			Hits []struct {
				Result struct {
					Title         string `json:"title"`
					PrimaryArtist struct {
						Name string `json:"name"`
					} `json:"primary_artist"`
					URL string `json:"url"`
				} `json:"result"`
			} `json:"hits"`
		} `json:"response"`
	}

	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, err
	}

	if len(result.Response.Hits) == 0 {
		return nil, fmt.Errorf("no lyrics found for %s by %s", title, artist)
	}

	lyricsURL := result.Response.Hits[0].Result.URL

	// Fetch lyrics page and parse lyrics (this example assumes lyrics are in the page as a div with class 'Lyrics__Container')
	lyricsResp, err := http.Get(lyricsURL)
	if err != nil {
		return nil, err
	}
	defer lyricsResp.Body.Close()

	if lyricsResp.StatusCode != 200 {
		return nil, fmt.Errorf("failed to fetch lyrics from %s", lyricsURL)
	}

	lyricsBody, err := ioutil.ReadAll(lyricsResp.Body)
	if err != nil {
		return nil, err
	}

	// Simple parsing logic (for demonstration purposes)
	lyricsStart := strings.Index(string(lyricsBody), "<div class=\"Lyrics__Container")
	if lyricsStart == -1 {
		return nil, fmt.Errorf("lyrics container not found")
	}

	lyricsEnd := strings.Index(string(lyricsBody)[lyricsStart:], "</div>")
	if lyricsEnd == -1 {
		return nil, fmt.Errorf("lyrics container not properly closed")
	}

	lyricsHTML := string(lyricsBody)[lyricsStart : lyricsStart+lyricsEnd]

	// Clean HTML tags to extract plain lyrics
	re := regexp.MustCompile("<[^>]*>")
	plainLyrics := re.ReplaceAllString(lyricsHTML, "")
	plainLyrics = strings.TrimSpace(plainLyrics)

	return &Lyrics{
		Title:  title,
		Artist: artist,
		Lyrics: plainLyrics,
	}, nil
}


func GetLyrics(ctx context.Context, mf *model.MediaFile) (model.LyricList, error) {
	var lyricsList model.LyricList
	var err error

	for pattern := range strings.SplitSeq(strings.ToLower(conf.Server.LyricsPriority), ",") {
		pattern = strings.TrimSpace(pattern)
		switch {
		case pattern == "embedded":
			lyricsList, err = fromEmbedded(ctx, mf)
		case strings.HasPrefix(pattern, "."):
			lyricsList, err = fromExternalFile(ctx, mf, pattern)
		default:
			log.Error(ctx, "Invalid lyric pattern", "pattern", pattern)
		}

		if err != nil {
			log.Error(ctx, "error parsing lyrics", "source", pattern, err)
		}

		if len(lyricsList) > 0 {
			return lyricsList, nil
		}
	}

	return nil, nil
}
