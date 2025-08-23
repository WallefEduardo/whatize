import React, { useState, useEffect, useRef, useContext } from "react";

import * as Yup from "yup";
// Removido: Formik não usado - componente usa useState
import { toast } from "../ui/ToastProvider";

// Removido: makeStyles migrado para sx prop
import { green } from "@mui/material/colors";
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

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = () => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	textField: {
		marginRight: 8,
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
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
});

const ContactSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Muito curto!")
		.max(50, "Muito longo!")
		.required("Digite um nome!"),
});

const WebhookModal = ({ open, onClose, webhookId, nameWebhook, initialValues, onSave }) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const [contact, setContact] = useState({
		name: nameWebhook,
	});

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleClose = () => {
		onClose();
		setContact({
			name: "",
		});
	};

	const handleSaveContact = async values => {
		if(webhookId){
			try {
				await api.put("/webhook", {
					name: values.name,
					webhookId
				  });
				  onSave(values.name)
				  handleClose()
				toast.success(i18n.t("webhookModal.toasts.update"));
			} catch (err) {
				toastError(err);
			}
		} else {
		try {
			await api.post("/webhook", {
				name: values.name,
			  });
			  onSave(values.name)
			  handleClose()
			toast.success(i18n.t("webhookModal.saveSuccess"));
		} catch (err) {
			toastError(err);
		}
	}
	};

	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} fullWidth="md" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{webhookId
						? `${i18n.t("webhookModal.title.edit")}`
						: `${i18n.t("webhookModal.title.add")}`}
				</DialogTitle>
				<Box component="form" onSubmit={handleSubmit(handleSaveContact)}>
					<DialogContent dividers>
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
									sx={webhookModalStyles.textField}
									style={{width: '95%'}}
								/>
							)}
						/>
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
							sx={webhookModalStyles.btnWrapper}
						>
							{webhookId
								? `${i18n.t("contactModal.buttons.okEdit")}`
								: `${i18n.t("contactModal.buttons.okAdd")}`}
							{isSubmitting && (
								<CircularProgress
									size={24}
									sx={webhookModalStyles.buttonProgress}
								/>
							)}
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
		</Box>
	);
};

export default WebhookModal;