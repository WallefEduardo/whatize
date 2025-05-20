import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Colorize } from "@material-ui/icons";
import { ColorBox } from 'material-ui-color';

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select } from "@material-ui/core";
import { Grid } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
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
		margin: theme.spacing(1),
		minWidth: 120,
	},
	colorAdorment: {
		width: 20,
		height: 20,
	},
	colorPickerModal: {
		position: 'absolute',
		width: 300,
		backgroundColor: theme.palette.background.paper,
		boxShadow: theme.shadows[5],
		padding: theme.spacing(2, 4, 3),
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		borderRadius: 8,
	},
    colorOkButton: {
        backgroundColor: "#000000",
        color: "#FFFFFF",
        '&:hover': {
            backgroundColor: "#333333",
        },
    }
}));

const TagSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório"),
	funilId: Yup.mixed()
		.when('kanban', {
			is: 1,
			then: Yup.number().transform((value) => (isNaN(value) ? undefined : value))
				.required("Selecione um funil").typeError("Selecione um funil"),
			otherwise: Yup.mixed().nullable()
		})
});

const TagModal = ({ open, onClose, tagId, kanban }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
	const [lanes, setLanes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedLane, setSelectedLane] = useState([]);
	const [selectedRollbackLane, setSelectedRollbackLane] = useState([]);
	const [funnels, setFunnels] = useState([]);
    const [tempColor, setTempColor] = useState("");

	const initialState = {
		name: "",
		color: getRandomHexColor(),
		kanban: kanban,
		timeLane: 0,
		nextLaneId: 0,
		greetingMessageLane: "",
		rollbackLaneId: 0,
		funilId: null
	};

	const [tag, setTag] = useState(initialState);

	useEffect(() => {
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			const fetchTags = async () => {
				try {
					const { data } = await api.get("/tags/", {
						params: { kanban: 1, tagId },
					});
					setLanes(data.tags);
				} catch (err) {
					toastError(err);
				}
			};
			fetchTags();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, []);

	useEffect(() => {
		try {
			(async () => {
				if (!tagId) return;

				const { data } = await api.get(`/tags/${tagId}`);
				setTag(prevState => {
					return { ...prevState, ...data };
				});
				if (data.nextLaneId) {
					setSelectedLane(data.nextLaneId);
				}
				if (data.rollbackLaneId) {
					setSelectedRollbackLane(data.rollbackLaneId);
				}
			})()
		} catch (err) {
			toastError(err);
		}
	}, [tagId, open]);

	useEffect(() => {
		if (kanban) {
			api.get("/funilkanban").then(({ data }) => {
				setFunnels(data.funilKanbans || []);
			});
		}
	}, [kanban]);

	const handleClose = () => {
		setTag(initialState);
		setColorPickerModalOpen(false);
		onClose();
	};

	const handleCloseColorPicker = () => {
		setColorPickerModalOpen(false);
	};
    
    const handleOpenColorPicker = () => {
        setTempColor(tag.color);
        setColorPickerModalOpen(true);
    };
    
    const handleConfirmColor = () => {
        // Mantém a cor atual e fecha o modal
        setColorPickerModalOpen(false);
    };
    
    const handleCancelColor = () => {
        // Restaura a cor anterior e fecha o modal
        setTag(prev => ({ ...prev, color: tempColor }));
        setColorPickerModalOpen(false);
    };

	const handleSaveTag = async values => {
		if (kanban === 1 && !values.funilId) {
			toast.error("Selecione um funil para continuar");
			return;
		}

		const tagData = { 
			...values, 
			userId: user?.id, 
			kanban: kanban, 
			nextLaneId: selectedLane || null, 
			rollbackLaneId: selectedRollbackLane || null,
			funilId: values.funilId ? Number(values.funilId) : null
		};

		try {
			if (tagId) {
				await api.put(`/tags/${tagId}`, tagData);
			} else {
				await api.post("/tags", tagData);
			}
			toast.success(kanban === 0 ? `${i18n.t("tagModal.success")}` : `${i18n.t("tagModal.successKanban")}`);

		} catch (err) {
			toastError(err);
		}
		handleClose();
	};

	function getRandomHexColor() {
		// Gerar valores aleatórios para os componentes de cor
		const red = Math.floor(Math.random() * 256); // Valor entre 0 e 255
		const green = Math.floor(Math.random() * 256); // Valor entre 0 e 255
		const blue = Math.floor(Math.random() * 256); // Valor entre 0 e 255

		// Converter os componentes de cor em uma cor hexadecimal
		const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;

		return hexColor;
	}

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="md"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{(tagId ? (kanban === 0 ? `${i18n.t("tagModal.title.edit")}` : `${i18n.t("tagModal.title.editKanban")}`) :
						(kanban === 0 ? `${i18n.t("tagModal.title.add")}` : `${i18n.t("tagModal.title.addKanban")}`))
					}
				</DialogTitle>
				<Formik
					initialValues={tag}
					enableReinitialize={true}
					validationSchema={TagSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveTag(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, values }) => (
						<Form>
							<DialogContent dividers>
								<Grid container spacing={2}>
									<Grid item xs={12} md={6} xl={6} style={{ display: 'flex', gap: 8 }}>
										<Field
											as={TextField}
											label={i18n.t("tagModal.form.name")}
											name="name"
											error={touched.name && Boolean(errors.name)}
											helperText={touched.name && errors.name}
											variant="outlined"
											margin="dense"
											onChange={(e) => setTag(prev => ({ ...prev, name: e.target.value }))}
											fullWidth
										/>
									</Grid>
									<Grid item xs={6} md={3} xl={3} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<Field
											as={TextField}
											fullWidth
											label={i18n.t("tagModal.form.color")}
											name="color"
											autoFocus
											id="color"
											error={touched.color && Boolean(errors.color)}
											helperText={touched.color && errors.color}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<div
															style={{ backgroundColor: values.color, width: 20, height: 20 }}
															className={classes.colorAdorment}
														></div>
													</InputAdornment>
												),
												endAdornment: (
													<IconButton
														size="small"
														color="default"
														onClick={handleOpenColorPicker}
													>
														<Colorize />
													</IconButton>
												),
											}}
											variant="outlined"
											margin="dense"
										/>
									</Grid>
									{kanban ? (
										<Grid item xs={6} md={3} xl={3} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<FormControl variant="outlined" margin="dense" fullWidth>
												<InputLabel id="funnel-selection-label">Funil *</InputLabel>
												<Field
													as={Select}
													label="Funil *"
													labelId="funnel-selection-label"
													id="funilId"
													name="funilId"
													value={values.funilId || ''}
													onChange={e => setTag(prev => ({ ...prev, funilId: e.target.value }))}
													error={touched.funilId && Boolean(errors.funilId)}
													helperText={touched.funilId && errors.funilId}
												>
													<MenuItem value="">Selecione um funil</MenuItem>
													{funnels.map(funnel => (
														<MenuItem key={funnel.id} value={funnel.id}>{funnel.name}</MenuItem>
													))}
												</Field>
												{touched.funilId && errors.funilId && (
													<div style={{ color: 'red', fontSize: '12px', marginTop: '4px', marginLeft: '14px' }}>
														{errors.funilId}
													</div>
												)}
											</FormControl>
										</Grid>
									) : null}
									{kanban === 1 && (
										<>
											<Grid item xs={12} md={6} xl={6}>
												<Field
													as={TextField}
													label={i18n.t("tagModal.form.timeLane")}
													name="timeLane"
													error={touched.timeLane && Boolean(errors.timeLane)}
													helperText={touched.timeLane && errors.timeLane}
													variant="outlined"
													margin="dense"
													onChange={(e) => setTag(prev => ({ ...prev, timeLane: e.target.value }))}
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={6} xl={6}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
													className={classes.formControl}
												>
													<InputLabel id="whatsapp-selection-label">
														{i18n.t("tagModal.form.nextLaneId")}
													</InputLabel>
													<Field
														as={Select}
														label={i18n.t("tagModal.form.nextLaneId")}
														placeholder={i18n.t("tagModal.form.nextLaneId")}
														labelId="whatsapp-selection-label"
														id="nextLaneId"
														name="nextLaneId"
														style={{ left: "-7px" }}
														error={touched.nextLaneId && Boolean(errors.nextLaneId)}
														value={selectedLane}
														onChange={(e) => setSelectedLane(e.target.value || null)}
													>
														<MenuItem value={null}>&nbsp;</MenuItem>
														{lanes &&
															lanes.map((lane) => (
																<MenuItem key={lane.id} value={lane.id}>
																	{lane.name}
																</MenuItem>
															))}
													</Field>
												</FormControl>
											</Grid>
											<Grid item xs={12} md={12} xl={12}>
												<Field
													as={TextField}
													label={i18n.t("tagModal.form.greetingMessageLane")}
													name="greetingMessageLane"
													rows={5}
													multiline
													error={touched.greetingMessageLane && Boolean(errors.greetingMessageLane)}
													helperText={touched.greetingMessageLane && errors.greetingMessageLane}
													variant="outlined"
													margin="dense"
													onChange={(e) => setTag(prev => ({ ...prev, greetingMessageLane: e.target.value }))}
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={12} xl={12}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
													className={classes.formControl}
												>
													<InputLabel id="whatsapp-selection-label">
														{i18n.t("tagModal.form.rollbackLaneId")}
													</InputLabel>
													<Field
														as={Select}
														label={i18n.t("tagModal.form.rollbackLaneId")}
														placeholder={i18n.t("tagModal.form.rollbackLaneId")}
														labelId="whatsapp-selection-label"
														id="rollbackLaneId"
														name="rollbackLaneId"
														style={{ left: "-7px" }}
														error={touched.rollbackLaneId && Boolean(errors.rollbackLaneId)}
														value={selectedRollbackLane}
														onChange={(e) => setSelectedRollbackLane(e.target.value)}
													>
														<MenuItem value={null}>&nbsp;</MenuItem>
														{lanes &&
															lanes.map((lane) => (
																<MenuItem key={lane.id} value={lane.id}>
																	{lane.name}
																</MenuItem>
															))}
													</Field>
												</FormControl>
											</Grid>
										</>
									)}
								</Grid>
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
									disabled={isSubmitting || (kanban === 1 && !values.funilId)}
									variant="contained"
									className={classes.btnWrapper}
								>
									{tagId
										? `${i18n.t("tagModal.buttons.okEdit")}`
										: `${i18n.t("tagModal.buttons.okAdd")}`}
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

			{/* Color Picker Modal */}
			<Dialog
                open={colorPickerModalOpen}
                onClose={handleCancelColor}
                maxWidth="xs"
                PaperProps={{
                    style: {
                        padding: '20px',
                        maxWidth: 420
                    }
                }}
            >
                <DialogTitle>
                    Escolha uma cor
                </DialogTitle>
                <DialogContent>
                    <ColorBox
                        disableAlpha={true}
                        hslGradient={false}
                        style={{ margin: '0 auto' }}
                        value={tag.color}
                        onChange={val => {
                            setTag(prev => ({ ...prev, color: `#${val.hex}` }));
                        }}
                    />
                </DialogContent>
                <DialogActions style={{ justifyContent: 'flex-end', gap: 12, padding: '8px 24px' }}>
					<Button
						onClick={handleCancelColor}
						color="secondary"
						variant="outlined"
						style={{ minWidth: 90 }}
					>
						CANCELAR
					</Button>
					<Button 
						onClick={handleConfirmColor}
						className={classes.colorOkButton}
						style={{ 
							backgroundColor: '#000000',
							color: '#FFFFFF',
							minWidth: 100, // <-- Mais largo que antes
							borderRadius: '4px'
						}}
						variant="contained"
					>
						OK
					</Button>
				</DialogActions>
            </Dialog>
		</div>
	);
};

export default TagModal;
