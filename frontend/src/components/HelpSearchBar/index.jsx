import React, { useState, useEffect } from "react";
import {
  TextField,
  InputAdornment,
  Paper,
  Box,
  IconButton,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Search, Clear, Menu as MenuIcon } from "@mui/icons-material";
import { useDebounce } from "use-debounce";

const HelpSearchBar = ({ 
  onSearch, 
  placeholder = "Buscar por título, categoria ou descrição...",
  onMenuClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)")
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
    <Paper sx={{
      padding: 2,
      marginBottom: 2,
      backgroundColor: "var(--color-primary)",
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }} elevation={1}>
      {isMobile && onMenuClick && (
        <IconButton
          sx={{
            backgroundColor: "var(--color-primary)",
            color: "white",
            '&:hover': {
              backgroundColor: "#1565c0",
            },
            "@media (max-width:600px)": {
              display: 'block'
            }
          }}
          onClick={onMenuClick}
          size="small"
        >
          <MenuIcon />
        </IconButton>
      )}
      <TextField
        sx={{ flex: 1 }}
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
                sx={{
                  cursor: "pointer",
                  color: "#666",
                  "&:hover": {
                    color: "var(--color-primary)"
                  }
                }}
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