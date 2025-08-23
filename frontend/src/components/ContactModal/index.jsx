import React, { useState, useEffect, useRef } from "react";
import { parseISO, format } from "date-fns";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "../../components/ui/ToastProvider";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { TagsContainer } from "../TagsContainer";
// import AsyncSelect from "../AsyncSelect";

const contactModalStyles = {
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	textField: {
		marginRight: 1,
		flex: 1,
	},
	extraAttr: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	btnWrapper: {
		position: "relative",
	},
	buttonProgress: {
		color: "#4caf50",
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: "-12px",
		marginLeft: "-12px",
	},
};

const contactSchema = z.object({
	name: z.string()
		.min(2, "Too Short!")
		.max(250, "Too Long!")
		.nonempty("Required"),
	number: z.string().min(8, "Too Short!").max(50, "Too Long!").optional().or(z.literal("")),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	disableBot: z.boolean().optional(),
	lgpdAcceptedAt: z.string().optional(),
	extraInfo: z.array(z.object({
		name: z.string().optional(),
		value: z.string().optional()
	})).optional()
});

const ContactModal = ({ open, onClose, contactId, initialValues, onSave }) => {
	const isMounted = useRef(true);

	const initialState = {
		name: "",
		number: "",
		email: "",
		disableBot: false,
		lgpdAcceptedAt: "",
		extraInfo: []
	};

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm({
		resolver: zodResolver(contactSchema),
		defaultValues: initialState,
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "extraInfo"
	});

	const [contact, setContact] = useState(initialState);
	const [disableBot, setDisableBot] = useState(false);
	const watchedValues = watch();
	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		const fetchContact = async () => {
			if (initialValues) {
				setContact(prevState => {
					return { ...prevState, ...initialValues };
				});
				reset(initialValues);
			}

			if (!contactId) return;

			try {
				const { data } = await api.get(`/contacts/${contactId}`);
				if (isMounted.current) {
					setContact(data);
					setDisableBot(data.disableBot);
					reset(data);
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchContact();
	}, [contactId, open, initialValues, reset]);

	const handleClose = () => {
		onClose();
		setContact(initialState);
		reset(initialState);
	};

	const handleSaveContact = async values => {
		try {
			if (contactId) {
				await api.put(`/contacts/${contactId}`, { ...values, disableBot: disableBot });
				handleClose();
			} else {
				const { data } = await api.post("/contacts", { ...values, disableBot: disableBot });
				if (onSave) {
					onSave(data);
				}
				handleClose();
			}
			toast.success(i18n.t("contactModal.success"));
		} catch (err) {
			toastError(err);
		}
	};

	return (
		<Box sx={contactModalStyles.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="lg" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{contactId
						? `${i18n.t("contactModal.title.edit")}`
						: `${i18n.t("contactModal.title.add")}`}
				</DialogTitle>
				<Box component="form" onSubmit={handleSubmit(handleSaveContact)}>
					<DialogContent dividers>
						<Typography variant="subtitle1" gutterBottom>
							{i18n.t("contactModal.form.mainInfo")}
						</Typography>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={i18n.t("contactModal.form.name")}
									autoFocus
									error={Boolean(errors.name)}
									helperText={errors.name?.message}
									variant="outlined"
									margin="dense"
									sx={contactModalStyles.textField}
								/>
							)}
						/>
						<Controller
							name="number"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={i18n.t("contactModal.form.number")}
									error={Boolean(errors.number)}
									helperText={errors.number?.message}
									placeholder="5513912344321"
									variant="outlined"
									margin="dense"
								/>
							)}
						/>
						<Box>
							<Controller
								name="email"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={i18n.t("contactModal.form.email")}
										error={Boolean(errors.email)}
										helperText={errors.email?.message}
										placeholder="Email address"
										fullWidth
										margin="dense"
										variant="outlined"
									/>
								)}
							/>
						</Box>
						<Box>
							<TagsContainer contact={contact} sx={contactModalStyles.textField} />
						</Box>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									<Switch
										size="small"
										checked={disableBot}
										onChange={() =>
											setDisableBot(!disableBot)
										}
										name="disableBot"
									/>
									{i18n.t("contactModal.form.chatBotContact")}
								</Typography>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.whatsapp")} {contact?.whatsapp ? contact?.whatsapp.name : ""}
								</Typography>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.termsLGDP")} {contact?.lgpdAcceptedAt ? format(new Date(contact?.lgpdAcceptedAt), "dd/MM/yyyy 'às' HH:mm") : ""}
								</Typography>

								{/* <Typography variant="subtitle1" gutterBottom>{i18n.t("contactModal.form.customer_portfolio")}</Typography> */}
								{/* <div style={{ marginTop: 10 }}>
									<AsyncSelect url="/users" dictKey={"users"}
										initialValue={values.user} width="100%" label={i18n.t("contactModal.form.attendant")}
										onChange={(event, value) => setFieldValue("userId", value ? value.id : null)} />
								</div>
								<div style={{ marginTop: 10 }}>
									<AsyncSelect url="/queue" dictKey={null}
										initialValue={values.queue} width="100%" label={i18n.t("contactModal.form.queue")}
										onChange={(event, value) => setFieldValue("queueId", value ? value.id : null)} />
								</div> */}
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.extraInfo")}
								</Typography>

						<Box>
							{fields.map((field, index) => (
								<Box
									sx={contactModalStyles.extraAttr}
									key={field.id}
								>
									<Controller
										name={`extraInfo.${index}.name`}
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												label={i18n.t("contactModal.form.extraName")}
												variant="outlined"
												margin="dense"
												sx={contactModalStyles.textField}
											/>
										)}
									/>
									<Controller
										name={`extraInfo.${index}.value`}
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												label={i18n.t("contactModal.form.extraValue")}
												variant="outlined"
												margin="dense"
												sx={contactModalStyles.textField}
											/>
										)}
									/>
									<IconButton
										size="small"
										onClick={() => remove(index)}
									>
										<DeleteOutlineIcon />
									</IconButton>
								</Box>
							))}
							<Box sx={contactModalStyles.extraAttr}>
								<Button
									style={{ flex: 1, marginTop: 8 }}
									variant="outlined"
									color="primary"
									onClick={() => append({ name: "", value: "" })}
								>
									{`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
								</Button>
							</Box>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleClose}
							color="secondary"
							disabled={isSubmitting}
							variant="outlined"
						>
							{i18n.t("contactModal.buttons.cancel")}
						</Button>
						<Button
							type="submit"
							color="primary"
							disabled={isSubmitting}
							variant="contained"
							sx={contactModalStyles.btnWrapper}
						>
							{contactId
								? `${i18n.t("contactModal.buttons.okEdit")}`
								: `${i18n.t("contactModal.buttons.okAdd")}`}
							{isSubmitting && (
								<CircularProgress
									size={24}
									sx={contactModalStyles.buttonProgress}
								/>
							)}
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
		</Box>
	);
};

export default ContactModal;
