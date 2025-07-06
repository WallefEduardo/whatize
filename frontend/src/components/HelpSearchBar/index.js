import React, { useState, useEffect } from "react";
import {
  makeStyles,
  TextField,
  InputAdornment,
  Paper,
  Box,
  IconButton,
  useMediaQuery,
  useTheme
} from "@material-ui/core";
import { Search, Clear, Menu as MenuIcon } from "@material-ui/icons";
import { useDebounce } from "use-debounce";

const useStyles = makeStyles(theme => ({
  searchContainer: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  searchField: {
    flex: 1
  },
  clearButton: {
    cursor: "pointer",
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.text.primary
    }
  },
  menuButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    [theme.breakpoints.up('lg')]: {
      display: 'none'
    }
  }
}));

const HelpSearchBar = ({ 
  onSearch, 
  placeholder = "Buscar por título, categoria ou descrição...",
  onMenuClick 
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Paper className={classes.searchContainer} elevation={1}>
      {isMobile && onMenuClick && (
        <IconButton
          className={classes.menuButton}
          onClick={onMenuClick}
          size="small"
        >
          <MenuIcon />
        </IconButton>
      )}
      <TextField
        className={classes.searchField}
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <Clear 
                className={classes.clearButton}
                onClick={handleClearSearch}
              />
            </InputAdornment>
          )
        }}
      />
    </Paper>
  );
};

export default HelpSearchBar; 