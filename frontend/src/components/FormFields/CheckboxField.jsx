import React from 'react';
import { Controller } from 'react-hook-form';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText
} from '@mui/material';

export default function CheckboxField(props) {
  const { name, label, control, error, ...rest } = props;

  return (
    <FormControl {...rest}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value || false}
                onChange={(e) => field.onChange(e.target.checked)}
                name={field.name}
              />
            }
            label={label}
          />
        )}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}
