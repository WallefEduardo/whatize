import React from 'react';
import { Box, TextField } from '@mui/material';
import { Search, X, Filter } from 'lucide-react';

const SearchAndFilters = ({ 
  searchParam, 
  handleSearch, 
  showSortOptions, 
  setShowSortOptions,
  sortBy,
  setSortBy,
  onFilterToggle 
}) => {
  
  const handleClearSearch = () => {
    handleSearch({ target: { value: '' } });
  };

  const handleSortOption = (option) => {
    setSortBy(option);
    setShowSortOptions(false);
  };

  return (
    <Box>
      {/* Search Input */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Pesquisar..."
          size="small"
          value={searchParam}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Search size={18} />
              </Box>
            ),
            endAdornment: searchParam && (
              <Box 
                onClick={handleClearSearch}
                sx={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--text-primary)' }
                }}
              >
                <X size={18} />
              </Box>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--background-paper)',
              '&:hover fieldset': {
                borderColor: 'var(--border-focus)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--color-primary)',
              }
            }
          }}
        />
        
        {/* Sort/Filter Button */}
        <Box
          onClick={() => onFilterToggle ? onFilterToggle() : setShowSortOptions(!showSortOptions)}
          sx={{
            minWidth: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showSortOptions ? 'var(--color-primary)' : 'var(--background-paper)',
            color: showSortOptions ? 'white' : 'var(--text-secondary)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '1px solid var(--border-primary)',
            position: 'relative',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: showSortOptions ? 'var(--color-primary-dark)' : 'var(--background-default)',
              borderColor: 'var(--border-focus)'
            }
          }}
        >
          <Filter size={18} />
          
          {/* Dropdown de opções de ordenação */}
          {showSortOptions && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 1,
                backgroundColor: 'var(--background-paper)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '180px',
                py: 1
              }}
            >
              {[
                'Data de Criação',
                'Última Mensagem', 
                'Esperando Resposta'
              ].map((option) => (
                <Box
                  key={option}
                  onClick={() => handleSortOption(option)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    fontSize: '14px',
                    backgroundColor: sortBy === option ? 'var(--background-default)' : 'transparent',
                    color: sortBy === option ? 'var(--color-primary)' : 'var(--text-primary)',
                    fontWeight: sortBy === option ? 600 : 400,
                    '&:hover': {
                      backgroundColor: 'var(--background-default)'
                    }
                  }}
                >
                  {option}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Search Results Indicator */}
      {searchParam && (
        <Box sx={{ 
          px: 2, 
          py: 1, 
          mb: 2,
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '6px',
          border: '1px solid var(--border-primary)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Search size={14} />
          <span>Pesquisando por "{searchParam}"</span>
        </Box>
      )}
    </Box>
  );
};

export default SearchAndFilters;