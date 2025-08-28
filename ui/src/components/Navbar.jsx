import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Switch } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import SearchIcon from '@material-ui/icons/Search';
import LibraryMusicIcon from '@material-ui/icons/LibraryMusic';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';

const useStyles = makeStyles((theme) => ({
  title: {
    flexGrow: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat, sans-serif',
  },
}));

function Navbar({ darkMode, toggleDarkMode }) {
  const classes = useStyles();

  return (
    <AppBar position="static" style={{ backgroundColor: '#1DB954' }}>
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="home">
          <HomeIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="search">
          <SearchIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="library">
          <LibraryMusicIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          YASCBSH
        </Typography>
        <IconButton color="inherit" aria-label="toggle dark mode" onClick={toggleDarkMode}>
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Switch checked={darkMode} onChange={toggleDarkMode} color="default" />
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
