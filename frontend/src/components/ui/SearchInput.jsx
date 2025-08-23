import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * SearchInput - Campo de busca moderno com ícones e animações
 */
const SearchInput = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Buscar...',
  disabled = false,
  animate = true,
  className = '',
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const inputContent = (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      size="small"
      fullWidth
      className={cn(
        // Custom styles
        '[&_.MuiOutlinedInput-root]:rounded-xl',
        '[&_.MuiOutlinedInput-root]:border-gray-200',
        '[&_.MuiOutlinedInput-root:hover]:border-[#065183]',
        '[&_.MuiOutlinedInput-root.Mui-focused]:border-[#065183]',
        '[&_.MuiOutlinedInput-root.Mui-focused]:ring-4',
        '[&_.MuiOutlinedInput-root.Mui-focused]:ring-blue-500/10',
        // Background
        '[&_.MuiOutlinedInput-root]:bg-white',
        '[&_.MuiOutlinedInput-input]:py-3',
        // Transitions
        '[&_.MuiOutlinedInput-root]:transition-all',
        '[&_.MuiOutlinedInput-root]:duration-200',
        className
      )}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search className="text-gray-400 w-5 h-5" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Clear
                className="text-gray-400 hover:text-gray-600 cursor-pointer w-5 h-5 transition-colors"
                onClick={handleClear}
              />
            </motion.div>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {inputContent}
      </motion.div>
    );
  }

  return inputContent;
};

export default SearchInput;