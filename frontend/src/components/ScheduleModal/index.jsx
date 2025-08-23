import React, { useState, useEffect, useContext, useRef } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../ui/ToastProvider";
import { useHistory } from "react-router-dom";

import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Box, Chip, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Switch, Typography } from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import moment from "moment"
import { AuthContext } from "../../context/Auth/AuthContext";
import { isArray, capitalize } from "lodash";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import AttachFile from "@mui/icons-material/AttachFile";
import { head } from "lodash";
import ConfirmationModal from "../ConfirmationModal";
import MessageVariablesPicker from "../MessageVariablesPicker";
import useQueues from "../../hooks/useQueues";
import UserStatusIcon from "../UserModal/statusIcon";
import { Facebook, Instagram, WhatsApp } from "@mui/icons-material";


const scheduleSchema = z.object({
	body: z.string().min(5, "Mensagem muito curta").nonempty("Obrigatório"),
	contactId: z.number().min(1, "Obrigatório"),
	sendAt: z.string().nonempty("Obrigatório"),
	openTicket: z.string().optional(),
	statusTicket: z.string().optional(),
	valorIntervalo: z.number().optional(),
	enviarQuantasVezes: z.number().optional(),
	assinar: z.boolean().optional()
});

const ScheduleModal = ({ open, onClose, scheduleId, contactId, cleanContact, reload }) => {
	const history = useHistory();
	const { user } = useContext(AuthContext);
	const isMounted = useRef(true);
	const { companyId } = user;

	const initialState = {
		body: "",
		contactId: "",
		sendAt: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
		sentAt: "",
		openTicket: "enabled",
		ticketUserId: "",
		queueId: "",
		statusTicket: "closed",
		intervalo: 1,
		valorIntervalo: 0,
		enviarQuantasVezes: 1,
		tipoDias: 4,
		assinar: false
	};

	const initialContact = {
		id: "",
		name: "",
		channel: ""
	}

	const [schedule, setSchedule] = useState(initialState);

	const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm({
		resolver: zodResolver(scheduleSchema),
		defaultValues: initialState
	});

	const watchedValues = watch();
	const [currentContact, setCurrentContact] = useState(initialContact);
	const [contacts, setContacts] = useState([initialContact]);
	const [intervalo, setIntervalo] = useState(1);
	// const [valorIntervalo, setValorIntervalo] = useState(initialContact);
	// const [enviarQuantasVezes, setEnviarQuantasVezes] = useState(initialContact);
	const [tipoDias, setTipoDias] = useState(4);
	const [attachment, setAttachment] = useState(null);
	const attachmentFile = useRef(null);
	const [confirmationOpen, setConfirmationOpen] = useState(false);
	const messageInputRef = useRef();
	const [channelFilter, setChannelFilter] = useState("whatsapp");
	const [whatsapps, setWhatsapps] = useState([]);
	const [selectedWhatsapps, setSelectedWhatsapps] = useState([]);
	const [loading, setLoading] = useState(false);
	const [queues, setQueues] = useState([]);
	const [allQueues, setAllQueues] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedQueue, setSelectedQueue] = useState(null);
	const { findAll: findAllQueues } = useQueues();
	const [options, setOptions] = useState([]);
	const [searchParam, setSearchParam] = useState("");

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

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
		if (schedule) {
			reset(schedule);
		}
	}, [schedule, reset]);

	useEffect(() => {
		if (searchParam.length < 3) {
			setLoading(false);
			setSelectedQueue("");
			return;
		}
		const delayDebounceFn = setTimeout(() => {
			setLoading(true);
			const fetchUsers = async () => {
				try {
					const { data } = await api.get("/users/");
					setOptions(data.users);
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
		api
			.get(`/whatsapp/filter`, { params: { session: 0, channel: channelFilter } })
			.then(({ data }) => {
				// Mapear os dados recebidos da API para adicionar a propriedade 'selected'
				const mappedWhatsapps = data.map((whatsapp) => ({
					...whatsapp,
					selected: false,
				}));

				setWhatsapps(mappedWhatsapps);
				if (mappedWhatsapps.length && mappedWhatsapps?.length === 1){
					setSelectedWhatsapps(mappedWhatsapps[0].id)
				}
			});
	}, [currentContact, channelFilter])

	useEffect(() => {
		if (contactId && contacts.length) {
			const contact = contacts.find(c => c.id === contactId);
			if (contact) {
				setCurrentContact(contact);
			}
		}
	}, [contactId, contacts]);

	useEffect(() => {
		const { companyId } = user;
		if (open) {
			try {
				(async () => {
					const { data: contactList } = await api.get('/contacts/list', { params: { companyId: companyId } });
					let customList = contactList.map((c) => ({ id: c.id, name: c.name, channel: c.channel }));
					if (isArray(customList)) {
						setContacts([{ id: "", name: "", channel: "" }, ...customList]);
					}
					if (contactId) {
						setSchedule(prevState => {
							return { ...prevState, contactId }
						});
					}

					if (!scheduleId) return;

					const { data } = await api.get(`/schedules/${scheduleId}`);
					setSchedule(prevState => {
						return { ...prevState, ...data, sendAt: moment(data.sendAt).format('YYYY-MM-DDTHH:mm') };
					});
					console.log(data)
					if (data.whatsapp) {
						setSelectedWhatsapps(data.whatsapp.id);
					}

					if (data.ticketUser) {
						setSelectedUser(data.ticketUser);
					}
					if (data.queueId) {
						setSelectedQueue(data.queueId);
					}

					if (data.intervalo) {
						setIntervalo(data.intervalo);
					}

					if (data.tipoDias) {
						setTipoDias(data.tipoDias);
					}

					setCurrentContact(data.contact);
				})()
			} catch (err) {
				toastError(err);
			}
		}
	}, [scheduleId, contactId, open, user]);

	const filterOptions = createFilterOptions({
		trim: true,
	});

	const handleClose = () => {
		onClose();
		setAttachment(null);
		setSchedule(initialState);
	};

	const handleAttachmentFile = (e) => {
		const file = head(e.target.files);
		if (file) {
			setAttachment(file);
		}
	};

	const IconChannel = (channel) => {
		switch (channel) {
			case "facebook":
				return <Facebook style={{ color: "#3b5998", verticalAlign: "middle" }} />;
			case "instagram":
				return <Instagram style={{ color: "#e1306c", verticalAlign: "middle" }} />;
			case "whatsapp":
				return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle" }} />
			default:
				return "error";
		}
	};

	const renderOption = option => {
		if (option.name) {
			return <>
				{IconChannel(option.channel)}
				<Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
					{option.name}
				</Typography>
			</>
		} else {
			return `${i18n.t("newTicketModal.add")} ${option.name}`;
		}
	};
	const handleSaveSchedule = async (values) => {
		const scheduleData = {
			...values, userId: user.id, whatsappId: selectedWhatsapps, ticketUserId: selectedUser?.id || null,
			queueId: selectedQueue || null, intervalo: intervalo || 1, tipoDias: tipoDias || 4
		};

		try {
			if (scheduleId) {
				await api.put(`/schedules/${scheduleId}`, scheduleData);
				if (attachment != null) {
					const formData = new FormData();
					formData.append("file", attachment);
					await api.post(
						`/schedules/${scheduleId}/media-upload`,
						formData
					);
				}
			} else {
				const { data } = await api.post("/schedules", scheduleData);
				if (attachment != null) {
					const formData = new FormData();
					formData.append("file", attachment);
					await api.post(`/schedules/${data.id}/media-upload`, formData);
				}
			}
			toast.success(i18n.t("scheduleModal.success"));
			if (typeof reload == 'function') {
				reload();
			}
			if (contactId) {
				if (typeof cleanContact === 'function') {
					cleanContact();
					history.push('/schedules');
				}
			}
		} catch (err) {
			toastError(err);
		}
		setCurrentContact(initialContact);
		setSchedule(initialState);
		handleClose();
	};
	const handleClickMsgVar = async (msgVar, setValueFunc) => {
		const el = messageInputRef.current;
		const firstHalfText = el.value.substring(0, el.selectionStart);
		const secondHalfText = el.value.substring(el.selectionEnd);
		const newCursorPos = el.selectionStart + msgVar.length;

		setValueFunc("body", `${firstHalfText}${msgVar}${secondHalfText}`);

		await new Promise(r => setTimeout(r, 100));
		messageInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
	};

	const deleteMedia = async () => {
		if (attachment) {
			setAttachment(null);
			attachmentFile.current.value = null;
		}

		if (schedule.mediaPath) {
			await api.delete(`/schedules/${schedule.id}/media-upload`);
			setSchedule((prev) => ({
				...prev,
				mediaPath: null,
			}));
			toast.success(i18n.t("scheduleModal.toasts.deleted"));
			if (typeof reload == "function") {
				console.log(reload);
				console.log("1");
				reload();
			}
		}
	};

	return (
		<Box sx={{ display: "flex", flexWrap: "wrap" }}>
			<ConfirmationModal
				title={i18n.t("scheduleModal.confirmationModal.deleteTitle")}
				open={confirmationOpen}
				onClose={() => setConfirmationOpen(false)}
				onConfirm={deleteMedia}
			>
				{i18n.t("scheduleModal.confirmationModal.deleteMessage")}
			</ConfirmationModal>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="md"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{schedule.status === 'ERRO' ? 'Erro de Envio' : `Mensagem ${capitalize(schedule.status)}`}
				</DialogTitle>
				<div style={{ display: "none" }}>
					<input
						type="file"
						accept=".png,.jpg,.jpeg"
						ref={attachmentFile}
						onChange={(e) => handleAttachmentFile(e)}
					/>
				</div>
				<Box component="form" onSubmit={handleSubmit(handleSaveSchedule)}>
							<DialogContent dividers>
								<Box sx={{ mb: 2 }}>
									<FormControl
										variant="outlined"
										fullWidth
									>
										<Autocomplete
											fullWidth
											value={currentContact}
											options={contacts}
											onChange={(e, contact) => {
												const contactId = contact ? contact.id : '';
												setSchedule({ ...schedule, contactId });
												setCurrentContact(contact ? contact : initialContact);
												setChannelFilter(contact ? contact.channel : "whatsapp");
											}}
											getOptionLabel={(option) => option.name}
											renderOption={renderOption}
											isOptionEqualToValue={(option, value) => {
												return value.id === option.id
											}}
											renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Contato" />}
										/>
									</FormControl>
								</Box>
								<Box sx={{ mb: 2 }}>
									<Controller
										name="body"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												rows={9}
												multiline={true}
												label={i18n.t("scheduleModal.form.body")}
												inputRef={messageInputRef}
												error={Boolean(errors.body)}
												helperText={errors.body?.message}
												variant="outlined"
												margin="dense"
												fullWidth
											/>
										)}
									/>
								</Box>
								<Grid item xs={12} md={12} xl={6}>
									<MessageVariablesPicker
										disabled={isSubmitting}
										onClick={value => handleClickMsgVar(value, setValue)}
									/>
								</Grid>
								<Grid container spacing={1}>
									<Grid item xs={12} md={6} xl={6}>
										<FormControl
											variant="outlined"
											margin="dense"
											fullWidth
											sx={{ mt: 1 }}
										>
											<InputLabel id="whatsapp-selection-label">
												{i18n.t("campaigns.dialog.form.whatsapp")}
											</InputLabel>
											<Select
												label={i18n.t("campaigns.dialog.form.whatsapp")}
												placeholder={i18n.t("campaigns.dialog.form.whatsapp")}
												labelId="whatsapp-selection-label"
												id="whatsappIds"
												name="whatsappIds"
												required
												value={selectedWhatsapps}
												onChange={(event) => setSelectedWhatsapps(event.target.value)}
											>
												{whatsapps &&
													whatsapps.map((whatsapp) => (
														<MenuItem key={whatsapp.id} value={whatsapp.id}>
															{whatsapp.name}
														</MenuItem>
													))}
											</Select>
										</FormControl>
									</Grid>
									<Grid item xs={12} md={12} xl={6}>
										<FormControl
											variant="outlined"
											margin="dense"
											fullWidth
											sx={{ mt: 1 }}
										>
											<InputLabel id="openTicket-selection-label">
												{i18n.t("campaigns.dialog.form.openTicket")}
											</InputLabel>
											<Controller
												name="openTicket"
												control={control}
												render={({ field }) => (
													<Select
														{...field}
														label={i18n.t("campaigns.dialog.form.openTicket")}
														placeholder={i18n.t(
															"campaigns.dialog.form.openTicket"
														)}
														labelId="openTicket-selection-label"
														id="openTicket"
														error={Boolean(errors.openTicket)}
													>
														<MenuItem value={"enabled"}>{i18n.t("campaigns.dialog.form.enabledOpenTicket")}</MenuItem>
														<MenuItem value={"disabled"}>{i18n.t("campaigns.dialog.form.disabledOpenTicket")}</MenuItem>
													</Select>
												)}
											/>
										</FormControl>
									</Grid>
								</Grid>
								<Grid spacing={1} container>
									{/* SELECIONAR USUARIO */}
									<Grid item xs={12} md={6} xl={6}>
										<Autocomplete
											style={{ marginTop: '8px' }}
											variant="outlined"
											margin="dense"
											sx={{ mt: 1 }}
											getOptionLabel={(option) => `${option.name}`}
											value={selectedUser}
											size="small"
											onChange={(e, newValue) => {
												setSelectedUser(newValue);
												if (newValue != null && Array.isArray(newValue.queues)) {
													if (newValue.queues.length === 1) {
														setSelectedQueue(newValue.queues[0].id);
													}
													setQueues(newValue.queues);

												} else {
													setQueues(allQueues);
													setSelectedQueue("");
												}
											}}
											options={options}
											filterOptions={filterOptions}
											freeSolo
											fullWidth
											disabled={watchedValues.openTicket === "disabled"}
											autoHighlight
											noOptionsText={i18n.t("transferTicketModal.noOptions")}
											loading={loading}
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
															<React.Fragment>
																{loading ? (
																	<CircularProgress color="inherit" size={20} />
																) : null}
																{params.InputProps.endAdornment}
															</React.Fragment>
														),
													}}
												/>
											)}
										/>
									</Grid>

									<Grid item xs={12} md={6} xl={6}>
										<FormControl
											variant="outlined"
											margin="dense"
											fullWidth
											sx={{ mt: 1 }}
										>
											<InputLabel>
												{i18n.t("transferTicketModal.fieldQueueLabel")}
											</InputLabel>
											<Select
												value={selectedQueue}
												onChange={(e) => setSelectedQueue(e.target.value)}
												label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
												disabled={watchedValues.openTicket === "disabled"}
											>
												{queues.map((queue) => (
													<MenuItem key={queue.id} value={queue.id}>
														{queue.name}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Grid>
								</Grid>
								<Grid spacing={1} container style={{ marginTop: '-10px' }}>
									<Grid item xs={12} md={6} xl={6}>
										<FormControl
											variant="outlined"
											margin="dense"
											fullWidth
											sx={{ mt: 1 }}
										>
											<InputLabel id="statusTicket-selection-label">
												{i18n.t("campaigns.dialog.form.statusTicket")}
											</InputLabel>
											<Controller
												name="statusTicket"
												control={control}
												render={({ field }) => (
													<Select
														{...field}
														disabled={watchedValues.openTicket === "disabled"}
														label={i18n.t("campaigns.dialog.form.statusTicket")}
														placeholder={i18n.t(
															"campaigns.dialog.form.statusTicket"
														)}
														labelId="statusTicket-selection-label"
														id="statusTicket"
														error={Boolean(errors.statusTicket)}
													>
														<MenuItem value={"closed"}>{i18n.t("campaigns.dialog.form.closedTicketStatus")}</MenuItem>
														<MenuItem value={"open"}>{i18n.t("campaigns.dialog.form.openTicketStatus")}</MenuItem>
													</Select>
												)}
											/>
										</FormControl>
									</Grid>

									<Grid item xs={12} md={6} xl={6}>
										<Controller
											name="sendAt"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													label={i18n.t("scheduleModal.form.sendAt")}
													type="datetime-local"
													error={Boolean(errors.sendAt)}
													helperText={errors.sendAt?.message}
													variant="outlined"
													fullWidth
													size="small"
													style={{ marginTop: '8px' }}
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12} md={6} xl={6}>
										<FormControlLabel
											control={
												<Controller
													name="assinar"
													control={control}
													render={({ field }) => (
														<Switch
															{...field}
															checked={field.value}
															color="primary"
															disabled={watchedValues.openTicket === "disabled"}
														/>
													)}
												/>
											}
											label={i18n.t("scheduleModal.form.assinar")}
										/>
									</Grid>
								</Grid>
								<h3>Recorrência</h3>
								<p>
									Você pode escolher enviar a mensagem de forma recorrente e
									escolher o intervalo. Caso seja uma mensagem a ser enviada
									uma unica vez, não altere nada nesta seção.
								</p>
								<br />
								<Grid container spacing={1}>
									<Grid item xs={12} md={4} xl={4}>
										<FormControl size="small" fullWidth variant="outlined">
											<InputLabel id="demo-simple-select-label">Intervalo</InputLabel>
											<Select
												labelId="demo-simple-select-label"
												id="demo-simple-select"
												value={intervalo}
												// name="intervalo"
												onChange={(e) =>
													setIntervalo(e.target.value || 1)
												}
												label="Intervalo"
											>
												<MenuItem value={1}>Dias</MenuItem>
												<MenuItem value={2}>Semanas</MenuItem>
												<MenuItem value={3}>Meses</MenuItem>
												<MenuItem value={4}>Minutos</MenuItem>
											</Select>
										</FormControl>
									</Grid>

									<Grid item xs={12} md={4} xl={4}>
										<Controller
											name="valorIntervalo"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													label="Valor do Intervalo"
													size="small"
													error={Boolean(errors.valorIntervalo)}
													helperText={errors.valorIntervalo?.message}
													InputLabelProps={{ shrink: true }}
													variant="outlined"
													fullWidth
													type="number"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12} md={4} xl={4}>
										<Controller
											name="enviarQuantasVezes"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													label="Enviar quantas vezes"
													size="small"
													error={Boolean(errors.enviarQuantasVezes)}
													helperText={errors.enviarQuantasVezes?.message}
													variant="outlined"
													fullWidth
													type="number"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12} md={12} xl={12}>
										<FormControl size="small" fullWidth variant="outlined">
											<InputLabel id="demo-simple-select-label">Enviar quantas vezes</InputLabel>
											<Select
												labelId="demo-simple-select-label"
												id="demo-simple-select"
												value={tipoDias}
												onChange={(e) =>
													setTipoDias(e.target.value || 4)
												}
												label="Enviar quantas vezes"
											>
												<MenuItem value={4}>Enviar normalmente em dias não úteis</MenuItem>
												<MenuItem value={5}>Enviar um dia útil antes</MenuItem>
												<MenuItem value={6}>Enviar um dia útil depois</MenuItem>
											</Select>
										</FormControl>
									</Grid>
								</Grid>
								{(schedule.mediaPath || attachment) && (
									<Grid xs={12} item>
										<Button startIcon={<AttachFile />}>
											{attachment ? attachment.name : schedule.mediaName}
										</Button>
										<IconButton
											onClick={() => setConfirmationOpen(true)}
											color="secondary"
										>
											<DeleteOutline color="secondary" />
										</IconButton>
									</Grid>
								)}
							</DialogContent>
							<DialogActions>
								{!attachment && !schedule.mediaPath && (
									<Button
										color="primary"
										onClick={() => attachmentFile.current.click()}
										disabled={isSubmitting}
										variant="outlined"
									>
										{i18n.t("quickMessages.buttons.attach")}
									</Button>
								)}
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("scheduleModal.buttons.cancel")}
								</Button>
								{(schedule.sentAt === null || schedule.sentAt === "") && (
									<Button
										type="submit"
										color="primary"
										disabled={isSubmitting}
										variant="contained"
										sx={{ position: 'relative' }}
									>
										{scheduleId
											? `${i18n.t("scheduleModal.buttons.okEdit")}`
											: `${i18n.t("scheduleModal.buttons.okAdd")}`}
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
								)}
							</DialogActions>
				</Box>
			</Dialog>
		</Box>
	);
};

export default ScheduleModal;