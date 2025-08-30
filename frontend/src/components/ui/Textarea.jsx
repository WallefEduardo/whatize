import React from 'react';
import { styled } from '@mui/material/styles';

// MUI styled component com theme integration
const StyledTextarea = styled('textarea')(({ theme, color = 'default', variant = 'bordered', size = 'md', radius = 'md', shadow = 'none' }) => {
  const getColorStyles = () => {
    const colors = {
      default: {
        border: 'var(--border-primary)',
        text: 'var(--text-secondary)',
        focus: 'var(--color-accent, #00c307)',
        bg: 'var(--bg-primary)',
        disabled: 'var(--bg-secondary)',
      },
      primary: {
        border: theme.palette.primary.light,
        text: theme.palette.primary.main,
        focus: theme.palette.primary.main,
        bg: theme.palette.primary.light + '10',
        disabled: theme.palette.primary.light + '30',
      },
      info: {
        border: theme.palette.info.light,
        text: theme.palette.info.main,
        focus: theme.palette.info.main,
        bg: theme.palette.info.light + '10', 
        disabled: theme.palette.info.light + '30',
      },
      warning: {
        border: theme.palette.warning.light,
        text: theme.palette.warning.main,
        focus: theme.palette.warning.main,
        bg: theme.palette.warning.light + '10',
        disabled: theme.palette.warning.light + '30',
      },
      success: {
        border: theme.palette.success.light,
        text: theme.palette.success.main,
        focus: theme.palette.success.main,
        bg: theme.palette.success.light + '10',
        disabled: theme.palette.success.light + '30',
      },
      destructive: {
        border: theme.palette.error.light,
        text: theme.palette.error.main,
        focus: theme.palette.error.main,
        bg: theme.palette.error.light + '10',
        disabled: theme.palette.error.light + '30',
      },
    };
    return colors[color] || colors.default;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        minHeight: '60px',
        padding: '8px 8px',
        fontSize: '12px',
      },
      md: {
        minHeight: '80px', 
        padding: '12px 12px',
        fontSize: '13px',
      },
      lg: {
        minHeight: '100px',
        padding: '16px 16px', 
        fontSize: '14px',
      },
      xl: {
        minHeight: '120px',
        padding: '20px 20px',
        fontSize: '15px',
      },
    };
    return sizes[size] || sizes.md;
  };

  const getVariantStyles = () => {
    const colorStyles = getColorStyles();
    const variants = {
      flat: {
        backgroundColor: colorStyles.bg,
        border: 'none',
      },
      underline: {
        backgroundColor: 'transparent',
        borderTop: 'none',
        borderLeft: 'none', 
        borderRight: 'none',
        borderBottom: `2px solid ${colorStyles.border}`,
        borderRadius: '0',
      },
      bordered: {
        backgroundColor: colorStyles.bg,
        border: `1px solid ${colorStyles.border}`,
      },
      faded: {
        backgroundColor: theme.palette.grey[50],
        border: `1px solid ${colorStyles.border}`,
      },
      ghost: {
        backgroundColor: 'transparent',
        border: 'none',
        '&:focus': {
          border: `1px solid ${colorStyles.focus}`,
        },
      },
    };
    return variants[variant] || variants.bordered;
  };

  const getRadiusStyles = () => {
    const radiusMap = {
      none: '0',
      sm: theme.shape.borderRadius * 0.5,
      md: theme.shape.borderRadius,
      lg: theme.shape.borderRadius * 2,
      xl: theme.shape.borderRadius * 3,
    };
    return {
      borderRadius: radiusMap[radius] || radiusMap.md,
    };
  };

  const getShadowStyles = () => {
    const shadows = {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    };
    return {
      boxShadow: shadows[shadow] || shadows.none,
    };
  };

  const colorStyles = getColorStyles();
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const radiusStyles = getRadiusStyles();
  const shadowStyles = getShadowStyles();

  return {
    width: '100%',
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    color: colorStyles.text,
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    resize: 'vertical',
    ...sizeStyles,
    ...variantStyles,
    ...radiusStyles,
    ...shadowStyles,
    '&:focus': {
      borderColor: colorStyles.focus,
      boxShadow: `0 0 0 2px ${colorStyles.focus}20`,
    },
    '&:disabled': {
      backgroundColor: colorStyles.disabled,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    '&::placeholder': {
      color: 'var(--text-secondary)',
      opacity: 0.6,
      fontWeight: 400,
    },
  };
});

const Textarea = React.forwardRef(
  (
    {
      className,
      rows = 4,
      size,
      color,
      radius,
      variant,
      shadow,
      removeWrapper = false,
      ...props
    },
    ref
  ) => {
    const textareaElement = (
      <StyledTextarea
        rows={rows}
        className={className}
        color={color}
        variant={variant}
        size={size}
        radius={radius}
        shadow={shadow}
        ref={ref}
        {...props}
      />
    );

    return removeWrapper ? (
      textareaElement
    ) : (
      <div style={{ flex: 1, width: '100%' }}>
        {textareaElement}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };