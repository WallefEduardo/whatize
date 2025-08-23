import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import {
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';

function SelectField(props) {
  const { name, control, label, data, error, ...rest } = props;

  return (
    <FormControl {...rest} error={!!error}>
      <InputLabel>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select {...field} value={field.value || ''}>
            {data.map((item, index) => (
              <MenuItem key={index} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

SelectField.defaultProps = {
  data: []
};

SelectField.propTypes = {
  data: PropTypes.array.isRequired
};

export default SelectField;
