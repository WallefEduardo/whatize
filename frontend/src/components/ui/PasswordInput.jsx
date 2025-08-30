import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

const StyledPasswordInput = styled('input')(({ theme }) => ({
  width: '100%',
  height: '36px',
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: 400,
  fontFamily: 'Inter, sans-serif',
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '4px',
  outline: 'none',
  transition: 'all 0.2s ease',

  '&:focus': {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 2px rgba(0, 195, 7, 0.1)'
  },

  '&:hover': {
    borderColor: 'var(--border-secondary)'
  },

  '&::placeholder': {
    color: 'var(--text-secondary)',
    opacity: 0.6
  }
}));

const StyledInputContainer = styled('div')({
  position: 'relative',
  width: '100%'
});

const StyledIconButton = styled(IconButton)({
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '4px',
  color: 'var(--text-secondary)',
  
  '&:hover': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)'
  }
});

const PasswordInput = React.forwardRef(({ 
  className,
  color = "default",
  variant = "bordered", 
  size = "md",
  radius = "md",
  shadow = "none",
  placeholder,
  value,
  onChange,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <StyledInputContainer className={className}>
      <StyledPasswordInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      <StyledIconButton
        onClick={togglePasswordVisibility}
        edge="end"
        size="small"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </StyledIconButton>
    </StyledInputContainer>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };