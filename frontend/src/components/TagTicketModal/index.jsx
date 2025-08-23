import React, { useState, useEffect, useContext } from "react";

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
import CircularProgress from "@mui/material/CircularProgress";
import { Colorize } from "@mui/icons-material";
import { ColorBox } from 'material-ui-color';
import { FormControlLabel, Switch } from '@mui/material';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Checkbox from '@mui/material/Checkbox';


import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { IconButton, InputAdornment, FormControl } from "@mui/material";


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
	colorAdorment: {
		width: 20,
		height: 20,
	},
    multFieldLine: {
    	display: 'flex',
    	flexDirection: 'row',
    	alignItems: 'center',
  	},
});

const TagSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório")
});

const TagModal = ({ open, onClose, tagId, reload }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
    //console.log(user);


	const initialState = {
		name: "",
		color: "",
        kanban: 0
	};

	const [tag, setTag] = useState(initialState);

	useEffect(() => {
		try {
			(async () => {
				if (!tagId) return;

				const { data } = await api.get(`/tags/${tagId}`);
                //console.log(data);
				setTag(prevState => {
					return { ...prevState, ...data };
				});
			})()
		} catch (err) {
			toastError(err);
		}
	}, [tagId, open]);

	const handleClose = () => {
		setTag(initialState);
		setColorPickerModalOpen(false);
		onClose();
	};

	const handleSaveTag = async values => {
		const tagData = { ...values, userId: user.id };
		try {
			if (tagId) {
				await api.put(`/tags/${tagId}`, tagData);
			} else {
				await api.post("/tags", tagData);
			}
			toast.success(i18n.t("tagModal.success"));
			if (typeof reload == 'function') {
				reload();
			}
		} catch (err) {
			toastError(err);
		}
		handleClose();
	};


const handleKanbanChange = (e) => {
    const kanbanValue = e.target.checked ? 1 : 0;
    setTag((prev) => ({
      ...prev,
      kanban: kanbanValue,
    });
  };
	return (
		<Box sx={tagModalStyles.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{ (tagId ? `${i18n.t("tagModal.title.edit")}` : `${i18n.t("tagModal.title.add")}`) }
				</DialogTitle>
				<Box component="form" onSubmit={handleSubmit(handleSaveTag)}>
					<DialogContent dividers>
						<Box sx={tagModalStyles.multFieldLine}>
							<Controller
								name="name"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label={i18n.t("tagModal.form.name")}
										error={Boolean(errors.name)}
										helperText={errors.name?.message}
										variant="outlined"
										margin="dense"
										onChange={(e) => {
											field.onChange(e);
											setTag(prev => ({ ...prev, name: e.target.value });
										}}
										fullWidth
									/>
								)}
							/>
						</Box>
						<br />
						<Box sx={tagModalStyles.multFieldLine}>
							<Controller
								name="color"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										fullWidth
										label={i18n.t("tagModal.form.color")}
										id="color"
										error={Boolean(errors.color)}
										helperText={errors.color?.message}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<div
														style={{ backgroundColor: watchedValues.color }}
														sx={tagModalStyles.colorAdorment}
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
						</Box>
                                {(user.profile === "admin" || user.profile === "supervisor") && (
                                <>
						<Box sx={tagModalStyles.multFieldLineRow}>
        						<FormControlLabel
          							control={
            							<Checkbox
             								checked={tag.kanban === 1}
             								onChange={handleKanbanChange}
              								name="kanban"
              								color="primary"
            							/>
          							}
          							label="Kanban"
          							labelPlacement="start"
        						/>
      						</Box>
      						<br />
                                </>
								)}
                                
						{ colorPickerModalOpen && (
							<div>
								<ColorBox
									disableAlpha={true}
									hslGradient={false}
									style={{margin: '20px auto 0'}}
									value={tag.color}
									onChange={val => {
										const newColor = `#${val.hex}`;
										setTag(prev => ({ ...prev, color: newColor });
										setValue('color', newColor);
									}}
								/>
							</div>
						)}
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleClose}
							color="secondary"
							disabled={isSubmitting}
							variant="outlined"
						>
							{i18n.t("tagModal.buttons.cancel")}
						</Button>
						<Button
							type="submit"
							color="primary"
							disabled={isSubmitting}
							variant="contained"
							sx={tagModalStyles.btnWrapper}
						>
							{tagId
								? `${i18n.t("tagModal.buttons.okEdit")}`
								: `${i18n.t("tagModal.buttons.okAdd")}`}
							{isSubmitting && (
								<CircularProgress
									size={24}
									sx={tagModalStyles.buttonProgress}
								/>
							)}
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
		</Box>
	);
};

export default TagModal;