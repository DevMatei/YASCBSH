package lyrics

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// LyricsResponse defines the structure of the response sent to the frontend
type LyricsResponse struct {
	Lyrics string `json:"lyrics"`
}

// GeniusAPIResponse defines the structure of the response received from Genius API
type GeniusAPIResponse struct {
	Response struct {
		Hits []struct {
			Result struct {
				LyricsPath string `json:"path"`
			} `json:"result"`
		} `json:"hits"`
	} `json:"response"`
}

// FetchLyricsFromGenius fetches lyrics from the Genius API based on song title and artist name
func FetchLyricsFromGenius(songTitle, artistName string) (string, error) {
	apiKey := os.Getenv("GENIUS_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("Genius API key not set")
	}

	searchQuery := fmt.Sprintf("%s %s", songTitle, artistName)
	searchURL := fmt.Sprintf("https://api.genius.com/search?q=%s", strings.ReplaceAll(searchQuery, " ", "%20"))

	req, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var geniusResponse GeniusAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&geniusResponse); err != nil {
		return "", err
	}

	if len(geniusResponse.Response.Hits) == 0 {
		return "", fmt.Errorf("no lyrics found")
	}

	lyricsURL := fmt.Sprintf("https://genius.com%s", geniusResponse.Response.Hits[0].Result.LyricsPath)

	// Fetch the lyrics page (requires HTML parsing, which is beyond this scope)
	// For simplicity, we'll return the lyrics URL
	return lyricsURL, nil
}

// GetLyricsHandler handles requests to fetch lyrics
func GetLyricsHandler(c *gin.Context) {
	song := c.Query("song")
	artist := c.Query("artist")

	if song == "" || artist == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Song and artist parameters are required"})
		return
	}

	lyrics, err := FetchLyricsFromGenius(song, artist)
	if err != nil {
		c.JSON(http.StatusNotFound, LyricsResponse{Lyrics: "Lyrics not available."})
		return
	}

	c.JSON(http.StatusOK, LyricsResponse{Lyrics: lyrics})
}
