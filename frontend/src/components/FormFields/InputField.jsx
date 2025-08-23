import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField } from '@mui/material';

export default function InputField(props) {
  const { name, control, error, ...rest } = props;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          error={!!error}
          helperText={error}
          {...rest}
        />
      )}
    />
  );
}
