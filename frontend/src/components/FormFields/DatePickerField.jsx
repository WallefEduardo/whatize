import React from 'react';
import { Controller } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function DatePickerField(props) {
  const { name, control, error, ...rest } = props;

  return (
    <Grid container>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              {...rest}
              value={field.value ? new Date(field.value) : null}
              onChange={(date) => {
                if (date) {
                  try {
                    field.onChange(date.toISOString());
                  } catch (error) {
                    field.onChange(date);
                  }
                } else {
                  field.onChange(null);
                }
              }}
              slotProps={{
                textField: {
                  error: !!error,
                  helperText: error,
                },
              }}
            />
          )}
        />
      </LocalizationProvider>
    </Grid>
  );
}
