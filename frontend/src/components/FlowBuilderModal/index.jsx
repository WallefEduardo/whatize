import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../ui/ToastProvider";
// Removido: makeStyles migrado para sx prop

import {
	Button,
	TextField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
} from "@mui/material";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";

// Estilos convertidos para sx prop
const styles = {
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	dialog: {
		"& .MuiDialog-paper": {
			borderRadius: "8px", // 8
		},
	},
	dialogTitle: {
		background: "white",
		padding: "16px", // 16
		"& h2": {
			color: "#333",
			fontSize: "1.2rem",
			fontWeight: 500,
		},
	},
	dialogContent: {
		padding: "16px", // 16
		background: "white",
	},
	dialogActions: {
		padding: "12px", // 12
		background: "white",
	},
	textField: {
		marginTop: "8px", // 8
		marginBottom: "8px", // 8
		width: "100%",
		"& .MuiOutlinedInput-root": {
			borderRadius: 8,
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "#25b6e8",
			},
		},
		"& .Mui-focused .MuiOutlinedInput-notchedOutline": {
			borderColor: "#25b6e8",
		},
		"& .MuiFormLabel-root.Mui-focused": {
			color: "#25b6e8",
		},
	},
	btnWrapper: {
		position: "relative",
	},
	buttonProgress: {
		color: "#25b6e8",
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
	saveButton: {
		backgroundColor: "#25b6e8",
		color: "white",
		"&:hover": {
			backgroundColor: "#1e9ac4",
		},
	},
	cancelButton: {
		color: "#333",
		borderColor: "#333",
		"&:hover": {
			borderColor: "#333",
			backgroundColor: "rgba(51, 51, 51, 0.05)",
		},
	},
};

const contactSchema = z.object({
	name: z.string()
		.min(2, "Muito curto!")
		.max(50, "Muito longo!")
		.nonempty("Digite um nome!")
});

const FlowBuilderModal = ({ open, onClose, flowId, nameWebhook = "", onSave }) => {
	const isMounted = useRef(true);
	
	const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
		resolver: zodResolver(contactSchema),
		defaultValues: { name: "" }
	});

	useEffect(() => {
		// Reset form with nameWebhook when modal opens
		if (open) {
			reset({ name: nameWebhook || "" });
		}
		return () => {
			isMounted.current = false;
		};
	}, [open, nameWebhook, reset]);

	const handleClose = () => {
		onClose();
		reset({ name: "" });
	};

	const handleSaveContact = async values => {
		if (flowId) {
			try {
				await api.put("/flowbuilder", {
					name: values.name,
					flowId
				});
				onSave(values.name)
				handleClose()
				toast.success(i18n.t("webhookModal.toasts.update"));
			} catch (err) {
				toastError(err);
			}
		} else {
			try {
				await api.post("/flowbuilder", {
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
		<div style={styles.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				sx={styles.dialog}
			>
				<DialogTitle sx={styles.dialogTitle}>
					{flowId ? "Editar Fluxo" : "Adicionar Fluxo"}
				</DialogTitle>
				<form onSubmit={handleSubmit(handleSaveContact)}>
					<DialogContent sx={styles.dialogContent}>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={i18n.t("contactModal.form.name")}
									autoFocus
									variant="outlined"
									error={!!errors.name}
									helperText={errors.name?.message}
									sx={styles.textField}
									fullWidth
								/>
							)}
						/>
					</DialogContent>
					<DialogActions sx={styles.dialogActions}>
						<Button
							onClick={handleClose}
							variant="outlined"
							disabled={isSubmitting}
							sx={styles.cancelButton}
						>
							{i18n.t("contactModal.buttons.cancel")}
						</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={isSubmitting}
							sx={styles.saveButton}
						>
							{flowId
								? i18n.t("contactModal.buttons.okEdit")
								: i18n.t("contactModal.buttons.okAdd")}
							{isSubmitting && (
								<CircularProgress
									size={24}
									sx={styles.buttonProgress}
								/>
							)}
						</Button>
					</DialogActions>
				</form>
			</Dialog>
		</div>
	);
};

export default FlowBuilderModal;