import React from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Typography 
} from '@mui/material';
import GradientButton from '../GradientButton';

/**
 * ModernFormGrid - Componente de formulário em grid baseado no template
 * 
 * @param {Object} props
 * @param {Array} props.fields - Array de campos do formulário
 * @param {Function} props.onSubmit - Callback do submit
 * @param {Object} props.formData - Dados do formulário
 * @param {Function} props.onChange - Callback para mudanças nos campos
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.submitLabel - Texto do botão submit
 * @param {Object} props.sx - Estilos customizados
 * 
 * Campo structure:
 * {
 *   id: string,
 *   type: 'text'|'email'|'password'|'number'|'select'|'checkbox',
 *   label: string,
 *   placeholder?: string,
 *   required?: boolean,
 *   span?: 1|2 (colunas que ocupa),
 *   options?: Array (para select),
 *   disabled?: boolean,
 *   helperText?: string,
 *   error?: boolean
 * }
 * 
 * @example
 * <ModernFormGrid
 *   fields={[
 *     { id: 'firstName', type: 'text', label: 'Nome', placeholder: 'Digite seu nome', span: 1, required: true },
 *     { id: 'lastName', type: 'text', label: 'Sobrenome', placeholder: 'Digite seu sobrenome', span: 1 },
 *     { id: 'email', type: 'email', label: 'Email', placeholder: 'Digite seu email', span: 2, required: true },
 *     { id: 'state', type: 'select', label: 'Estado', options: [{value: 'sp', label: 'São Paulo'}], span: 1 },
 *     { id: 'terms', type: 'checkbox', label: 'Aceito os termos e condições', span: 2 }
 *   ]}
 *   formData={formData}
 *   onChange={handleChange}
 *   onSubmit={handleSubmit}
 *   loading={loading}
 *   submitLabel="Salvar Dados"
 * />
 */
const ModernFormGrid = ({
  fields = [],
  onSubmit = () => {},
  formData = {},
  onChange = () => {},
  loading = false,
  submitLabel = 'Submit Form',
  showSubmitButton = true,
  sx = {}
}) => {

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFieldChange = (fieldId, value) => {
    onChange({
      ...formData,
      [fieldId]: value
    });
  };

  const renderField = (field) => {
    const { id, type, label, placeholder, required, options, disabled, helperText, error } = field;
    const value = formData[id] || '';

    // Estilos base para os campos
    const fieldSx = {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 2,
        fontSize: '0.875rem',
        '& fieldset': {
          borderColor: error ? '#DC2626' : 'var(--border-primary)',
        },
        '&:hover fieldset': {
          borderColor: error ? '#DC2626' : 'var(--color-accent)',
        },
        '&.Mui-focused fieldset': {
          borderColor: error ? '#DC2626' : 'var(--color-accent)',
          borderWidth: '2px'
        },
      },
      '& .MuiInputLabel-root': {
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
        '&.Mui-focused': {
          color: error ? '#DC2626' : 'var(--color-accent)',
        }
      },
      '& .MuiOutlinedInput-input': {
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        '&::placeholder': {
          color: 'var(--text-disabled)',
          opacity: 1
        }
      },
      '& .MuiFormHelperText-root': {
        color: error ? '#DC2626' : 'var(--text-disabled)',
        fontSize: '0.75rem',
        mt: 1
      }
    };

    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth sx={fieldSx} key={id}>
            <InputLabel required={required}>{label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldChange(id, e.target.value)}
              label={label}
              disabled={disabled}
              error={error}
              sx={{
                '& .MuiSelect-select': {
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }
              }}
            >
              {options?.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    '&:hover': {
                      backgroundColor: 'var(--hover-bg-light)'
                    }
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {helperText && (
              <Typography variant="caption" sx={{ color: error ? '#DC2626' : 'var(--text-disabled)', mt: 1 }}>
                {helperText}
              </Typography>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={id}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(id, e.target.checked)}
                disabled={disabled}
                sx={{
                  color: 'var(--text-secondary)',
                  '&.Mui-checked': {
                    color: 'var(--color-accent)',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem'
                  }
                }}
              />
            }
            label={
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.875rem',
                  fontWeight: 400 
                }}
              >
                {label}
              </Typography>
            }
            sx={{
              alignItems: 'flex-start',
              mt: 0.5
            }}
          />
        );

      default:
        return (
          <TextField
            key={id}
            type={type}
            label={label}
            placeholder={type === 'datetime-local' || type === 'date' ? '' : placeholder}
            value={value}
            onChange={(e) => handleFieldChange(id, e.target.value)}
            required={required}
            disabled={disabled}
            error={error}
            helperText={helperText}
            fullWidth
            variant="outlined"
            InputLabelProps={
              type === 'datetime-local' || type === 'date' 
                ? { shrink: true } 
                : undefined
            }
            sx={fieldSx}
          />
        );
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        width: '100%',
        ...sx 
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        {fields.map((field) => (
          <Box
            key={field.id}
            sx={{
              gridColumn: {
                xs: 'span 1',
                sm: field.span === 2 ? 'span 2' : 'span 1'
              }
            }}
          >
            {renderField(field)}
          </Box>
        ))}

        {/* Botão Submit - Condicional */}
        {showSubmitButton && (
          <Box sx={{ gridColumn: 'span 2', mt: 2 }}>
            <GradientButton
              type="submit"
              loading={loading}
              sx={{
                minWidth: 140,
                height: 44,
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            >
              {submitLabel}
            </GradientButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ModernFormGrid;