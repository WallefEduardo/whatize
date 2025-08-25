import React, { useState, useEffect, useContext } from "react";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "../ui/ToastProvider";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { Colorize } from "@mui/icons-material";
import { ColorBox } from 'material-ui-color';

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select } from "@mui/material";
import { Grid } from "@mui/material";

const tagModalStyles = {
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: 1,
		},
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
	formControl: {
		margin: 1,
		minWidth: 120,
	},
	colorAdorment: {
		width: 20,
		height: 20,
	},
	colorPickerModal: {
		position: 'absolute',
		width: 300,
		backgroundColor: "background.paper",
		boxShadow: 5,
		padding: 2,
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
    },
	funnelSelect: {
		'& .MuiSelect-select': {
			maxHeight: '40px',
			overflow: 'hidden'
		},
		'& .MuiMenu-paper': {
			maxHeight: '250px',
			marginTop: '30px'
		}
	}
};

const tagSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório"),
	color: Yup.string(),
	kanban: Yup.number(),
	timeLane: Yup.number(),
	nextLaneId: Yup.number().nullable(),
	greetingMessageLane: Yup.string(),
	rollbackLaneId: Yup.number().nullable(),
	funilId: Yup.number().nullable().when('kanban', {
		is: 1,
		then: Yup.number().nullable().required("Selecione um funil"),
		otherwise: Yup.number().nullable()
	})
});

const TagModal = ({ open, onClose, tagId, kanban, onSave }) => {
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
	const [lanes, setLanes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedLane, setSelectedLane] = useState(null);
	const [selectedRollbackLane, setSelectedRollbackLane] = useState(null);
	const [funnels, setFunnels] = useState([]);
    const [tempColor, setTempColor] = useState("");

	const initialState = {
		name: "",
		color: getRandomHexColor(),
		kanban: kanban || 0,
		timeLane: 0,
		nextLaneId: null,
		greetingMessageLane: "",
		rollbackLaneId: null,
		funilId: null
	};

	const [tag, setTag] = useState(initialState);

	useEffect(() => {
		if (!open) return;
		
		setLoading(true);
		const delayDebounceFn = setTimeout(() => {
			const fetchTags = async () => {
				try {
					const { data } = await api.get("/tags/", {
						params: { kanban: 1, tagId },
					});
					if (data && data.tags) {
						setLanes(data.tags);
					}
				} catch (err) {
					console.error("Erro ao buscar tags:", err);
					toastError(err);
				} finally {
					setLoading(false);
				}
			};
			fetchTags();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [open, tagId]);

	useEffect(() => {
		if (!open || !tagId) return;
		
		const fetchTag = async () => {
			try {
				const { data } = await api.get(`/tags/${tagId}`);
				if (data) {
					setTag(prevState => {
						return { ...prevState, ...data };
					});
					if (data.nextLaneId) {
						setSelectedLane(data.nextLaneId);
					}
					if (data.rollbackLaneId) {
						setSelectedRollbackLane(data.rollbackLaneId);
					}
				}
			} catch (err) {
				console.error("Erro ao buscar tag:", err);
				toastError(err);
			}
		};
		
		fetchTag();
	}, [tagId, open]);

	useEffect(() => {
		if (kanban && open) {
			api.get("/funilkanban")
				.then(({ data }) => {
					if (data && data.funilKanbans) {
						setFunnels(data.funilKanbans);
						
						// Auto-selecionar o primeiro funil se estiver criando nova seção (não editando)
						// e se não há funil já selecionado
						if (!tagId && data.funilKanbans.length > 0 && !tag.funilId) {
							const firstFunnel = data.funilKanbans[0];
							setTag(prev => ({ 
								...prev, 
								funilId: firstFunnel.id 
							}));
						}
					}
				})
				.catch(err => {
					console.error("Erro ao buscar funis:", err);
					toastError(err);
				});
		}
	}, [kanban, open, tagId]);

	// useEffect separado para monitorar mudanças no funilId e resetar campos relacionados
	useEffect(() => {
		if (kanban === 1) {
			// Se não há funil selecionado, limpa os campos relacionados para evitar erros
			if (!tag.funilId) {
				setSelectedLane(null);
				setSelectedRollbackLane(null);
				setTag(prev => ({
					...prev,
					nextLaneId: null,
					rollbackLaneId: null,
					greetingMessageLane: "",
					timeLane: 0
				}));
			}
		}
	}, [tag.funilId, kanban]);

	const handleClose = () => {
		setTag(initialState);
		setSelectedLane(null);
		setSelectedRollbackLane(null);
		setFunnels([]);
		setColorPickerModalOpen(false);
		onClose();
	};

	const handleCloseColorPicker = () => {
		setColorPickerModalOpen(false);
	};
    
    const handleOpenColorPicker = () => {
        setTempColor(tag.color || getRandomHexColor());
        setColorPickerModalOpen(true);
    };
    
    const handleConfirmColor = () => {
        // Mantém a cor atual e fecha o modal
        setColorPickerModalOpen(false);
    };
    
    const handleCancelColor = () => {
        // Restaura a cor anterior e fecha o modal
        if (tempColor) {
            setTag(prev => ({ ...prev, color: tempColor }));
        }
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
			kanban: kanban || 0, 
			nextLaneId: selectedLane || null, 
			rollbackLaneId: selectedRollbackLane || null,
			funilId: values.funilId ? Number(values.funilId) : null
		};

		try {
			let response;
			if (tagId) {
				response = await api.put(`/tags/${tagId}`, tagData);
			} else {
				response = await api.post("/tags", tagData);
			}
			toast.success(kanban === 0 ? `${i18n.t("tagModal.success")}` : `${i18n.t("tagModal.successKanban")}`);
			
			// Chamar callback onSave se foi fornecida
			if (onSave && response.data) {
				onSave(response.data);
			}

		} catch (err) {
			console.error("Erro ao salvar tag:", err);
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

	// Verificação de segurança para evitar renderização com dados inválidos
	if (!tag || typeof tag !== 'object') {
		console.warn('TagModal: tag inválida, não renderizando componente', tag);
		return null;
	}

	

	return (
		<div>
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
					validationSchema={tagSchema}
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
											onChange={(e) => {
												if (e && e.target) {
													const newValue = e.target.value || "";
													setTag(prev => ({ ...prev, name: newValue }));
												}
											}}
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
															style={{ backgroundColor: values.color || tag.color || "#000000", width: 20, height: 20, borderRadius: '2px' }}
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
                                                MenuProps={{
                                                   PaperProps: {
                                                     style: {
                                                       maxHeight: 250,
                                                       marginTop: 50
                                                     }
                                                   },
                                                   anchorOrigin: {
                                                     vertical: 'bottom',
                                                     horizontal: 'left'
                                                   },
                                                   transformOrigin: {
                                                     vertical: 'top',
                                                     horizontal: 'left'
                                                   }
                                                 }}
                                                // Mantém value sempre como string ou vazio, evitando undefined/null
                                                value={values.funilId !== undefined && values.funilId !== null ? String(values.funilId) : ''}
                                                onChange={e => {
                                                  const value = e.target.value === "" ? null : Number(e.target.value);
                                                  setTag(prev => ({ ...prev, funilId: value }));
                                                  
                                                  // Se desselecionar o funil, limpa campos relacionados
                                                  if (!value) {
                                                    setSelectedLane(null);
                                                    setSelectedRollbackLane(null);
                                                  }
                                                }}
                                                error={touched.funilId && Boolean(errors.funilId)}
                                                helperText={touched.funilId && errors.funilId}
                                              >
                                                {/* Só mostra opção vazia se não for criação de nova seção ou se não há funis */}
                                                {(tagId || funnels.length === 0) && (
                                                  <MenuItem value="">Selecione um funil</MenuItem>
                                                )}
                                                {Array.isArray(funnels) && funnels.map(funnel => (
                                                  <MenuItem key={funnel.id} value={String(funnel.id)}>{funnel.name}</MenuItem>
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
													onChange={(e) => {
														if (e && e.target) {
															const newValue = e.target.value || 0;
															setTag(prev => ({ ...prev, timeLane: newValue }));
														}
													}}
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={6} xl={6}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
													style={{ margin: 8, minWidth: 120 }}
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
														value={selectedLane || ""}
														onChange={(e) => setSelectedLane(e.target.value || null)}
													>
														<MenuItem value="">&nbsp;</MenuItem>
														{Array.isArray(lanes) &&
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
													onChange={(e) => {
														if (e && e.target) {
															const newValue = e.target.value || "";
															setTag(prev => ({ ...prev, greetingMessageLane: newValue }));
														}
													}}
													fullWidth
												/>
											</Grid>
											<Grid item xs={12} md={12} xl={12}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
													style={{ margin: 8, minWidth: 120 }}
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
														value={selectedRollbackLane || ""}
														onChange={(e) => setSelectedRollbackLane(e.target.value || null)}
													>
														<MenuItem value="">&nbsp;</MenuItem>
														{Array.isArray(lanes) &&
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
									style={{ position: 'relative' }}
								>
									{tagId
										? `${i18n.t("tagModal.buttons.okEdit")}`
										: `${i18n.t("tagModal.buttons.okAdd")}`}
									{isSubmitting && (
										<CircularProgress
											size={24}
											style={{
												color: '#4caf50',
												position: 'absolute',
												top: '50%',
												left: '50%',
												marginTop: '-12px',
												marginLeft: '-12px'
											}}
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
                        value={tag.color || getRandomHexColor()}
                        onChange={val => {
                            if (val && val.hex) {
                                setTag(prev => ({ ...prev, color: `#${val.hex}` }));
                            }
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
