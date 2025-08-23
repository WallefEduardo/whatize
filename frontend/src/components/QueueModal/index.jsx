import React, { useState, useEffect, useRef, useContext, Fragment } from "react";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../../components/ui/ToastProvider";

import { Box, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs } from "@mui/material";

import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { i18n } from "../../translate/i18n";
import Switch from "@mui/material/Switch";
import { isArray } from "lodash";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ColorPicker from "../ColorPicker";
import { IconButton, InputAdornment } from "@mui/material";
import { Colorize } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import ConfirmationModal from "../ConfirmationModal";
import Checkbox from '@mui/material/Checkbox';

import OptionsChatBot from "../ChatBots/options";
import CustomToolTip from "../ToolTips";

import SchedulesForm from "../SchedulesForm";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { AuthContext } from "../../context/Auth/AuthContext";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import useQueues from "../../hooks/useQueues";
import UserStatusIcon from "../UserModal/statusIcon";
import usePlans from "../../hooks/usePlans";
import ColorBoxModal from "../ColorBoxModal";
// import { ColorBox } from "material-ui-color";



const queueSchema = z.object({
  name: z.string().min(2, "Too Short!").max(50, "Too Long!").nonempty("Required"),
  color: z.string().min(3, "Too Short!").max(9, "Too Long!").nonempty("Required"),
  greetingMessage: z.string().optional(),
  outOfHoursMessage: z.string().optional(),
  orderQueue: z.string().optional(),
  tempoRoteador: z.number().optional(),
  ativarRoteador: z.boolean().optional(),
  integrationId: z.string().optional(),
  fileListId: z.string().optional(),
  closeTicket: z.boolean().optional(),
  chatbots: z.array(z.object({
    name: z.string().min(4, "too short").nonempty("Required"),
    greetingMessage: z.string().optional(),
    options: z.array(z.any()).optional()
  })).optional()
});

const QueueModal = ({ open, onClose, queueId, onEdit }) => {

  const initialState = {
    name: "",
    color: "",
    greetingMessage: "",
    chatbots: [],
    outOfHoursMessage: "",
    orderQueue: "",
    tempoRoteador: 0,
    ativarRoteador: false,
    integrationId: "",
    fileListId: "",
    closeTicket: false
  };

  const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
  const [queue, setQueue] = useState(initialState);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm({
    resolver: zodResolver(queueSchema),
    defaultValues: initialState
  });

  const { fields: chatbotFields, append: appendChatbot, remove: removeChatbot, update: updateChatbot } = useFieldArray({
    control,
    name: "chatbots"
  });

  const watchedValues = watch();
  const greetingRef = useRef();
  const [activeStep, setActiveStep] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isStepContent, setIsStepContent] = useState(true);
  const [isNameEdit, setIsNamedEdit] = useState(null);
  const [isGreetingMessageEdit, setGreetingMessageEdit] = useState(null);
  const [queues, setQueues] = useState([]);

  const [integrations, setIntegrations] = useState([]);
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const [tab, setTab] = useState(0);
  const [file, setFile] = useState(null);
  const { user, socket } = useContext(AuthContext);
  const [searchParam, setSearchParam] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedQueueOption, setSelectedQueueOption] = useState("");
  const { findAll: findAllQueues } = useQueues();
  const [allQueues, setAllQueues] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const isMounted = useRef(true);

  const initialStateSchedule = [
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: "Sábado", weekdayEn: "saturday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" },
    { weekday: "Domingo", weekdayEn: "sunday", startTimeA: "08:00", endTimeA: "12:00", startTimeB: "13:00", endTimeB: "18:00" }
  ];


  const [schedules, setSchedules] = useState(initialStateSchedule);

  const companyId = user.companyId;

  const { get: getSetting } = useCompanySettings();
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);

      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchData = async () => {

      const setting = await getSetting({
        "column": "scheduleType"
      });
      if (setting.scheduleType === "queue") setSchedulesEnabled(true);
    }
    fetchData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/files/", {
          params: { companyId }
        });

        setFile(data.files);
      } catch (err) {
        toastError(err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!queueId) return;
      try {
        const { data } = await api.get(`/queue/${queueId}`);

        setQueue((prevState) => {
          return { ...prevState, ...data };
        });

        if (isArray(data.schedules) && data.schedules.length > 0)
          setSchedules(data.schedules);
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setQueue({
        name: "",
        color: "",
        greetingMessage: "",
        chatbots: [],
        outOfHoursMessage: "",
        orderQueue: "",
        tempoRoteador: "",
        ativarRoteador: false,
        integrationId: "",
        fileListId: "",
        closeTicket: false
      });
    };
  }, [queueId, open]);

  useEffect(() => {
    if (isMounted.current) {
      const loadQueues = async () => {
        const list = await findAllQueues();
        setAllQueues(list);
        setQueues(list);

      };
      loadQueues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParam.length < 3) {
      setLoading(false);
      setSelectedQueueOption("");
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      //setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/");
          setUserOptions(data.users);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/queueIntegration");

        setIntegrations(data.queueIntegrations);
      } catch (err) {
        toastError(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (queue) {
      reset(queue);
    }
  }, [queue, reset]);

  useEffect(() => {

    if (activeStep) {
      setSelectedQueueOption(queue.chatbots[activeStep]?.optQueueId)
    }

    if (activeStep === isNameEdit) {
      setIsStepContent(false);
    } else {
      setIsStepContent(true);
    }
  }, [isNameEdit, activeStep]);

  const handleClose = () => {
    onClose();
    setIsNamedEdit(null);
    setActiveStep(null);
    setGreetingMessageEdit(null);
  };

  const handleSaveSchedules = async (values) => {
    try {
      setSchedules(values);
      
      if (queueId) {
        // Salva os horários imediatamente no banco
        await api.put(`/queue/${queueId}`, { ...queue, schedules: values });
        toast.success("Horários salvos com sucesso!");
      } else {
        toast.success("Clique em salvar para registar as alterações");
      }
      
      setTab(0);
    } catch (err) {
      toastError(err);
    }
  };

  const filterOptions = createFilterOptions({
    trim: true,
  });

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (optionsId) => {
    try {
      await api.delete(`/chatbot/${optionsId}`);
      const { data } = await api.get(`/queue/${queueId}`);
      setQueue(initialState);
      setQueue(data);

      setIsNamedEdit(null);
      setGreetingMessageEdit(null);
      toast.success(`${i18n.t("queues.toasts.deleted")}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveQueue = async (values) => {
    try {
      if (queueId) {
        await api.put(`/queue/${queueId}`, { ...values, schedules });
      } else {
        await api.post("/queue", { ...values, schedules });
      }

      toast.success(`${i18n.t("queues.toasts.success")}`);
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveBot = async (values) => {
    console.log(values)
    try {
      if (queueId) {
        const { data } = await api.put(`/queue/${queueId}`, values);
        if (data.chatbots && data.chatbots.length) {
          onEdit(data);
          setQueue(data);
        }
      } else {
        const { data } = await api.post("/queue", values);
        if (data.chatbots && data.chatbots.length) {
          setQueue(data);
          onEdit(data);
          handleClose();
        }
      }

      setIsNamedEdit(null)
      setGreetingMessageEdit(null)
      toast.success(`${i18n.t("queues.toasts.success")}`);

    } catch (err) {
      toastError(err);
    }
  };

  // const renderColorBox = (open, handleClose, color, handleColorChange) => {
  //   return (
  //     <Dialog open={open} onClose={handleClose}>

  //       <DialogTitle>Escolha uma cor</DialogTitle>
  //       <DialogContent>
  //         <ColorBox
  //           disableAlpha={true}
  //           hslGradient={false}
  //           style={{ margin: '20px auto 0' }}
  //           value={color}
  //           onChange={handleColorChange} />
  //       </DialogContent>
  //       <DialogActions>
  //         <Button onClick={handleClose} color="primary">
  //           Cancelar
  //         </Button>
  //         <Button
  //           color="primary"
  //           variant="contained"
  //           sx={{ position: 'relative' }}
  //           onClick={handleClose} >
  //           OK
  //         </Button>
  //       </DialogActions>
  //     </Dialog>
  //   )
  // }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${selectedQueue.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("queueModal.title.confirmationDelete")}
      </ConfirmationModal>
      <Dialog
        maxWidth="md"
        fullWidth
        open={open}
        onClose={handleClose}
        scroll="paper"
      >
        <DialogTitle>
          {queueId
            ? `${i18n.t("queueModal.title.edit")}`
            : `${i18n.t("queueModal.title.add")}`}
        </DialogTitle>
        <Tabs
          value={tab}
          indicatorColor="primary"
          textColor="primary"
          onChange={(e, v) => setTab(v)}
          aria-label="disabled tabs example"
        >
          <Tab label={i18n.t("queueModal.title.queueData")} />
          {schedulesEnabled && <Tab label={i18n.t("queueModal.title.text")} />}
        </Tabs>
        {tab === 0 && (
          <Box component="form" onSubmit={handleSubmit(handleSaveQueue)}>
            <DialogContent dividers>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={i18n.t("queueModal.form.name")}
                    autoFocus
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    variant="outlined"
                    margin="dense"
                    sx={{ mr: 1, flex: 1 }}
                  />
                )}
              />
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={i18n.t("queueModal.form.color")}
                    id="color"
                    onFocus={() => {
                      setColorPickerModalOpen(true);
                      greetingRef.current.focus();
                    }}
                    error={Boolean(errors.color)}
                    helperText={errors.color?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{ backgroundColor: watchedValues.color }}
                            sx={{ width: 20, height: 20 }}
                          ></div>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setColorPickerModalOpen(!colorPickerModalOpen)}
                        >
                          <Colorize />
                        </IconButton>
                      ),
                    }}
                    variant="outlined"
                    margin="dense"
                  />
                )}
              />
              <ColorBoxModal
                open={colorPickerModalOpen}
                handleClose={() => setColorPickerModalOpen(false)}
                onChange={(color) => {
                  setValue("color", `#${color.hex}`);
                }}
                currentColor={watchedValues.color}
              />
                  
              <Controller
                name="orderQueue"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={i18n.t("queueModal.form.orderQueue")}
                    type="number"
                    error={Boolean(errors.orderQueue)}
                    helperText={errors.orderQueue?.message}
                    variant="outlined"
                    margin="dense"
                    sx={{ m: 1, minWidth: 120 }}
                  />
                )}
              />
              <FormControlLabel
                control={
                  <Controller
                    name="closeTicket"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value}
                        color="primary"
                      />
                    )}
                  />
                }
                label={i18n.t("queueModal.form.closeTicket")}
              />
                  <div>
                    <FormControlLabel
                      control={
                        <Field
                          as={Switch}
                          color="primary"
                          name="ativarRoteador"
                          checked={values.ativarRoteador}
                        />
                      }
                      label={i18n.t("queueModal.form.rotate")}
                    />
                    <Field
                      as={Select}
                      label={i18n.t("queueModal.form.timeRotate")}
                      name="tempoRoteador"
                      id="tempoRoteador"
                      variant="outlined"
                      margin="dense"
                      className={classes.selectField}
                    >
                      <MenuItem value="0" selected disabled>{i18n.t("queueModal.form.timeRotate")}</MenuItem>
                      <MenuItem value="2">2 minutos</MenuItem>
                      <MenuItem value="5">5 minutos</MenuItem>
                      <MenuItem value="10">10 minutos</MenuItem>
                      <MenuItem value="15">15 minutos</MenuItem>
                      <MenuItem value="30">30 minutos</MenuItem>
                      <MenuItem value="45">45 minutos</MenuItem>
                      <MenuItem value="60">60 minutos</MenuItem>
                    </Field>
                  </div>
                  <div>
                    {showIntegrations && (
                      <FormControl
                        variant="outlined"
                        margin="dense"
                        className={classes.FormControl}
                        fullWidth
                      >
                        <InputLabel id="integrationId-selection-label">
                          {i18n.t("queueModal.form.integrationId")}
                        </InputLabel>
                        <Field
                          as={Select}
                          label={i18n.t("queueModal.form.integrationId")}
                          name="integrationId"
                          id="integrationId"
                          placeholder={i18n.t("queueModal.form.integrationId")}
                          labelId="integrationId-selection-label"
                          value={values.integrationId || ""}
                        >
                          <MenuItem value={""} >{"Nenhum"}</MenuItem>
                          {integrations.map((integration) => (
                            <MenuItem key={integration.id} value={integration.id}>
                              {integration.name}
                            </MenuItem>
                          ))}
                        </Field>

                      </FormControl>
                    )}
                    <FormControl
                      variant="outlined"
                      margin="dense"
                      className={classes.FormControl}
                      fullWidth
                    >
                      <InputLabel id="fileListId-selection-label">{i18n.t("queueModal.form.fileListId")}</InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("queueModal.form.fileListId")}
                        name="fileListId"
                        id="fileListId"
                        placeholder={i18n.t("queueModal.form.fileListId")}
                        labelId="fileListId-selection-label"
                        value={values.fileListId || ""}
                      >
                        <MenuItem value={""} >{"Nenhum"}</MenuItem>
                        {file.map(f => (
                          <MenuItem key={f.id} value={f.id}>
                            {f.name}
                          </MenuItem>
                        ))}
                      </Field>
                    </FormControl>
                  </div>
                  <div>
                    <Field
                      as={TextField}
                      label={i18n.t("queueModal.form.greetingMessage")}
                      type="greetingMessage"
                      multiline
                      inputRef={greetingRef}
                      minRows={5}
                      fullWidth
                      name="greetingMessage"
                      error={
                        touched.greetingMessage && Boolean(errors.greetingMessage)
                      }
                      helperText={
                        touched.greetingMessage && errors.greetingMessage
                      }
                      variant="outlined"
                      margin="dense"
                    />
                    {schedulesEnabled && (
                      <Field
                        as={TextField}
                        label={i18n.t("queueModal.form.outOfHoursMessage")}
                        type="outOfHoursMessage"
                        multiline
                        rows={5}
                        fullWidth
                        required={schedulesEnabled}
                        name="outOfHoursMessage"
                        error={
                          touched.outOfHoursMessage &&
                          Boolean(errors.outOfHoursMessage)
                        }
                        helperText={
                          touched.outOfHoursMessage && errors.outOfHoursMessage
                        }
                        variant="outlined"
                        margin="dense"
                      />
                    )}
                  </div>

                  <Typography variant="subtitle1">
                    {i18n.t("queueModal.bot.title")}
                    <CustomToolTip
                      title={i18n.t("queueModal.bot.toolTipTitle")}
                      content={i18n.t("queueModal.bot.toolTip")}
                    >
                      <HelpOutlineOutlinedIcon
                        style={{ marginLeft: "14px" }}
                        fontSize="small"
                      />
                    </CustomToolTip>
                  </Typography>

                  <div>
                    <FieldArray name="chatbots">
                      {({ push, remove }) => (
                        <>
                          <Stepper
                            nonLinear
                            activeStep={activeStep}
                            orientation="vertical"
                          >
                            {values.chatbots &&
                              values.chatbots.length > 0 &&
                              values.chatbots.map((info, index) => (
                                <Step
                                  key={`${info.id ? info.id : index}-chatbots`}
                                  onClick={() => setActiveStep(index)}
                                >
                                  <StepLabel key={`${info.id}-chatbots`}>
                                    {isNameEdit !== index &&
                                      queue.chatbots[index]?.name ? (
                                      <div
                                        className={classes.greetingMessage}
                                        variant="body1"
                                      >
                                        {values.chatbots[index].name}

                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setIsNamedEdit(index);
                                            setIsStepContent(false);
                                          }}
                                        >
                                          <EditIcon />
                                        </IconButton>

                                        <IconButton
                                          onClick={() => {
                                            setSelectedQueue(info);
                                            setConfirmModalOpen(true);
                                          }}
                                          size="small"
                                        >
                                          <DeleteOutline />
                                        </IconButton>
                                      </div>
                                    ) : (
                                      <Grid spacing={2} container>
                                        <Grid xs={12} md={12} item>

                                          <Field
                                            as={TextField}
                                            name={`chatbots[${index}].name`}
                                            variant="outlined"
                                            margin="dense"
                                            color="primary"
                                            label={i18n.t("queueModal.form.greetingMessage")}
                                            disabled={isSubmitting}
                                            autoFocus
                                            fullWidth
                                            size="small"
                                            error={
                                              touched?.chatbots?.[index]?.name &&
                                              Boolean(
                                                errors.chatbots?.[index]?.name
                                              )
                                            }
                                            sx={{ mr: 1, flex: 1 }}
                                          />
                                        </Grid>
                                        <Grid xs={12} md={8} item>
                                          <FormControl
                                            variant="outlined"
                                            margin="dense"
                                            sx={{ m: 1, minWidth: 120 }}
                                            fullWidth
                                          >
                                            <InputLabel id="queueType-selection-label">{i18n.t("queueModal.form.queueType")}</InputLabel>

                                            <Field
                                              as={Select}
                                              name={`chatbots[${index}].queueType`}
                                              variant="outlined"
                                              margin="dense"
                                              fullWidth
                                              labelId="queueType-selection-label"
                                              label={i18n.t("queueModal.form.queueType")}
                                              error={touched?.chatbots?.[index]?.queueType &&
                                                Boolean(errors?.chatbots?.[index]?.queueType)}
                                            // helpertext={touched?.chatbots?.[index]?.queueType && errors?.chatbots?.[index]?.queueType}
                                            // value={`chatbots[${index}].queueType`}
                                            >
                                              <MenuItem value={"text"}>{i18n.t("queueModal.bot.text")}</MenuItem>
                                              <MenuItem value={"attendent"}>{i18n.t("queueModal.bot.attendent")}</MenuItem>
                                              <MenuItem value={"queue"}>{i18n.t("queueModal.bot.queue")}</MenuItem>
                                              <MenuItem value={"integration"}>{i18n.t("queueModal.bot.integration")}</MenuItem>
                                              <MenuItem value={"file"}>{i18n.t("queueModal.bot.file")}</MenuItem>
                                            </Field>
                                          </FormControl>
                                        </Grid>

                                        <Grid xs={12} md={4} item>
                                          <FormControlLabel
                                            control={
                                              <Field
                                                as={Checkbox}
                                                color="primary"
                                                name={`chatbots[${index}].closeTicket`}
                                                checked={values.chatbots[index].closeTicket || false}
                                              />
                                            }
                                            labelPlacement="top"
                                            label={i18n.t("queueModal.form.closeTicket")}
                                          />

                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              values.chatbots[index].name
                                                ? handleSaveBot(values)
                                                : null
                                            }
                                            disabled={isSubmitting}
                                          >
                                            <SaveIcon />
                                          </IconButton>

                                          <IconButton
                                            size="small"
                                            onClick={() => remove(index)}
                                            disabled={isSubmitting}
                                          >
                                            <DeleteOutline />
                                          </IconButton>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </StepLabel>

                                  {isStepContent && queue.chatbots[index] && (
                                    <StepContent>
                                      <>
                                        {isGreetingMessageEdit !== index ? (
                                          <div
                                            className={classes.greetingMessage}
                                          >
                                            <Typography
                                              color="textSecondary"
                                              variant="body1"
                                            >
                                              Message:
                                            </Typography>

                                            {
                                              values.chatbots[index]
                                                .greetingMessage
                                            }

                                            {!queue.chatbots[index]
                                              ?.greetingMessage && (
                                                <CustomToolTip
                                                  title={i18n.t("queueModal.bot.toolTipMessageTitle")}
                                                  content={i18n.t("queueModal.bot.toolTipMessageContent")}
                                                >
                                                  <HelpOutlineOutlinedIcon
                                                    color="secondary"
                                                    style={{ marginLeft: "4px" }}
                                                    fontSize="small"
                                                  />
                                                </CustomToolTip>
                                              )}

                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                setGreetingMessageEdit(index)
                                              }
                                            >
                                              <EditIcon />
                                            </IconButton>
                                          </div>
                                        ) : (
                                          <Grid spacing={2} container>
                                            <div
                                              className={classes.greetingMessage}
                                            >
                                              {queue.chatbots[index].queueType === "text" && (
                                                <Grid xs={12} md={12} item>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                                                    label={i18n.t("queueModal.form.message")}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    multiline
                                                    error={
                                                      touched.greetingMessage &&
                                                      Boolean(errors.greetingMessage)
                                                    }
                                                    helperText={
                                                      touched.greetingMessage &&
                                                      errors.greetingMessage
                                                    }
                                                    sx={{ mr: 1, flex: 1 }}
                                                  />

                                                </Grid>
                                              )}
                                            </div>
                                            {queue.chatbots[index].queueType === "queue" && (
                                              <>
                                                <Grid xs={12} md={12} item>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                                                    label={i18n.t("queueModal.form.message")}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    multiline
                                                    error={
                                                      touched.greetingMessage &&
                                                      Boolean(errors.greetingMessage)
                                                    }
                                                    helperText={
                                                      touched.greetingMessage &&
                                                      errors.greetingMessage
                                                    }
                                                    sx={{ mr: 1, flex: 1 }}
                                                  />
                                                </Grid>
                                                <Grid xs={12} md={8} item>
                                                  <FormControl
                                                    variant="outlined"
                                                    margin="dense"
                                                    className={classes.FormControl}
                                                    fullWidth
                                                  >
                                                    <InputLabel id="queue-selection-label">{i18n.t("queueModal.form.queue")}</InputLabel>
                                                    <Field
                                                      as={Select}
                                                      name={`chatbots[${index}].optQueueId`}
                                                      error={touched?.chatbots?.[index]?.optQueueId &&
                                                        Boolean(errors?.chatbots?.[index]?.optQueueId)}
                                                      helpertext={touched?.chatbots?.[index]?.optQueueId && errors?.chatbots?.[index]?.optQueueId}
                                                      // value={`chatbots[${index}].optQueueId`}
                                                      sx={{ m: 1, minWidth: 120 }}
                                                    >
                                                      {queues.map(queue => (
                                                        <MenuItem key={queue.id} value={queue.id}>
                                                          {queue.name}
                                                        </MenuItem>
                                                      ))}
                                                    </Field>
                                                  </FormControl>
                                                </Grid>
                                              </>
                                            )}
                                            {queue.chatbots[index].queueType === "attendent" && (
                                              <>
                                                <Grid xs={12} md={12} item>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                                                    label={i18n.t("queueModal.form.message")}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    multiline
                                                    error={
                                                      touched.greetingMessage &&
                                                      Boolean(errors.greetingMessage)
                                                    }
                                                    helperText={
                                                      touched.greetingMessage &&
                                                      errors.greetingMessage
                                                    }
                                                    sx={{ mr: 1, flex: 1 }}
                                                  />
                                                </Grid>
                                                {/* SELECIONAR USUARIO */}
                                                <Grid xs={12} md={4} item>
                                                  <Autocomplete
                                                    style={{ marginTop: '8px' }}
                                                    variant="outlined"
                                                    margin="dense"
                                                    getOptionLabel={(option) => `${option.name}`}
                                                    value={queue.chatbots[index].user}
                                                    onChange={(e, newValue) => {
                                                      if (newValue != null) {
                                                        setFieldValue(`chatbots[${index}].optUserId`, newValue.id);
                                                      } else {
                                                        setFieldValue(`chatbots[${index}].optUserId`, null);

                                                      }
                                                      if (newValue != null && Array.isArray(newValue.queues)) {
                                                        if (newValue.queues.length === 1) {
                                                          setSelectedQueueOption(newValue.queues[0].id);
                                                          setFieldValue(`chatbots[${index}].optQueueId`, newValue.queues[0].id);
                                                        }
                                                        setQueues(newValue.queues);

                                                      } else {
                                                        setQueues(allQueues);
                                                        setSelectedQueueOption("");
                                                      }
                                                    }}
                                                    options={userOptions}
                                                    filterOptions={filterOptions}
                                                    freeSolo
                                                    fullWidth
                                                    autoHighlight
                                                    noOptionsText={i18n.t("transferTicketModal.noOptions")}
                                                    loading={loading}
                                                    size="small"
                                                    renderOption={option => (<span> <UserStatusIcon user={option} /> {option.name}</span>)}
                                                    renderInput={(params) => (
                                                      <TextField
                                                        {...params}
                                                        label={i18n.t("transferTicketModal.fieldLabel")}
                                                        variant="outlined"
                                                        onChange={(e) => setSearchParam(e.target.value)}
                                                        InputProps={{
                                                          ...params.InputProps,
                                                          endAdornment: (
                                                            <Fragment>
                                                              {loading ? (
                                                                <CircularProgress color="inherit" size={20} />
                                                              ) : null}
                                                              {params.InputProps.endAdornment}
                                                            </Fragment>
                                                          ),
                                                        }}
                                                      />
                                                    )}
                                                  />
                                                </Grid>
                                                <Grid xs={12} md={4} item>
                                                  <FormControl
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    sx={{ m: 1, minWidth: 120 }}
                                                  >
                                                    <InputLabel>
                                                      {i18n.t("transferTicketModal.fieldQueueLabel")}
                                                    </InputLabel>
                                                    <Select
                                                      value={selectedQueueOption}
                                                      onChange={(e) => {
                                                        setSelectedQueueOption(e.target.value)
                                                        setFieldValue(`chatbots[${index}].optQueueId`, e.target.value);
                                                      }}
                                                      label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
                                                    >
                                                      {queues.map((queue) => (
                                                        <MenuItem key={queue.id} value={queue.id}>
                                                          {queue.name}
                                                        </MenuItem>
                                                      ))}
                                                    </Select>
                                                  </FormControl>
                                                </Grid>
                                              </>
                                            )}
                                            {queue.chatbots[index].queueType === "integration" && (
                                              <>
                                                <Grid xs={12} md={12} item>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                                                    label={i18n.t("queueModal.form.message")}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    multiline
                                                    error={
                                                      touched.greetingMessage &&
                                                      Boolean(errors.greetingMessage)
                                                    }
                                                    helperText={
                                                      touched.greetingMessage &&
                                                      errors.greetingMessage
                                                    }
                                                    sx={{ mr: 1, flex: 1 }}
                                                  />
                                                </Grid>
                                                <Grid xs={12} md={8} item>
                                                  <FormControl
                                                    variant="outlined"
                                                    margin="dense"
                                                    className={classes.FormControl}
                                                    fullWidth
                                                  >
                                                    <InputLabel id="optIntegrationId-selection-label">{i18n.t("queueModal.form.integration")}</InputLabel>
                                                    <Field
                                                      as={Select}
                                                      name={`chatbots[${index}].optIntegrationId`}
                                                      error={touched?.chatbots?.[index]?.optIntegrationId &&
                                                        Boolean(errors?.chatbots?.[index]?.optIntegrationId)}
                                                      helpertext={touched?.chatbots?.[index]?.optIntegrationId && errors?.chatbots?.[index]?.optIntegrationId}
                                                      // value={`chatbots[${index}].optQueueId`}
                                                      sx={{ m: 1, minWidth: 120 }}
                                                    >
                                                      {integrations.map(integration => (
                                                        <MenuItem key={integration.id} value={integration.id}>
                                                          {integration.name}
                                                        </MenuItem>
                                                      ))}
                                                    </Field>
                                                  </FormControl>
                                                </Grid>
                                              </>
                                            )}
                                            {queue.chatbots[index].queueType === "file" && (
                                              <>
                                                <Grid xs={12} md={12} item>
                                                  <Field
                                                    as={TextField}
                                                    name={`chatbots[${index}].greetingMessage`}
                                                    label={i18n.t("queueModal.form.message")}
                                                    variant="outlined"
                                                    margin="dense"
                                                    fullWidth
                                                    multiline
                                                    error={
                                                      touched.greetingMessage &&
                                                      Boolean(errors.greetingMessage)
                                                    }
                                                    helperText={
                                                      touched.greetingMessage &&
                                                      errors.greetingMessage
                                                    }
                                                    sx={{ mr: 1, flex: 1 }}
                                                  />
                                                </Grid>
                                                <InputLabel>{"Selecione um Arquivo"}</InputLabel>
                                                <Field
                                                  as={Select}
                                                  name={`chatbots[${index}].optFileId`}
                                                  error={touched?.chatbots?.[index]?.optFileId &&
                                                    Boolean(errors?.chatbots?.[index]?.optFileId)}
                                                  helpertext={touched?.chatbots?.[index]?.optFileId && errors?.chatbots?.[index]?.optFileId}
                                                  sx={{ m: 1, minWidth: 120 }}
                                                >
                                                  {file.map(f => (
                                                    <MenuItem key={f.id} value={f.id}>
                                                      {f.name}
                                                    </MenuItem>
                                                  ))}
                                                </Field>
                                              </>
                                            )}
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleSaveBot(values)
                                              }
                                              disabled={isSubmitting}
                                            >
                                              {" "}
                                              <SaveIcon />
                                            </IconButton>
                                          </Grid>
                                        )}

                                        <OptionsChatBot chatBotId={info.id} />
                                      </>
                                    </StepContent>
                                  )}
                                </Step>
                              ))}

                            <Step>
                              <StepLabel
                                onClick={() => push({ name: "", value: "" })}
                              >
                                {i18n.t("queueModal.bot.addOptions")}
                              </StepLabel>
                            </Step>
                          </Stepper>
                        </>
                      )}
                    </FieldArray>
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={handleClose}
                    // color="secondary"
                    disabled={isSubmitting}
                  // variant="outlined"
                  >
                    {i18n.t("queueModal.buttons.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                    sx={{ position: 'relative' }}
                  >
                    {queueId
                      ? `${i18n.t("queueModal.buttons.okEdit")}`
                      : `${i18n.t("queueModal.buttons.okAdd")}`}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        sx={{
              color: green[500],
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -1.5,
              marginLeft: -1.5,
            }}
                      />
                    )}
                  </Button>
            </DialogActions>
          </Box>
        )}
        {tab === 1 && (
          <Paper style={{ padding: 20 }}>
            <SchedulesForm
              loading={false}
              onSubmit={handleSaveSchedules}
              initialValues={schedules}
              labelSaveButton={i18n.t("whatsappModal.buttons.okAdd")}
            />
          </Paper>
        )}
      </Dialog>
    </Box >
  );
};

export default QueueModal;