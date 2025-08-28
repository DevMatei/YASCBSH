import ReactGA from 'react-ga'
import { Provider } from 'react-redux'
import { createHashHistory } from 'history'
import { Admin as RAAdmin, Resource } from 'react-admin'
import { HotKeys } from 'react-hotkeys'
import dataProvider from './dataProvider'
import authProvider from './authProvider'
import { Layout, Login, Logout } from './layout'
import transcoding from './transcoding'
import player from './player'
import user from './user'
import song from './song'
import album from './album'
import artist from './artist'
import playlist from './playlist'
import radio from './radio'
import share from './share'
import library from './library'
import { Player } from './audioplayer'
import customRoutes from './routes'
import {
  libraryReducer,
  themeReducer,
  addToPlaylistDialogReducer,
  expandInfoDialogReducer,
  listenBrainzTokenDialogReducer,
  saveQueueDialogReducer,
  playerReducer,
  albumViewReducer,
  activityReducer,
  settingsReducer,
  replayGainReducer,
  downloadMenuDialogReducer,
  shareDialogReducer,
} from './reducers'
import createAdminStore from './store/createAdminStore'
import { i18nProvider } from './i18n'
import config, { shareInfo } from './config'
import { keyMap } from './hotkeys'
import useChangeThemeColor from './useChangeThemeColor'
import SharePlayer from './share/SharePlayer'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import missing from './missing/index.js'
import Navbar from './components/Navbar'
import { CssBaseline, createMuiTheme, ThemeProvider } from '@material-ui/core'
import { useState, useMemo } from 'react'

const history = createHashHistory()

if (config.gaTrackingId) {
  ReactGA.initialize(config.gaTrackingId)
  history.listen((location) => {
    ReactGA.pageview(location.pathname)
  })
  ReactGA.pageview(window.location.pathname)
}

const adminStore = createAdminStore({
  authProvider,
  dataProvider,
  history,
  customReducers: {
    library: libraryReducer,
    player: playerReducer,
    albumView: albumViewReducer,
    theme: themeReducer,
    addToPlaylistDialog: addToPlaylistDialogReducer,
    downloadMenuDialog: downloadMenuDialogReducer,
    expandInfoDialog: expandInfoDialogReducer,
    listenBrainzTokenDialog: listenBrainzTokenDialogReducer,
    saveQueueDialog: saveQueueDialogReducer,
    shareDialog: shareDialogReducer,
    activity: activityReducer,
    settings: settingsReducer,
    replayGain: replayGainReducer,
  },
})

const App = () => (
  <Provider store={adminStore}>
    <RAAdmin
      disableTelemetry
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
      customRoutes={customRoutes}
      history={history}
      layout={Layout}
      loginPage={Login}
      logoutButton={Logout}
    >
      {(permissions) => [
        <Resource name="album" {...album} options={{ subMenu: 'albumList' }} />,
        <Resource name="artist" {...artist} />,
        <Resource name="song" {...song} />,
        <Resource
          name="radio"
          {...(permissions === 'admin' ? radio.admin : radio.all)}
        />,
        config.enableSharing && <Resource name="share" {...share} />,
        <Resource
          name="playlist"
          {...playlist}
          options={{ subMenu: 'playlist' }}
        />,
        <Resource name="user" {...user} options={{ subMenu: 'settings' }} />,
        <Resource
          name="player"
          {...player}
          options={{ subMenu: 'settings' }}
        />,
        permissions === 'admin' ? (
          <Resource
            name="transcoding"
            {...transcoding}
            options={{ subMenu: 'settings' }}
          />
        ) : (
          <Resource name="transcoding" />
        ),
        permissions === 'admin' ? (
          <Resource
            name="library"
            {...library}
            options={{ subMenu: 'settings' }}
          />
        ) : null,
        permissions === 'admin' ? (
          <Resource
            name="missing"
            {...missing}
            options={{ subMenu: 'settings' }}
          />
        ) : null,

        <Resource name="translation" />,
        <Resource name="genre" />,
        <Resource name="tag" />,
        <Resource name="playlistTrack" />,
        <Resource name="keepalive" />,
        <Resource name="insights" />,
        <Resource name="config" />,
        <Player />,
      ]}
    </RAAdmin>
  </Provider>
)

const AppWithHotkeys = () => {
  const [darkMode, setDarkMode] = useState(false)

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1DB954',
          },
          background: {
            default: darkMode ? '#121212' : '#FFFFFF',
            paper: darkMode ? '#181818' : '#FFFFFF',
          },
          text: {
            primary: darkMode ? '#FFFFFF' : '#000000',
          },
        },
      }),
    [darkMode],
  )

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <HotKeys keyMap={keyMap}>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </HotKeys>
    </ThemeProvider>
  )
}

export default AppWithHotkeys
