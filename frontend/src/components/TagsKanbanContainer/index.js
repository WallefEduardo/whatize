import { Chip, Paper, Select, MenuItem, Grid, InputLabel, FormControl, Tooltip, CircularProgress } from "@material-ui/core";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";
import { Field, Form } from "formik";
import { debounce } from "lodash";

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

export function TagsKanbanContainer({ ticket, funilIds = [], isEnabled = true }) {
    const defaultChipStyle = { color: "#7f7f7f" };
    const defaultChipProps = { color: "#7f7f7f" };
    
    const [tags, setTags] = useState([]);
    const [selected, setSelected] = useState("");
    const [funnels, setFunnels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chipProps, setChipProps] = useState(defaultChipProps);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // Cache simples para evitar consultas desnecessárias
    const cacheRef = useRef({
        funnels: null,
        tags: new Map() // Map para cache por funilIds
    });
    
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
            // Criar chave de cache baseada nos funilIds
            const cacheKey = JSON.stringify(funilIds.sort());
            
            // Verificar se já temos os dados no cache
            if (cacheRef.current.tags.has(cacheKey)) {
                const cachedData = cacheRef.current.tags.get(cacheKey);
                setTags(cachedData);
                return cachedData;
            }
            
            const params = { kanban: 1 };
            
            if (funilIds && funilIds.length > 0) {
                // Garantir que os IDs sejam números
                const numericFunilIds = funilIds.map(id => Number(id)).filter(id => !isNaN(id));
                params.funilIds = JSON.stringify(numericFunilIds);
            }
            
            const { data } = await api.get(`/tags/list`, { params });
            const tagsData = data || [];
            
            // Armazenar no cache
            cacheRef.current.tags.set(cacheKey, tagsData);
            
            setTags(tagsData);
            return tagsData;
        } catch (err) {
            console.error("Erro ao carregar tags:", err);
            toastError(err);
            return [];
        }
    };

    const loadFunnels = async () => {
        try {
            // Verificar se já temos os funis no cache
            if (cacheRef.current.funnels) {
                setFunnels(cacheRef.current.funnels);
                return cacheRef.current.funnels;
            }
            
            const { data } = await api.get("/funilkanban");
            const funnelsData = data.funilKanbans || [];
            
            // Armazenar no cache
            cacheRef.current.funnels = funnelsData;
            
            setFunnels(funnelsData);
            return funnelsData;
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

    // Função para atualizar tag no backend com debounce
    const updateTagInBackend = useCallback(
        debounce(async (ticketId, tagValue) => {
            try {
                if (tagValue) {
                    // Removemos qualquer tag existente antes de adicionar a nova
                    await api.delete(`/ticket-tags/${ticketId}`);
                    
                    // Adicionamos a nova tag
                    await api.put(`/ticket-tags/${ticketId}/${tagValue}`);
                    toast.success("Tag atualizada com sucesso!");
                } else {
                    // Removemos todas as tags do ticket
                    await api.delete(`/ticket-tags/${ticketId}`);
                    toast.info("Tag removida com sucesso!");
                }
                
                // Aguardamos um pouco para garantir que o backend processou a mudança
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Recarregamos o ticket para ter certeza que está atualizado
                const updatedTicket = await fetchCurrentTicket(ticketId);
                
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
                toast.error("Erro ao atualizar tag. Tente novamente.");
            } finally {
                setLoading(false);
            }
        }, 500),
        [fetchCurrentTicket, updateChipStyle, defaultChipProps]
    );

    const handleChange = (e) => {
        const value = e.target.value;
        
        if (loading || !ticket?.id) return;
        
        // Feedback imediato na UI
        setSelected(value);
        
        if (value) {
            updateChipStyle(value);
        } else {
            setChipProps(defaultChipProps);
        }
        
        // Indicar que está carregando
        setLoading(true);
        
        // Chamar função debounced para atualizar no backend
        updateTagInBackend(ticket.id, value);
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

    // Memoizar os itens do menu para evitar re-renderizações desnecessárias
    const menuItems = useMemo(() => {
        return tags.map(tag => {
            const funnelName = getFunnelName(tag.funilId);
            const displayText = funnelName ? `${funnelName} - ${tag.name}` : tag.name;
            
            return (
                <MenuItem key={tag.id} value={tag.id}>
                    {displayText}
                </MenuItem>
            );
        });
    }, [tags, funnels]);

    // Memoizar o valor selecionado para evitar re-renderizações desnecessárias
    const selectedValue = useMemo(() => {
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
    }, [selected, tags, funnels, classes]);

    const renderSelectedValue = () => selectedValue;

    if (loading && tags.length === 0) {
        return (
            <div className={classes.loadingContainer}>
                <CircularProgress size={24} />
            </div>
        );
    }

    return (
        <>
            
            <FormControl 
                fullWidth 
                margin="dense" 
                variant="outlined"
                disabled={!isEnabled}
            >
                <InputLabel 
                    id="tag-kanban-id"
                    style={{ 
                        color: !isEnabled ? '#c0c0c0' : undefined 
                    }}
                >
                    {!isEnabled ? "Selecione um funil primeiro" : i18n.t("Etapa Kanban")}
                </InputLabel>
                <Select
                    labelWidth={90}
                    value={selected}
                    labelId="tag-kanban-id"
                    label={!isEnabled ? "Selecione um funil primeiro" : i18n.t("Etapa Kanban")}
                    onChange={handleChange}
                    disabled={loading || !isEnabled}
                    style={{
                        backgroundColor: !isEnabled ? '#f5f5f5' : undefined,
                        color: !isEnabled ? '#c0c0c0' : undefined
                    }}
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
                    {menuItems}
                </Select>
            </FormControl>
        </>
    );
}
