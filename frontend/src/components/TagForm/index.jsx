import React, { useState, useEffect, useContext } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "../ui/ToastProvider";
import {
  Button,
  TextField,
  CircularProgress,
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { Colorize } from "@mui/icons-material";
import { Tags as TagsIcon } from "lucide-react";
import TwitterColorPicker from '../TwitterColorPicker';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

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

/**
 * TagForm - Componente de formulário para tags que pode ser usado dentro de modais
 * 
 * @param {Object} props
 * @param {number} props.tagId - ID da tag para edição (opcional)
 * @param {number} props.kanban - Tipo da tag (0 = normal, 1 = kanban)
 * @param {Function} props.onSave - Callback chamado após salvar
 * @param {Function} props.onCancel - Callback chamado ao cancelar
 * @param {boolean} props.loading - Estado de loading externo
 */
const TagForm = ({ tagId, kanban = 0, onSave, onCancel, loading: externalLoading }) => {
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
  }, [tagId]);

  useEffect(() => {
    if (!tagId) return;
    
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
  }, [tagId]);

  useEffect(() => {
    if (kanban) {
      api.get("/funilkanban")
        .then(({ data }) => {
          if (data && data.funilKanbans) {
            setFunnels(data.funilKanbans);
            
            // Auto-selecionar o primeiro funil se estiver criando nova seção
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
  }, [kanban, tagId]);

  useEffect(() => {
    if (kanban === 1) {
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

  const handleOpenColorPicker = () => {
    setTempColor(tag.color || getRandomHexColor());
    setColorPickerModalOpen(true);
  };
  
  const handleConfirmColor = () => {
    setColorPickerModalOpen(false);
  };
  
  const handleCancelColor = () => {
    if (tempColor) {
      setTag(prev => ({ ...prev, color: tempColor }));
    }
    setColorPickerModalOpen(false);
  };

  const handleSaveTag = async (values) => {
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
  };

  function getRandomHexColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
    return hexColor;
  }

  if (!tag || typeof tag !== 'object') {
    console.warn('TagForm: tag inválida, não renderizando componente', tag);
    return null;
  }

  return (
    <>
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
            <Box sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, width: '100%' }}>
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
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagsIcon size={20} style={{ color: 'var(--text-gray-medium)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Field
                  as={TextField}
                  label={i18n.t("tagModal.form.color")}
                  name="color"
                  id="color"
                  error={touched.color && Boolean(errors.color)}
                  helperText={touched.color && errors.color}
                  variant="outlined"
                  margin="dense"
                  sx={{ flex: 1 }}
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
                />
              </Box>
              <Grid container spacing={2}>
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
                        value={values.funilId !== undefined && values.funilId !== null ? String(values.funilId) : ''}
                        onChange={e => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          setTag(prev => ({ ...prev, funilId: value }));
                          
                          if (!value) {
                            setSelectedLane(null);
                            setSelectedRollbackLane(null);
                          }
                        }}
                        error={touched.funilId && Boolean(errors.funilId)}
                        helperText={touched.funilId && errors.funilId}
                      >
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
                        <InputLabel id="next-lane-selection-label">
                          {i18n.t("tagModal.form.nextLaneId")}
                        </InputLabel>
                        <Field
                          as={Select}
                          label={i18n.t("tagModal.form.nextLaneId")}
                          placeholder={i18n.t("tagModal.form.nextLaneId")}
                          labelId="next-lane-selection-label"
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
                        <InputLabel id="rollback-lane-selection-label">
                          {i18n.t("tagModal.form.rollbackLaneId")}
                        </InputLabel>
                        <Field
                          as={Select}
                          label={i18n.t("tagModal.form.rollbackLaneId")}
                          placeholder={i18n.t("tagModal.form.rollbackLaneId")}
                          labelId="rollback-lane-selection-label"
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
            </Box>

            {/* Botões de ação - padronizados */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2, 
              mt: 3 
            }}>
              <Button
                onClick={onCancel}
                disabled={isSubmitting || externalLoading}
                variant="outlined"
                sx={{
                  minWidth: 100,
                  textTransform: 'none',
                  borderRadius: '4px !important',
                  color: '#dc2626 !important',
                  borderColor: '#dc2626 !important',
                  backgroundColor: 'transparent !important',
                  '&:hover': {
                    borderColor: '#b91c1c !important',
                    color: '#b91c1c !important',
                    backgroundColor: 'rgba(220, 38, 38, 0.04) !important',
                  },
                  '&:disabled': {
                    color: 'rgba(0,0,0,0.26) !important',
                    borderColor: 'rgba(0,0,0,0.12) !important',
                  }
                }}
              >
                {i18n.t("tagModal.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || externalLoading || (kanban === 1 && !values.funilId)}
                variant="outlined"
                sx={{
                  position: 'relative',
                  minWidth: 100,
                  textTransform: 'none',
                  borderRadius: '4px !important',
                  color: 'var(--color-accent) !important',
                  borderColor: 'var(--color-accent) !important',
                  backgroundColor: 'transparent !important',
                  '&:hover': {
                    borderColor: 'var(--color-green-dark) !important',
                    color: 'var(--color-green-dark) !important',
                    backgroundColor: 'rgba(0, 195, 7, 0.04) !important',
                  },
                  '&:disabled': {
                    color: 'rgba(0,0,0,0.26) !important',
                    borderColor: 'rgba(0,0,0,0.12) !important',
                  }
                }}
              >
                {tagId
                  ? `${i18n.t("tagModal.buttons.okEdit")}`
                  : `${i18n.t("tagModal.buttons.okAdd")}`}
                {(isSubmitting || externalLoading) && (
                  <CircularProgress
                    size={20}
                    sx={{
                      color: 'var(--color-accent)',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-10px',
                      marginLeft: '-10px'
                    }}
                  />
                )}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>

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
          <Box sx={{ py: 2 }}>
            <TwitterColorPicker
              color={tag.color || getRandomHexColor()}
              onChange={(color) => {
                setTag(prev => ({ ...prev, color: color.hex }));
              }}
              width="400px"
            />
          </Box>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-end', gap: 12, padding: '8px 24px' }}>
          <Button
            onClick={handleCancelColor}
            variant="outlined"
            sx={{
              minWidth: 90,
              textTransform: 'none',
              borderRadius: '4px !important',
              color: '#dc2626 !important',
              borderColor: '#dc2626 !important',
              backgroundColor: 'transparent !important',
              '&:hover': {
                borderColor: '#b91c1c !important',
                color: '#b91c1c !important',
                backgroundColor: 'rgba(220, 38, 38, 0.04) !important',
              }
            }}
          >
            CANCELAR
          </Button>
          <Button 
            onClick={handleConfirmColor}
            variant="outlined"
            sx={{
              minWidth: 100,
              textTransform: 'none',
              borderRadius: '4px !important',
              color: 'var(--color-accent) !important',
              borderColor: 'var(--color-accent) !important',
              backgroundColor: 'transparent !important',
              '&:hover': {
                borderColor: 'var(--color-green-dark) !important',
                color: 'var(--color-green-dark) !important',
                backgroundColor: 'rgba(0, 195, 7, 0.04) !important',
              }
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TagForm;