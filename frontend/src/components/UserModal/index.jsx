import React, { useState, useEffect, useContext, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../ui/ToastProvider";

import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import whatsappIcon from '../../assets/nopicture.png'
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import { AuthContext } from "../../context/Auth/AuthContext";
import useWhatsApps from "../../hooks/useWhatsApps";

import { Can } from "../Can";
import { Avatar, Grid, Input, Paper, Tab, Tabs } from "@mui/material";
import { getBackendUrl } from "../../config";
import TabPanel from "../TabPanel";
import AvatarUploader from "../AvatarUpload";

const backendUrl = getBackendUrl();

const useStyles = () => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: 8,
		},
	},
	btnWrapper: {
		position: "relative",
	},
	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
	formControl: {
		margin: 8,
		minWidth: 120,
	},
	textField: {
		marginRight: 8,
		flex: 1,
	},
	container: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	avatar: {
		width: 8,
		height: 8,
		margin: 16,
		cursor: 'pointer',
		borderRadius: '50%',
		border: '2px solid #ccc',
	},
	updateDiv: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	},
	updateInput: {
		display: 'none',
	},
	updateLabel: {
		padding: 8,
		margin: 8,
		textTransform: 'uppercase',
		textAlign: 'center',
		cursor: 'pointer',
		border: '2px solid #ccc',
		borderRadius: '5px',
		minWidth: 160,
		fontWeight: 'bold',
		color: '#555',
	},
	errorUpdate: {
		border: '2px solid red',
	},
	errorText: {
		color: 'red',
		fontSize: '0.8rem',
		fontWeight: 'bold',
	},
	mainPaper: {
		flex: 1,
		padding: 8,
	},
	paper: {
		padding: 8,
	},
	tab: {
		backgroundColor: "#f6f6f6",
	},
	maxWidth: {
		width: "100%",
	},
});

const UserSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
	password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email").required("Required"),
	allHistoric: Yup.string().nullable(),
	startWork: Yup.string()
		.required("Horário de início é obrigatório")
		.test(
			'not-both-zero',
			'Início e fim de trabalho não podem ser ambos 00:00. Isso bloquearia o acesso ao sistema.',
			function(value) {
				const { endWork } = this.parent;
				// Se ambos forem 00:00, retorna erro
				if (value === '00:00' && endWork === '00:00') {
					return false;
				}
				return true;
			}
		),
	endWork: Yup.string().required("Horário de fim é obrigatório")
		.test(
			'not-both-zero',
			'Início e fim de trabalho não podem ser ambos 00:00. Isso bloquearia o acesso ao sistema.',
			function(value) {
				const { startWork } = this.parent;
				// Se ambos forem 00:00, retorna erro
				if (value === '00:00' && startWork === '00:00') {
					return false;
				}
				return true;
			}
		)
		.test(
			'valid-time-range',
			'Horário de fim deve ser posterior ao início',
			function(value) {
				const { startWork } = this.parent;
				if (startWork && value && value !== '00:00') {
					const startMinutes = startWork.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
					const endMinutes = value.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
					if (endMinutes <= startMinutes) {
						return false;
					}
				}
				return true;
			}
		)
});

const userSchema = z.object({
	name: z.string().min(2, "Muito curto!").max(50, "Muito longo!"),
	email: z.string().email("Email inválido"),
	password: z.string().min(5, "Muito curto!").max(50, "Muito longo!").optional(),
	profile: z.string(),
	startWork: z.string(),
	endWork: z.string(),
	farewellMessage: z.string().optional(),
	allTicket: z.string(),
	allowGroup: z.boolean(),
	defaultTheme: z.string(),
	defaultMenu: z.string(),
	allHistoric: z.string(),
	allUserChat: z.string(),
	userClosePendingTicket: z.string(),
	showDashboard: z.string(),
	allowRealTime: z.string(),
	allowConnections: z.string(),
}).refine((data) => {
	// Valida se ambos não são 00:00
	if (data.startWork === '00:00' && data.endWork === '00:00') {
		return false;
	}
	return true;
}, {
	message: "Horários inválidos",
	path: ["startWork"]
});

const UserModal = ({ open, onClose, userId }) => {

	const initialState = {
		name: "",
		email: "",
		password: "",
		profile: "user",
		startWork: "00:00",
		endWork: "23:59",
		farewellMessage: "",
		allTicket: "disable",
		allowGroup: false,
		defaultTheme: "light",
		defaultMenu: "open",
		allHistoric: "disabled",
		allUserChat: "disabled",
		userClosePendingTicket: "disabled",
		showDashboard: "disabled",
		allowRealTime: "disabled",
		allowConnections: "disabled",
	};

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(userSchema),
		defaultValues: initialState,
	});

	const { user: loggedInUser } = useContext(AuthContext);
	const watchedValues = watch();

	const [user, setUser] = useState(initialState);
	const [selectedQueueIds, setSelectedQueueIds] = useState([]);
	const [whatsappId, setWhatsappId] = useState(false);
	// const [allTicket, setAllTicket] = useState("disable");
	const { loading, whatsApps } = useWhatsApps();
	const [profileUrl, setProfileUrl] = useState(null)
	const [tab, setTab] = useState("general");
	const [avatar, setAvatar] = useState(null);
	const startWorkRef = useRef();
	const endWorkRef = useRef();



	useEffect(() => {
		const fetchUser = async () => {

			if (!userId) return;
			try {
				const { data } = await api.get(`/users/${userId}`);
				setUser(prevState => {
					return { ...prevState, ...data };
				});
				reset(data);

				const { profileImage } = data;
				setProfileUrl(`${backendUrl}/public/company${data.companyId}/user/${profileImage}`);

				const userQueueIds = data.queues?.map(queue => queue.id);
				setSelectedQueueIds(userQueueIds);
				setWhatsappId(data.whatsappId ? data.whatsappId : '');
			} catch (err) {
				toastError(err);
			}
		};

		fetchUser();
	}, [userId, open, reset]);

	const handleClose = () => {
		onClose();
		setUser(initialState);
		reset(initialState);
	};

	const handleTabChange = (event, newValue) => {
		setTab(newValue);
	};

	const handleSaveUser = async (values) => {

		// Validação adicional para horários de trabalho
		if (values.startWork === '00:00' && values.endWork === '00:00') {
			toast.error('Erro: Início e fim de trabalho não podem ser ambos 00:00. Isso bloquearia o acesso ao sistema.');
			return;
		}

		const uploadAvatar = async (file) => {
			const formData = new FormData();
			formData.append('userId', file.id);
			formData.append('typeArch', "user");
			formData.append('profileImage', avatar);

			const { data } = await api.post(`/users/${file.id}/media-upload`, formData);

			localStorage.setItem("profileImage", data.user.profileImage);
			window.location.reload();
		}



		const userData = {
			...values,
			whatsappId,
			queueIds: selectedQueueIds
		};
		console.log("userData", userData)
		try {
			if (userId) {
				const { data } = await api.put(`/users/${userId}`, userData);
				console.log("avatar", avatar, user?.profileImage, avatar?.name)
				if (avatar && (!user?.profileImage || !user?.profileImage !== avatar.name))// getBasename(avatar)))
					uploadAvatar(data)
			} else {
				await api.post("/users", userData);

				if (!user?.profileImage && avatar)
					uploadAvatar(user)
			}
			if (userId === loggedInUser.id) {
				handleClose();
				toast.success(i18n.t("userModal.success"));
				// window.location.reload(	);
			} else {
				handleClose();
				toast.success(i18n.t("userModal.success"));
			}
		} catch (err) {
			toastError(err);
		}
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{userId
						? `${i18n.t("userModal.title.edit")}`
						: `${i18n.t("userModal.title.add")}`}
				</DialogTitle>
				<Formik
					initialValues={user}
					enableReinitialize={true}
					validationSchema={UserSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveUser(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, setFieldValue }) => (
						<Form>
							<Paper className={classes.mainPaper} elevation={0}>
								<Tabs
									value={tab}
									indicatorColor="primary"
									textColor="primary"
									scrollButtons="on"
									variant="scrollable"
									onChange={handleTabChange}
									className={classes.tab}
								>
									<Tab label={i18n.t("userModal.tabs.general")} value={"general"} />
									<Tab label={i18n.t("userModal.tabs.permissions")} value={"permissions"} />
								</Tabs>
							</Paper>
							<Paper className={classes.paper} elevation={0}>
								<DialogContent dividers>
									<TabPanel
										className={classes.container}
										value={tab}
										name={"general"}
									>
										<Grid
											container
											spacing={1}
											alignContent="center"
											alignItems="center"
											justifyContent="center">
											<FormControl className={classes.updateDiv}>
												<AvatarUploader
													setAvatar={setAvatar}
													avatar={user.profileImage}
													companyId={user.companyId}
												/>
												{user.profileImage &&
													<Button
														variant="outlined"
														color="secondary"
														onClick={() => {
															user.profileImage = null;
															setFieldValue("profileImage", null);
															setAvatar(null);
														}}
													>
														{i18n.t("userModal.title.removeImage")}
													</Button>
												}
											</FormControl>
										</Grid>
										<Grid container spacing={1}>
											<Grid item xs={12} md={6} xl={6}>
												<Field
													as={TextField}
													label={i18n.t("userModal.form.name")}
													autoFocus
													name="name"
													error={touched.name && Boolean(errors.name)}
													helperText={touched.name && errors.name}
													variant="outlined"
													margin="dense"
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={6} xl={6}>
												<Field
													as={TextField}
													label={i18n.t("userModal.form.password")}
													type="password"
													name="password"
													error={touched.password && Boolean(errors.password)}
													helperText={touched.password && errors.password}
													variant="outlined"
													margin="dense"
													fullWidth
												/>
											</Grid>
										</Grid>
										<Grid container spacing={1}>
											<Grid item xs={12} md={8} xl={8}>
												<Field
													as={TextField}
													label={i18n.t("userModal.form.email")}
													name="email"
													error={touched.email && Boolean(errors.email)}
													helperText={touched.email && errors.email}
													variant="outlined"
													margin="dense"
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={4} xl={4}>
												<FormControl
													variant="outlined"
													//className={classes.formControl}
													margin="dense"
													fullWidth
												>
													<Can
														role={loggedInUser.profile}
														perform="user-modal:editProfile"
														yes={() => (
															<>
																<InputLabel id="profile-selection-input-label">
																	{i18n.t("userModal.form.profile")}
																</InputLabel>

																<Field
																	as={Select}
																	label={i18n.t("userModal.form.profile")}
																	name="profile"
																	labelId="profile-selection-label"
																	id="profile-selection"
																	required
																>
																	<MenuItem value="admin">Admin</MenuItem>
																	<MenuItem value="user">Usuário</MenuItem>
																</Field>
															</>
														)}
													/>
												</FormControl>
											</Grid>
										</Grid>
										<Grid container spacing={1}>
											<Grid item xs={12} md={12} xl={12}>
												<Can
													role={loggedInUser.profile}
													perform="user-modal:editQueues"
													yes={() => (
														<QueueSelect
															selectedQueueIds={selectedQueueIds}
															onChange={values => setSelectedQueueIds(values)}
															fullWidth
														/>
													)}
												/>
											</Grid>
										</Grid>
										<Grid container spacing={1}>
											<Grid item xs={12} md={12} xl={12}>
												<Can
													role={loggedInUser.profile}
													perform="user-modal:editProfile"
													yes={() => (
														<FormControl variant="outlined" margin="dense" className={classes.maxWidth} fullWidth>
															<InputLabel>
																{i18n.t("userModal.form.whatsapp")}
															</InputLabel>
															<Field
																as={Select}
																value={whatsappId}
																onChange={(e) => setWhatsappId(e.target.value)}
																label={i18n.t("userModal.form.whatsapp")}

															>
																<MenuItem value={''}>&nbsp;</MenuItem>
																{whatsApps.map((whatsapp) => (
																	<MenuItem key={whatsapp.id} value={whatsapp.id}>{whatsapp.name}</MenuItem>
																))}
															</Field>
														</FormControl>
													)}
												/>
											</Grid>
										</Grid>
										<Can
											role={loggedInUser.profile}
											perform="user-modal:editProfile"
											yes={() => (
												<Grid container spacing={1}>
													<Grid item xs={12} md={6} xl={6}>
														<Field
															as={TextField}
															label={i18n.t("userModal.form.startWork")}
															type="time"
															ampm={"false"}
															inputRef={startWorkRef}
															InputLabelProps={{
																shrink: true,
															}}
															inputProps={{
																step: 600, // 5 min
															}}
															fullWidth
															name="startWork"
															error={
																touched.startWork && Boolean(errors.startWork)
															}
															helperText={
																touched.startWork && errors.startWork
															}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
													</Grid>
													<Grid item xs={12} md={6} xl={6}>
														<Field
															as={TextField}
															label={i18n.t("userModal.form.endWork")}
															type="time"
															ampm={"false"}
															inputRef={endWorkRef}
															InputLabelProps={{
																shrink: true,
															}}
															inputProps={{
																step: 600, // 5 min
															}}
															fullWidth
															name="endWork"
															error={
																touched.endWork && Boolean(errors.endWork)
															}
															helperText={
																touched.endWork && errors.endWork
															}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
													</Grid>
													<Grid item xs={12}>
														<div style={{ 
															backgroundColor: '#fff3cd', 
															border: '1px solid #ffeaa7', 
															borderRadius: '4px', 
															padding: '8px 12px', 
															marginTop: '8px',
															fontSize: '0.875rem',
															color: '#856404'
														}}>
															<strong>⚠️ Atenção:</strong> Os horários de início e fim de trabalho definem quando o usuário pode acessar o sistema. 
															Não configure ambos como 00:00, pois isso bloqueará completamente o acesso do usuário.
														</div>
													</Grid>
												</Grid>
											)}
										/>

										<Field
											as={TextField}
											label={i18n.t("userModal.form.farewellMessage")}
											type="farewellMessage"
											multiline
											rows={4}
											fullWidth
											name="farewellMessage"
											error={touched.farewellMessage && Boolean(errors.farewellMessage)}
											helperText={touched.farewellMessage && errors.farewellMessage}
											variant="outlined"
											margin="dense"
										/>

										<Grid container spacing={1}>
											<Grid item xs={12} md={6} xl={6}>
												<FormControl
													variant="outlined"
													className={classes.maxWidth}
													margin="dense"
													fullWidth
												>
													<>
														<InputLabel >
															{i18n.t("userModal.form.defaultTheme")}
														</InputLabel>

														<Field
															as={Select}
															label={i18n.t("userModal.form.defaultTheme")}
															name="defaultTheme"
															type="defaultTheme"
															required
														>
															<MenuItem value="light">{i18n.t("userModal.form.defaultThemeLight")}</MenuItem>
															{/* <MenuItem value="dark">{i18n.t("userModal.form.defaultThemeDark")}</MenuItem> */}
														</Field>
													</>
												</FormControl>
											</Grid>
											<Grid item xs={12} md={6} xl={6}>

												<FormControl
													variant="outlined"
													className={classes.maxWidth}
													margin="dense"
													fullWidth
												>
													<>
														<InputLabel >
															{i18n.t("userModal.form.defaultMenu")}
														</InputLabel>

														<Field
															as={Select}
															label={i18n.t("userModal.form.defaultMenu")}
															name="defaultMenu"
															type="defaultMenu"
															required
														>
															<MenuItem value={"open"}>{i18n.t("userModal.form.defaultMenuOpen")}</MenuItem>
															<MenuItem value={"closed"}>{i18n.t("userModal.form.defaultMenuClosed")}</MenuItem>
														</Field>
													</>
												</FormControl>
											</Grid>
										</Grid>
									</TabPanel>
									<TabPanel
										className={classes.container}
										value={tab}
										name={"permissions"}
									>
										<Can
											role={loggedInUser.profile}
											perform="user-modal:editProfile"
											yes={() =>
												<>
													<Grid container spacing={1}>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allTicket")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allTicket")}
																		name="allTicket"
																		type="allTicket"
																		required
																	>
																		<MenuItem value="enable">{i18n.t("userModal.form.allTicketEnable")}</MenuItem>
																		<MenuItem value="disable">{i18n.t("userModal.form.allTicketDisable")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allowGroup")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allowGroup")}
																		name="allowGroup"
																		type="allowGroup"
																		required
																	>
																		<MenuItem value={true}>{i18n.t("userModal.form.allTicketEnable")}</MenuItem>
																		<MenuItem value={false}>{i18n.t("userModal.form.allTicketDisable")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
													</Grid>
													<Grid container spacing={1}>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allHistoric")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allHistoric")}
																		name="allHistoric"
																		type="allHistoric"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allUserChat")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allUserChat")}
																		name="allUserChat"
																		type="allUserChat"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
													</Grid>
													<Grid container spacing={1}>
														<Grid item xs={12} md={6} xl={6}>

															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.userClosePendingTicket")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.userClosePendingTicket")}
																		name="userClosePendingTicket"
																		type="userClosePendingTicket"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allowConnections")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allowConnections")}
																		name="allowConnections"
																		type="allowConnections"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
													</Grid>
													<Grid container spacing={1}>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.showDashboard")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.showDashboard")}
																		name="showDashboard"
																		type="showDashboard"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
														<Grid item xs={12} md={6} xl={6}>
															<FormControl
																variant="outlined"
																className={classes.maxWidth}
																margin="dense"
																fullWidth
															>
																<>
																	<InputLabel >
																		{i18n.t("userModal.form.allowRealTime")}
																	</InputLabel>

																	<Field
																		as={Select}
																		label={i18n.t("userModal.form.allowRealTime")}
																		name="allowRealTime"
																		type="allowRealTime"
																		required
																	>
																		<MenuItem value="disabled">{i18n.t("userModal.form.allHistoricDisabled")}</MenuItem>
																		<MenuItem value="enabled">{i18n.t("userModal.form.allHistoricEnabled")}</MenuItem>
																	</Field>
																</>
															</FormControl>
														</Grid>
													</Grid>
												</>
											}
										/>
									</TabPanel>
								</DialogContent>
							</Paper>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("userModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{userId
										? `${i18n.t("userModal.buttons.okEdit")}`
										: `${i18n.t("userModal.buttons.okAdd")}`}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div >
	);
};

export default UserModal;
