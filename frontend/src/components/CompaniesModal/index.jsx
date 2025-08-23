import React, { useState, useEffect, useContext } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../ui/ToastProvider";

import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
	Select,
	InputLabel,
	MenuItem,
	FormControl,
	TextField,
	InputAdornment,
	IconButton,
	FormControlLabel,
	Switch
} from '@mui/material';

import { Visibility, VisibilityOff } from '@mui/icons-material';

import { green } from "@mui/material/colors";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";


const companySchema = z.object({
	name: z.string().min(2, "Too Short!").max(50, "Too Long!").nonempty("Nome é obrigatório"),
	email: z.string().email("Email é inválido").nonempty("E-mail é obrigatório"),
	passwordDefault: z.string().optional(),
	numberAttendants: z.number().min(1, "Deve ser pelo menos 1"),
	numberConections: z.number().min(1, "Deve ser pelo menos 1"),
	status: z.boolean().optional()
});

const CompanyModal = ({ open, onClose, companyId }) => {

	const initialState = {
		name: "",
		email: "",
		passwordDefault: "",
		numberAttendants: 1,
		numberConections: 1,
		status: false
	};

	const [company, setCompany] = useState(initialState);
	const [showPassword, setShowPassword] = useState(false);

	const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm({
		resolver: zodResolver(companySchema),
		defaultValues: initialState
	});

	const watchedValues = watch();

	useEffect(() => {
		const fetchCompany = async () => {
			if (!companyId) return;
			try {
				const { data } = await api.get(`/companies/listPlan/${companyId}`);
				setCompany(prevState => {
					return { ...prevState, ...data };
				});
				reset(data);
			} catch (err) {
				toastError(err);
			}
		};

		fetchCompany();
	}, [companyId, open, reset]);

	useEffect(() => {
		if (!companyId) {
			reset(initialState);
		}
	}, [companyId, reset]);

	const handleClose = () => {
		onClose();
		setCompany(initialState);
	};

	const handleSaveCompany = async (values) => {
		const companyData = { ...values };
		try {
			if (companyId) {
				await api.put(`/companies/${companyId}`, companyData);
			} else {
				await api.post("/companies", companyData);
			}
			toast.success(i18n.t("companyModal.success"));
		} catch (err) {
			toastError(err);
		}
		handleClose();
	};

	return (
		<Box sx={{ display: "flex", flexWrap: "wrap" }}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{companyId
						? `${i18n.t("companyModal.title.edit")}`
						: `${i18n.t("companyModal.title.add")}`}
				</DialogTitle>
				<Box component="form" onSubmit={handleSubmit(handleSaveCompany)}>
					<DialogContent dividers>
						<Box sx={{ mb: 2 }}>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={i18n.t("companyModal.form.name")}
										autoFocus
										error={Boolean(errors.name)}
										helperText={errors.name?.message}
										variant="outlined"
										margin="dense"
										fullWidth
									/>
								)}
							/>
						</Box>
						<Box sx={{ mb: 2 }}>
							<FormControlLabel
								control={
									<Controller
										name="status"
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
								label={"Ativo"}
							/>
						</Box>
						<Box sx={{ mb: 2 }}>
							<Controller
								name="email"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={i18n.t("companyModal.form.email")}
										error={Boolean(errors.email)}
										helperText={errors.email?.message}
										variant="outlined"
										margin="dense"
										fullWidth
									/>
								)}
							/>
						</Box>
						<Box sx={{ mb: 2 }}>
							<Controller
								name="passwordDefault"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										variant="outlined"
										margin="dense"
										label={i18n.t("companyModal.form.passwordDefault")}
										error={Boolean(errors.passwordDefault)}
										helperText={errors.passwordDefault?.message}
										type={showPassword ? 'text' : 'password'}
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														aria-label="toggle password visibility"
														onClick={() => setShowPassword((e) => !e)}
													>
														{showPassword ? <VisibilityOff /> : <Visibility />}
													</IconButton>
												</InputAdornment>
											)
										}}
										fullWidth
									/>
								)}
							/>
						</Box>
					</DialogContent>
					<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("companyModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									sx={{ position: 'relative' }}
								>
									{companyId
										? `${i18n.t("companyModal.buttons.okEdit")}`
										: `${i18n.t("companyModal.buttons.okAdd")}`}
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
			</Dialog>
		</Box>
	);
};

export default CompanyModal;
