import React, { useState, useEffect, useRef, useContext, useCallback } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { green, grey } from "@mui/material/colors";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { List, Tooltip, useTheme } from "@mui/material";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from '@mui/icons-material/Group';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContactTag from "../ContactTag";
import FunilTag from "../FunilTag";
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { isNil } from "lodash";
import { toast } from "../ui/ToastProvider";
import { Done, HighlightOff, Replay, SwapHoriz, AccountCircle, Business, Wifi, Person, ListAlt, WhatsApp, Facebook, Instagram, Dashboard, ViewColumn, Block } from "@mui/icons-material";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { Avatar, Badge, ListItemAvatar, ListItem, ListItemSecondaryAction, ListItemText, Typography } from "@mui/material";

const useStyles = () => ({
    ticket: {
        position: "relative",
        marginBottom: "5px", // Espaçamento entre cards
        transition: "all 0.3s ease", // Transição suave para hover
        cursor: "pointer",
        "&:hover": {
            transform: "scale(1.02)", // Zoom suave no hover
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)", // Sombra no hover
            backgroundColor: "rgba(0, 0, 0, 0.04)", // Background sutil no hover
        },
        "&::before": {
            content: '""',
            position: "absolute",
            left: "0px", // Mais à esquerda
            top: 0, // Altura total do card
            bottom: 0, // Altura total do card
            width: "7px", // Mais grossa
            backgroundColor: "transparent", // Invisível por padrão
            zIndex: 1,
            borderRadius: "0px 0px 0px 0px", // Arredondamento nas bordas direitas
            transition: "background-color 0.3s ease", // Transição suave
        },
        "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: "rgba(0, 0, 0, 0.08)", // Preto transparente bem fraquinho
            zIndex: 1
        },
        "&.Mui-selected": {
            backgroundColor: "rgba(0, 0, 0, 0.08)", // Preto transparente como era antes
            "&::before": {
                backgroundColor: "rgba(32, 36, 38, 0.17)", // Linha visível quando selecionado
            },
            "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.12)", // Mais escuro no hover
                transform: "scale(1.02)", // Zoom também no selecionado
            }
        },
        // Responsividade para mobile
        "@media (max-width:600px)": {
            marginBottom: "6px", // Menor espaçamento no mobile
            "&:hover": {
                transform: "scale(1.01)", // Zoom menor no mobile
            },
            "&::before": {
                left: "-6px", // Menos à esquerda no mobile
                top: 0, // Altura total no mobile também
                bottom: 0,
                width: "4px", // Mais fina no mobile
            }
        },
        // Responsividade para tablets
        "@media (max-width:960px)": {
            "&::before": {
                left: "-7px",
                width: "5px",
            }
        }
    },

    pendingTicket: {
        cursor: "unset",
    },
    queueTag: {
        background: "#FCFCFC",
        color: "#000",
        marginRight: 1,
        padding: 1,
        fontWeight: 'bold',
        // paddingLeft: 5,
        // paddingRight: 5,
        borderRadius: 3,
        fontSize: "0.5em",
        whiteSpace: "nowrap"
    },
    noTicketsDiv: {
        display: "flex",
        height: "100px",
        margin: 40,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    newMessagesCount: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: 5, // Ajustado para 5 para melhor posicionamento geral
        color: "green",
        fontWeight: "bold",
        marginRight: "10px",
        borderRadius: 0,
    },
    noTicketsText: {
        textAlign: "center",
        color: "rgb(104, 121, 146)",
        fontSize: "14px",
        lineHeight: "1.4",
    },
    connectionTag: {
        marginRight: 1, // Reduzido para 1px
        marginLeft: 0,
        marginBottom: 1,
        padding: "2px 5px", // Reduzido padding
        fontWeight: 600,
        borderRadius: 3, // Reduzido borderRadius
        fontSize: "0.55em", // Reduzido fontSize
        display: "flex",
        alignItems: "center",
        gap: "2px", // Reduzido gap
        minHeight: "16px", // Reduzido minHeight
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
        }
    },
    
    // Estilos para indicador de status online/offline
    statusIndicator: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: "2px solid white",
        zIndex: 10,
    },
    
    statusOnline: {
        backgroundColor: "#25D366",
        animation: "$pulse 2s infinite",
    },
    
    statusOffline: {
        backgroundColor: "#dc3545",
        animation: "$pulseSlow 3s infinite"
    },
    
    statusTyping: {
        backgroundColor: "#ffc107",
        animation: "$pulse 1s infinite"
    },
    
    // Animações para os indicadores de status
    "@keyframes pulse": {
        "0%": {
            transform: "scale(1)",
            opacity: 1
        },
        "50%": {
            transform: "scale(1.1)",
            opacity: 0.7
        },
        "100%": {
            transform: "scale(1)",
            opacity: 1
        }
    },
    
    "@keyframes pulseSlow": {
        "0%": {
            opacity: 1
        },
        "50%": {
            opacity: 0.5
        },
        "100%": {
            opacity: 1
        }
    },
    funilTag: {
        marginRight: 2,
        marginLeft: -1,
        marginBottom: 1,
        padding: "3px 6px",
        fontWeight: 600,
        borderRadius: 4,
        fontSize: "0.6em",
        display: "flex",
        alignItems: "center",
        gap: "3px",
        minHeight: "18px",
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
        }
    },
    noTicketsTitle: {
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "600",
        margin: "0px",
    },

    contactNameWrapper: {
        display: "flex",
        justifyContent: "space-between",
        marginLeft: "5px",
        fontWeight: "bold",
        color: "black",
    },

    lastMessageTime: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: -30,
        marginRight: "1px",
        color: "black",
    },

    lastMessageTimeUnread: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: -30,
        color: "green",
        fontWeight: "bold",
        marginRight: "1px",
    },

    closedBadge: {
        alignSelf: "center",
        justifySelf: "flex-end",
        marginRight: 32,
        marginLeft: "auto",
    },

    contactLastMessage: {
        paddingRight: "0%",
        marginLeft: "5px",
        color: "#666",
    },

    contactLastMessageUnread: {
        paddingRight: 20,
        fontWeight: "bold",
        color: "#666",
    },

    badgeStyle: {
        color: "white",
        backgroundColor: green[500],
    },

    acceptButton: {
        position: "absolute",
        right: "1px",
    },



    ticketInfo: {
        position: "relative",
        top: -13
    },
    secondaryContentSecond: {
        display: 'flex',
        marginTop: "3px", // Espaço de 3px da última mensagem para os badges
        // marginBottom: 2,
        // marginLeft: "5px",
        alignItems: "flex-start",
        flexWrap: "nowrap",
        flexDirection: "row",
        alignContent: "flex-start",
        // height: "10px"
    },
    ticketInfo1: {
        position: "relative",
        top: 0,
        right: 0
    },
    Radiusdot: {
        "& .MuiBadge-badge": {
            borderRadius: 2,
            position: "inherit",
            height: 16,
            margin: 2,
            padding: 3
        },
        "& .MuiBadge-anchorOriginTopRightRectangle": {
            transform: "scale(1) translate(0%, -20%)",
        },
    },
    connectionIcon: {
        marginRight: 8
    },
    tagIcon: {
        fontSize: "0.8em",
        marginRight: 2,
        marginLeft: 2,
        verticalAlign: "middle"
    },

    avatarHover: {
        "&:hover": {
            transform: "scale(1.15)", // Zoom maior no avatar
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)", // Sombra mais pronunciada
            zIndex: 10, // Garantir que fique acima de outros elementos
        },
        // Responsividade para mobile
        "@media (max-width:600px)": {
            "&:hover": {
                transform: "scale(1.1)", // Zoom menor no mobile
            }
        }
    }
});

const TicketListItemCustom = ({ setTabOpen, ticket }) => {
    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
    const [tagsWithFunnel, setTagsWithFunnel] = useState([]);

    const [openAlert, setOpenAlert] = useState(false);
    const [userTicketOpen, setUserTicketOpen] = useState("");
    const [queueTicketOpen, setQueueTicketOpen] = useState("");
    // Estados de presence temporariamente desabilitados
    // const [contactPresence, setContactPresence] = useState('unavailable'); // Estado do presence
    // const [isCurrentChat, setIsCurrentChat] = useState(false); // Se este ticket é o chat atual
    // const [lastActivity, setLastActivity] = useState(Date.now()); // Última atividade do usuário

    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user, socket } = useContext(AuthContext);

    const { get: getSetting } = useCompanySettings();

    // useEffect temporariamente desabilitado
    /*
    useEffect(() => {
        // Verificar se este é o chat atual
        setIsCurrentChat(ticketId === ticket.uuid);
    }, [ticket, ticketId])
    */

    useEffect(() => {
        if (ticket && ticket.id) {
            const fetchTagsWithFunnel = async () => {
                try {
                    const { data } = await api.get(`/tags-funnel/${ticket.id}`);

                    if (data && data.length > 0) {
                        setTagsWithFunnel(data);
                    }
                } catch (err) {
                    // Error handling removed
                }
            };
            fetchTagsWithFunnel();
        }
    }, [ticket]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // useEffect para monitorar presence do contato - TEMPORARIAMENTE DESABILITADO
    /*
    useEffect(() => {
        if (!ticket?.contact?.number || !ticket?.id) {
            return;
        }

        const contactNumber = ticket.contact.number.replace(/\D/g, '');
        
        // Sistema de demonstração inteligente em tempo real
        const startDemoPresenceSystem = () => {
            // Estado inicial baseado no ID do ticket
            const ticketIdMod = ticket.id % 3;
            let currentStatus = ticketIdMod === 0 ? 'available' : 
                              ticketIdMod === 1 ? 'composing' : 'unavailable';
            
            setContactPresence(currentStatus);

            // Mudanças aleatórias a cada 10-15 segundos para simular tempo real
            const changeInterval = setInterval(() => {
                const statuses = ['available', 'composing', 'unavailable'];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                setContactPresence(randomStatus);
            }, Math.random() * 5000 + 10000); // Entre 10-15 segundos

            // Simular digitação quando há nova mensagem
            if (ticket.unreadMessages > 0) {
                setContactPresence('composing');
                setTimeout(() => {
                    setContactPresence('available');
                }, 3000);
            }

            return changeInterval;
        };

        // Tentar API real primeiro, fallback para demo
        const subscribeToPresence = async () => {
            try {
                await api.post('/presence/subscribe', {
                    contactNumber,
                    whatsappId: ticket.whatsappId
                });
                
                // Se API funcionar, configurar listener real
                if (socket) {
                    const handlePresenceUpdate = (data) => {
                        const contactJid = `${contactNumber}@s.whatsapp.net`;
                        if (data.contactJid === contactJid) {
                            setContactPresence(data.presence);
                        }
                    };
                    if (socket && socket.on && typeof socket.on === 'function') {

                      socket.on('presence-update', handlePresenceUpdate);

                    }
                    return () => socket.off('presence-update', handlePresenceUpdate);
                }
            } catch (error) {
                return startDemoPresenceSystem();
            }
        };

        const cleanup = subscribeToPresence();

        // Cleanup
        return () => {
            if (cleanup) {
                if (typeof cleanup === 'function') {
                    cleanup();
                } else if (typeof cleanup === 'number') {
                    clearInterval(cleanup);
                }
            }
        };
    }, [socket, ticket?.contact?.number, ticket?.whatsappId, ticket?.id, ticket?.unreadMessages]);
    */

    // useEffect para monitorar digitação no chat atual - TEMPORARIAMENTE DESABILITADO
    /*
    useEffect(() => {
        if (!isCurrentChat) return;

        // Simular que o contato está digitando quando você está no chat
        const simulateTypingResponse = () => {
            setContactPresence('composing');
            
            setTimeout(() => {
                setContactPresence('available');
            }, 2000 + Math.random() * 3000); // 2-5 segundos
        };

        // Listener para eventos de digitação
        const handleUserTyping = () => {
            setContactPresence('available');
            
            // Simular resposta do contato depois de um tempo
            setTimeout(simulateTypingResponse, 1000 + Math.random() * 2000);
        };

        // Monitorar entrada de texto globalmente quando este chat está ativo
        const inputElements = document.querySelectorAll('input[type="text"], textarea');
        inputElements.forEach(input => {
            input.addEventListener('keydown', handleUserTyping);
        });

        // Listener específico para mudanças no chat
        const chatInput = document.querySelector('[placeholder*="Digite"]');
        if (chatInput) {
            chatInput.addEventListener('keydown', handleUserTyping);
        }

        return () => {
            inputElements.forEach(input => {
                input.removeEventListener('keydown', handleUserTyping);
            });
            if (chatInput) {
                chatInput.removeEventListener('keydown', handleUserTyping);
            }
        };
    }, [isCurrentChat, ticket?.contact?.name]);
    */

    // useEffect para simular "sair do WhatsApp" por inatividade - TEMPORARIAMENTE DESABILITADO
    /*
    useEffect(() => {
        // Atualizar atividade em vários eventos
        const updateActivity = () => {
            setLastActivity(Date.now());
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        // Verificar inatividade a cada 30 segundos
        const inactivityCheck = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            
            // Se inativo por mais de 2 minutos, simular offline
            if (timeSinceLastActivity > 120000) { // 2 minutos
                setContactPresence('unavailable');
            }
            // Se inativo por mais de 30 segundos, reduzir atividade  
            else if (timeSinceLastActivity > 30000) { // 30 segundos
                setContactPresence(prev => prev === 'composing' ? 'available' : prev);
            }
        }, 30000); // Verificar a cada 30 segundos

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true);
            });
            clearInterval(inactivityCheck);
        };
    }, [lastActivity]);
    */

    // Função para determinar o estilo do indicador de status - TEMPORARIAMENTE DESABILITADA
    /*
    const getStatusIndicatorClass = () => {
        const baseClass = classes.statusIndicator;
        
        switch (contactPresence) {
            case 'available':
                return `${baseClass} ${classes.statusOnline}`;
            case 'composing':
            case 'recording':
                return `${baseClass} ${classes.statusTyping}`;
            case 'unavailable':
            default:
                return `${baseClass} ${classes.statusOffline}`;
        }
    };
    */

    const handleOpenAcceptTicketWithouSelectQueue = useCallback(() => {
        // console.log(ticket)
        setAcceptTicketWithouSelectQueueOpen(true);
    }, []);

    const handleCloseTicket = async (id) => {
        const setting = await getSetting(
            {
                "column": "requiredTag"
            }
        );

        if (setting.requiredTag === "enabled") {
            //verificar se tem uma tag   
            try {
                const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
                if (!contactTags.data.tags) {
                    toast.warning(i18n.t("messagesList.header.buttons.requiredTag"))
                } else {
                    await api.put(`/tickets/${id}`, {
                        status: "closed",
                        userId: user?.id || null,
                    });

                    if (isMounted.current) {
                        setLoading(false);
                    }

                    history.push(`/tickets/`);
                }
            } catch (err) {
                setLoading(false);
                toastError(err);
            }
        } else {
            setLoading(true);
            try {
                await api.put(`/tickets/${id}`, {
                    status: "closed",
                    userId: user?.id || null,
                });

            } catch (err) {
                setLoading(false);
                toastError(err);
            }
            if (isMounted.current) {
                setLoading(false);
            }

            history.push(`/tickets/`);
        }

    };

    const handleCloseIgnoreTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id || null,
                sendFarewellMessage: false,
                amountUsedBotQueues: 0
            });

        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }

        history.push(`/tickets/`);
    };

    const truncate = (str, len) => {
        if (!isNil(str)) {
            if (str.length > len) {
                return str.substring(0, len) + "...";
            }
            return str;
        }
    };

    const handleCloseTransferTicketModal = useCallback(() => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    }, []);

    const handleOpenTransferModal = () => {
        setLoading(true)
        setTransferTicketModalOpen(true);
        if (isMounted.current) {
            setLoading(false);
        }
        handleSelectTicket(ticket);
        // history.push('/tickets');
        // setTimeout(() => {
        history.push(`/tickets/${ticket.uuid}`);
        // }, 0);
    }

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            const otherTicket = await api.put(`/tickets/${id}`, {
                status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
                userId: user?.id,
                useIntegration: false
            });

            if (otherTicket.data.id !== ticket.id) {
                if (otherTicket.data.userId !== user?.id) {
                    setOpenAlert(true);
                    setUserTicketOpen(otherTicket.data.user.name);
                    setQueueTicketOpen(otherTicket.data.queue.name);
                } else {
                    setLoading(false);
                    setTabOpen(ticket.isGroup ? "group" : "open");
                    handleSelectTicket(otherTicket.data);
                    // history.push('/tickets');
                    // setTimeout(() => {
                    history.push(`/tickets/${otherTicket.uuid}`);
                    // }, 0);
                }
            } else {
                let setting;

                try {
                    setting = await getSetting({
                        "column": "sendGreetingAccepted"
                    });
                } catch (err) {
                    toastError(err);
                }

                if (setting.sendGreetingAccepted === "enabled" && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")) {
                    handleSendMessage(ticket.id);
                }
                if (isMounted.current) {
                    setLoading(false);
                }

                setTabOpen(ticket.isGroup ? "group" : "open");
                handleSelectTicket(ticket);
                // history.push('/tickets');
                // setTimeout(() => {
                history.push(`/tickets/${ticket.uuid}`);
                // }, 0);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };


    const handleSendMessage = async (id) => {

        let setting;

        try {
            setting = await getSetting({
                "column": "greetingAcceptedMessage"
            })
        } catch (err) {
            toastError(err);
        }

        const msg = `${setting.greetingAcceptedMessage}`; //`{{ms}} *{{name}}*, ${i18n.t("mainDrawer.appBar.user.myName")} *${user?.name}* ${i18n.t("mainDrawer.appBar.user.continuity")}.`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseAlert = useCallback(() => {
        setOpenAlert(false);
        setLoading(false);
    }, []);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    // Função para obter todas as tags normais (não kanban) do ticket
    const getNormalTags = () => {
        let normalTags = [];
        
        // Verifica primeiro nas tags do contato
        if (ticket.contact && ticket.contact.tags) {
            const contactNormalTags = ticket.contact.tags.filter(tag => tag.kanban === 0);
            normalTags = [...normalTags, ...contactNormalTags];
        }
        
        // Se não encontrou, verifica nas tags diretas do ticket
        if (ticket.tags) {
            const ticketNormalTags = ticket.tags.filter(tag => tag.kanban === 0);
            normalTags = [...normalTags, ...ticketNormalTags];
        }
        
        // Remove duplicatas baseado no ID
        const uniqueTags = normalTags.filter((tag, index, self) => 
            index === self.findIndex(t => t.id === tag.id)
        );
        
        return uniqueTags;
    };

    return (
        <React.Fragment key={ticket.id}>
            {openAlert && (
                <ShowTicketOpen
                    isOpen={openAlert}
                    handleClose={handleCloseAlert}
                    user={userTicketOpen}
                    queue={queueTicketOpen}
                />
            )}
            {acceptTicketWithouSelectQueueOpen && (
                <AcceptTicketWithouSelectQueue
                    modalOpen={acceptTicketWithouSelectQueueOpen}
                    onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
                    ticketId={ticket.id}
                    ticket={ticket}
                />
            )}
            {transferTicketModalOpen && (
                <TransferTicketModalCustom
                    modalOpen={transferTicketModalOpen}
                    onClose={handleCloseTransferTicketModal}
                    ticketid={ticket.id}
                    ticket={ticket}
                />
            )}
            {/* <TicketMessagesDialog
                open={openTicketMessageDialog}
                handleClose={() => setOpenTicketMessageDialog(false)}
                ticketId={ticket.id}
            /> */}
            <ListItem
                button
                dense
                onClick={(e) => {
                    const isCheckboxClicked = (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox')
                        || (e.target.tagName.toLowerCase() === 'svg' && e.target.type === undefined)
                        || (e.target.tagName.toLowerCase() === 'path' && e.target.type === undefined);

                    if (isCheckboxClicked) return;

                    handleSelectTicket(ticket);
                }}
                selected={ticketId && ticketId === ticket.uuid}
                className={clsx(classes.ticket, {
                    [classes.pendingTicket]: ticket.status === "pending",
                })}
            >
                <ListItemAvatar
                    style={{ marginLeft: "0px", position: "relative" }}
                >
                    <Avatar
                        style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            transition: "all 0.3s ease", // Transição suave
                            cursor: "pointer",
                        }}
                        src={`${ticket?.contact?.urlPicture}`}
                        className={classes.avatarHover}
                    />
                    {/* Indicador de status online/offline - TEMPORARIAMENTE DESABILITADO */}
                    {/* <div className={getStatusIndicatorClass()} /> */}
                </ListItemAvatar>
                <ListItemText
                    disableTypography
                    primary={
                        <span className={classes.contactNameWrapper}>
                            <Typography
                                noWrap
                                component="span"
                                variant="body2"
                                style={{ fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <span>{truncate(ticket.contact?.name, 25)}</span>
                                <span style={{ color: '#666', fontSize: '0.9em', fontWeight: 'normal' }}>|</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#25D366', fontWeight: 'bold', fontSize: '0.7em' }}>
                                    {ticket.channel === "whatsapp" && <WhatsApp style={{ fontSize: "12px", color: '#25D366' }} />}
                                    {ticket.channel === "instagram" && <Instagram style={{ fontSize: "12px", color: '#E4405F' }} />}
                                    {ticket.channel === "facebook" && <Facebook style={{ fontSize: "12px", color: '#1877F2' }} />}
                                    {ticket.whatsapp?.name?.toUpperCase()}
                                </span>
                                {/* {profile === "admin"  && ( */}
                                {/* <Tooltip title="Espiar Conversa">
                                        <VisibilityIcon
                                            onClick={() => setOpenTicketMessageDialog(true)}
                                            fontSize="small"
                                            style={{
                                                color: blue[700],
                                                cursor: "pointer",
                                                marginLeft: 10,
                                                verticalAlign: "middle"
                                            }}
                                        />
                                    </Tooltip> */}
                                {/* )} */}
                            </Typography>
                            {/* <ListItemSecondaryAction>
                                <Box className={classes.ticketInfo1}>{renderTicketInfo()}</Box>
                            </ListItemSecondaryAction> */}
                        </span>
                    }
                    secondary={
                        <span className={classes.contactNameWrapper}>

                            <Typography
                                className={Number(ticket.unreadMessages) > 0 ? classes.contactLastMessageUnread : classes.contactLastMessage}
                                noWrap
                                component="span"
                                variant="body2"
                            >
                                {ticket.lastMessage ? (
                                    <>
                                        {ticket.lastMessage.includes('fb.me') ? (
                                            <MarkdownWrapper>Clique de Anúncio</MarkdownWrapper>
                                        ) : ticket.lastMessage.includes('data:image/png;base64') ?
                                            <MarkdownWrapper>Localização</MarkdownWrapper> :
                                            <> {ticket.lastMessage.includes('BEGIN:VCARD') ?
                                                <MarkdownWrapper>Contato</MarkdownWrapper> :
                                                <MarkdownWrapper>{truncate(ticket.lastMessage, 40)}</MarkdownWrapper>}
                                            </>
                                        }
                                    </>
                                ) : (
                                    <br />
                                )}
                                <span className={classes.secondaryContentSecond} >

                                    
                                    <span 
                                        className={classes.connectionTag}
                                        style={{ 
                                            backgroundColor: `${ticket.queue?.color || "#7c7c7c"}20`, // 20% opacidade
                                            color: ticket.queue?.color || "#7c7c7c"
                                        }}
                                    >
                                        <ListAlt style={{ fontSize: "10px" }} />
                                        {ticket.queueId ? ticket.queue?.name?.toUpperCase() : "SEM FILA"}
                                    </span>
                                    
                                    {ticket?.user && (
                                        <span 
                                            className={classes.connectionTag}
                                            style={{ 
                                                backgroundColor: "rgba(0, 0, 0, 0.2)",
                                                color: "#000000"
                                            }}
                                        >
                                            <Person style={{ fontSize: "10px" }} />
                                            {ticket.user?.name?.toUpperCase()}
                                        </span>
                                    )}
                                    
                                    {getNormalTags().map((tag, index) => (
                                        <Tooltip key={`normal-tag-${tag.id}`} title={tag.name}>
                                            <LocalOfferIcon 
                                                className={classes.tagIcon}
                                                style={{ color: tag.color }}
                                            />
                                        </Tooltip>
                                    ))}
                                </span>
                                <span className={classes.secondaryContentSecond} >
                                    {
                                        tagsWithFunnel.length > 0 ? (
                                            tagsWithFunnel.map((tag) => (
                                                <FunilTag tag={tag} key={`ticket-funil-tag-${ticket.id}-${tag.id}`} />
                                            ))
                                        ) : (
                                            ticket.tags?.map((tag) => {
                                                return (
                                                    <ContactTag tag={tag} key={`ticket-contact-tag-${ticket.id}-${tag.id}`} />
                                                );
                                            })
                                        )
                                    }
                                </span>
                            </Typography>

                            <Badge
                                className={classes.newMessagesCount}
                                badgeContent={ticket.unreadMessages}
                                classes={{
                                    badge: classes.badgeStyle,
                                }}
                            />
                        </span>
                    }

                />
                <ListItemSecondaryAction>
                    {ticket.lastMessage && (
                        <>

                            <Typography
                                className={Number(ticket.unreadMessages) > 0 ? classes.lastMessageTimeUnread : classes.lastMessageTime}
                                component="span"
                                variant="body2"
                            >

                                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                                ) : (
                                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                                )}
                            </Typography>

                            <br />

                        </>
                    )}

                </ListItemSecondaryAction>
                <ListItemSecondaryAction>
                    <span className={classes.secondaryContentSecond}>
                        {(ticket.status === "pending" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending" && ticket.queueId !== null) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending" || ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '26px', position: 'absolute', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={handleOpenTransferModal}
                            >
                                {/* {i18n.t("ticketsList.buttons.transfer")} */}
                                <Tooltip title={`${i18n.t("ticketsList.buttons.transfer")}`}>
                                    <SwapHoriz />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.closed")}`}>
                                    <Block />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {((ticket.status === "pending" || ticket.status === "lgpd") && (user.userClosePendingTicket === "enabled" || user.profile === "admin")) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseIgnoreTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.ignore")}`}>
                                    <Block />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && ticket.queueId !== null) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: "#25b6e8", padding: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>
                </ListItemSecondaryAction>
            </ListItem>
            {/* <Divider variant="inset" component="li" /> */}
        </React.Fragment>
    );
};

export default TicketListItemCustom;
