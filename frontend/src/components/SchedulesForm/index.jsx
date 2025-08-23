import React, { useState, useEffect } from "react";
import { TextField, Grid, Box } from "@mui/material";
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isArray } from "lodash";
import NumberFormat from "react-number-format";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { i18n } from "../../translate/i18n";


// MIGRAÇÃO: makeStyles + Formik → sx prop + React Hook Form + Zod
const schedulesFormStyles = {
  root: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  textfield: {
    width: "100%",
    fontSize: "0.875em"
  },
  row: {
    paddingTop: (theme) => 16,
    paddingBottom: (theme) => 16,
  },
  control: {
    paddingRight: (theme) => 8,
    paddingLeft: (theme) => 8,
  },
  buttonContainer: {
    textAlign: "right",
    padding: (theme) => 8,
  },
};

const scheduleSchema = z.object({
  schedules: z.array(z.object({
    weekday: z.string(),
    weekdayEn: z.string(),
    startTimeA: z.string().optional(),
    endTimeA: z.string().optional(),
    startTimeB: z.string().optional(),
    endTimeB: z.string().optional(),
  }))
});

function SchedulesForm(props) {
  const { initialValues, onSubmit, loading, labelSaveButton } = props;
  // MIGRAÇÃO: usando objeto de estilos direto + React Hook Form

  const defaultSchedules = [
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.saturday"), weekdayEn: "saturday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.sunday"), weekdayEn: "sunday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
  ];

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { schedules: defaultSchedules }
  });

  const { fields } = useFieldArray({
    control,
    name: "schedules"
  });

  useEffect(() => {
    console.log(initialValues)
    if (isArray(initialValues) && initialValues.length > 0) {
      reset({ schedules: initialValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, reset]);

  const handleFormSubmit = (data) => {
    console.log(data)
    onSubmit(data.schedules);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={schedulesFormStyles.fullWidth}>
      <Grid spacing={4} container>
        {fields.map((item, index) => {
          return (
            <Grid key={item.id} xs={12} md={4} item>
              <Grid container>
                <Grid sx={schedulesFormStyles.control} xs={12} item>
                  <Controller
                    name={`schedules.${index}.weekday`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={i18n.t("queueModal.serviceHours.dayWeek")}
                        disabled
                        variant="outlined"
                        sx={schedulesFormStyles.fullWidth}
                        margin="dense"
                      />
                    )}
                  />
                </Grid>
                <Grid sx={schedulesFormStyles.control} xs={12} md={6} item>
                  <Controller
                    name={`schedules.${index}.startTimeA`}
                    control={control}
                    render={({ field }) => (
                      <NumberFormat
                        {...field}
                        variant="outlined"
                        margin="dense"
                        customInput={TextField}
                        format="##:##"
                        sx={schedulesFormStyles.fullWidth}
                        label={i18n.t("queueModal.serviceHours.startTimeA")}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={schedulesFormStyles.control} xs={12} md={6} item>
                  <Controller
                    name={`schedules.${index}.endTimeA`}
                    control={control}
                    render={({ field }) => (
                      <NumberFormat
                        {...field}
                        variant="outlined"
                        margin="dense"
                        customInput={TextField}
                        format="##:##"
                        sx={schedulesFormStyles.fullWidth}
                        label={i18n.t("queueModal.serviceHours.endTimeA")}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={schedulesFormStyles.control} xs={12} md={6} item>
                  <Controller
                    name={`schedules.${index}.startTimeB`}
                    control={control}
                    render={({ field }) => (
                      <NumberFormat
                        {...field}
                        variant="outlined"
                        margin="dense"
                        customInput={TextField}
                        format="##:##"
                        sx={schedulesFormStyles.fullWidth}
                        label={i18n.t("queueModal.serviceHours.startTimeB")}
                      />
                    )}
                  />
                </Grid>
                <Grid sx={schedulesFormStyles.control} xs={12} md={6} item>
                  <Controller
                    name={`schedules.${index}.endTimeB`}
                    control={control}
                    render={({ field }) => (
                      <NumberFormat
                        {...field}
                        variant="outlined"
                        margin="dense"
                        customInput={TextField}
                        format="##:##"
                        sx={schedulesFormStyles.fullWidth}
                        label={i18n.t("queueModal.serviceHours.endTimeB")}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          );
        })}
      </Grid>
      <Box sx={schedulesFormStyles.buttonContainer}>
        <ButtonWithSpinner
          loading={loading}
          type="submit"
          color="primary"
          variant="contained"
        >
          {labelSaveButton ?? i18n.t("whatsappModal.buttons.okEdit")}
        </ButtonWithSpinner>
      </Box>
    </Box>
  );
}

export default SchedulesForm;
