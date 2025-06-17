import { Chip, Paper, Select, MenuItem, Grid, InputLabel, FormControl, Tooltip, CircularProgress } from "@material-ui/core";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import { Field, Form } from "formik";

const useStyles = makeStyles((theme) => ({
    menuListItem: {
        paddingTop: 0,
        paddingBottom: 0,
        border: "none",
    },
    menuItem: {
        maxHeight: 30,
    },
    chips: {
        display: "flex",
        flexWrap: "wrap",
    },
    chip: {
        margin: 2,
    },
    chipContainer: {
        display: "flex",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    tagChip: {
        backgroundColor: props => props.color || "#7f7f7f",
        color: "#FFF",
        padding: 1,
        fontWeight: 'bold',
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 3,
        fontSize: "0.8em",
        whiteSpace: "nowrap",
        width: "95%",
        maxWidth: "95%"
    },
    loadingContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8
    }
}));

export function TagsKanbanContainer({ ticket, funilIds = [] }) {
    const defaultChipStyle = { color: "#7f7f7f" };
    const defaultChipProps = { color: "#7f7f7f" };
    
    const [tags, setTags] = useState([]);
    const [selected, setSelected] = useState("");
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chipProps, setChipProps] = useState(defaultChipProps);
    const [initialLoad, setInitialLoad] = useState(true);
    
    const classes = useStyles(chipProps);

    const fetchCurrentTicket = useCallback(async (ticketId) => {
        if (!ticketId) return null;
        try {
            const { data } = await api.get(`/tickets/${ticketId}`);
            return data;
        } catch (err) {
            console.error("Erro ao buscar ticket:", err);
            return null;
        }
    }, []);

    // Efeito para carregar dados iniciais - só executa uma vez
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await loadFunnels();
                // Só carregamos as tags após carregar os funis
                await loadTags(funilIds);
                setInitialLoad(false);
            } catch (err) {
                console.error("Erro ao carregar dados iniciais:", err);
                toast.error("Erro ao carregar dados. Por favor, recarregue a página.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Efeito para atualizar as tags quando funilIds mudar
    useEffect(() => {
        if (!initialLoad) {
            loadTags(funilIds);
        }
    }, [JSON.stringify(funilIds), initialLoad]);

    // Efeito para atualizar a seleção quando o ticket mudar
    useEffect(() => {
        if (!initialLoad && ticket && ticket.id) {
            const updateSelection = async () => {
                if (ticket.tags && ticket.tags.length > 0) {
                    setSelected(ticket.tags[0].id);
                    updateChipStyle(ticket.tags[0].id);
                } else {
                    setSelected("");
                    setChipProps(defaultChipProps);
                }
            };
            
            updateSelection();
        }
    }, [ticket, initialLoad]);

    const loadTags = async (funilIds = []) => {
        try {
            const params = { kanban: 1 };
            
            if (funilIds && funilIds.length > 0) {
                // Garantir que os IDs sejam números
                const numericFunilIds = funilIds.map(id => Number(id)).filter(id => !isNaN(id));
                params.funilIds = JSON.stringify(numericFunilIds);
            }
            
            const { data } = await api.get(`/tags/list`, { params });
            setTags(data || []);
            return data;
        } catch (err) {
            console.error("Erro ao carregar tags:", err);
            toastError(err);
            return [];
        }
    };

    const loadFunnels = async () => {
        try {
            const { data } = await api.get("/funilkanban");
            setFunnels(data.funilKanbans || []);
            return data.funilKanbans || [];
        } catch (err) {
            console.error("Erro ao carregar funis:", err);
            return [];
        }
    };

    const updateChipStyle = (tagId) => {
        if (!tagId) {
            setChipProps(defaultChipProps);
            return;
        }

        const selectedTag = tags.find(tag => tag.id === tagId);
        if (selectedTag) {
            setChipProps({ color: selectedTag.color });
        }
    };

    const handleChange = async (e) => {
        const value = e.target.value;
        
        if (loading || !ticket?.id) return;
        
        setLoading(true);
        
        try {
            // Primeiro atualizamos o estado local para feedback imediato ao usuário
            setSelected(value);
            
            if (value) {
                updateChipStyle(value);
            } else {
                setChipProps(defaultChipProps);
            }

            // Se selecionou uma tag, adicionamos ela
            if (value) {
                // Removemos qualquer tag existente antes de adicionar a nova
                await api.delete(`/ticket-tags/${ticket.id}`);
                
                // Adicionamos a nova tag
                await api.put(`/ticket-tags/${ticket.id}/${value}`);
                toast.success("Tag atualizada com sucesso!");
            } else {
                // Removemos todas as tags do ticket
                await api.delete(`/ticket-tags/${ticket.id}`);
                toast.info("Tag removida com sucesso!");
            }
            
            // Aguardamos um pouco para garantir que o backend processou a mudança
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Recarregamos o ticket para ter certeza que está atualizado
            const updatedTicket = await fetchCurrentTicket(ticket.id);
            
            if (updatedTicket) {
                // Atualizamos a seleção com base nos dados atualizados
                if (updatedTicket.tags && updatedTicket.tags.length > 0) {
                    setSelected(updatedTicket.tags[0].id);
                    updateChipStyle(updatedTicket.tags[0].id);
                } else {
                    setSelected("");
                    setChipProps(defaultChipProps);
                }
            }
            
        } catch (err) {
            console.error("Erro ao atualizar tag:", err);
            
            // Em caso de erro, tentamos restaurar o estado anterior
            if (ticket.tags && ticket.tags.length > 0) {
                setSelected(ticket.tags[0].id);
                updateChipStyle(ticket.tags[0].id);
            } else {
                setSelected("");
                setChipProps(defaultChipProps);
            }
            
            toast.error("Erro ao atualizar tag. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const getFunnelName = (funilId) => {
        if (!funilId) return "";
        const funnel = funnels.find(f => f.id === funilId);
        return funnel ? funnel.name : "";
    };

    const truncateText = (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    const renderSelectedValue = () => {
        if (!selected) return null;
        
        const selectedTag = tags.find(tag => tag.id === selected);
        if (!selectedTag) return null;

        const funnelName = getFunnelName(selectedTag.funilId);
        const displayText = funnelName ? `${funnelName} - ${selectedTag.name}` : selectedTag.name;
        const truncatedText = truncateText(displayText, 35);

        return (
            <div className={classes.chipContainer}>
                <Tooltip title={displayText}>
                    <Chip
                        className={classes.tagChip}
                        style={{ backgroundColor: selectedTag.color }}
                        label={truncatedText}
                        size="small"
                    />
                </Tooltip>
            </div>
        );
    };

    if (loading && tags.length === 0) {
        return (
            <div className={classes.loadingContainer}>
                <CircularProgress size={24} />
            </div>
        );
    }

    return (
        <>
            
            <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel id="tag-kanban-id">{i18n.t("Etapa Kanban")}</InputLabel>
                <Select
                    labelWidth={90}
                    value={selected}
                    labelId="tag-kanban-id"
                    label={i18n.t("Etapa Kanban")}
                    onChange={handleChange}
                    disabled={loading}
                    MenuProps={{
                        anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                        },
                        transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                        },
                        getContentAnchorEl: null,
                    }}
                    renderValue={renderSelectedValue}
                >
                    <MenuItem value="">Nenhuma Tag</MenuItem>
                    {tags.map(tag => {
                        const funnelName = getFunnelName(tag.funilId);
                        const displayText = funnelName ? `${funnelName} - ${tag.name}` : tag.name;
                        
                        return (
                            <MenuItem key={tag.id} value={tag.id}>
                                {displayText}
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
        </>
    );
}
