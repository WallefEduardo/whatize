import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";
import emojiRegex from "emoji-regex";
import { v4 as uuidv4 } from "uuid";

import { green } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { i18n } from "../../translate/i18n";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import api from "../../services/api";

import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@mui/material";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";

import facebookIcon from "../../assets/facebook.png";
import insatagramIcon from "../../assets/instagram.png";
import whatsappIcon from "../../assets/whatsapp.png";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import FunilTag from "../FunilTag";

// MIGRAÇÃO GRADUAL: makeStyles → sx prop 
// TicketListItem - Componente de item de ticket
const ticketStyles = {
    ticket: {
        position: "relative",
    },

    pendingTicket: {
        cursor: "unset",
    },

    noTicketsDiv: {
        display: "flex",
        height: "100px",
        margin: 40,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },

    noTicketsText: {
        textAlign: "center",
        color: "rgb(104, 121, 146)",
        fontSize: "14px",
        lineHeight: "1.4",
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
    },

    lastMessageTime: {
        position: "absolute",
        marginRight: 5,
        right: 20,
        bottom: 30,
    },

    closedBadge: {
        alignSelf: "center",
        justifySelf: "flex-end",
        marginRight: 32,
        marginLeft: "auto",
    },

    contactLastMessage: {
        paddingRight: 20,
    },

    newMessagesCount: {
        alignSelf: "center",
        marginRight: 8,
        marginLeft: "auto",
    },

    bottomButton: {
        top: "12px",
    },

    badgeStyle: {
        color: "white",
        backgroundColor: green[500],
    },

    acceptButton: {
        position: "absolute",
        left: "50%",
    },

    ticketQueueColor: {
        flex: "none",
        width: "8px",
        height: "100%",
        position: "absolute",
        top: "0%",
        left: "0%",
    },

    userTag: {
        position: "absolute",
        marginRight: 110,
        right: 20,
        bottom: 30,
        backgroundColor: "var(--color-primary)",
        color: "var(--color-primary)",
        border: "1px solid #CCC",
        padding: 1,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 14,
        fontSize: "0.9em",
    },
    divTags: {
        position: "absolute",
        marginRight: 0,
        left: 0,
        bottom: 0,
        flexWrap: "wrap",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    tags: {
        color: "#FFF",
        border: "1px solid #CCC",
        padding: 0,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 0,
        fontSize: "0.7em",
        textAlign: "center",
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    divUser: {
        position: "absolute",
        marginRight: 0,
        left: 0,
        top: 0,
        flexWrap: "wrap",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    user: {
        color: "#eee",
        border: "1px solid #CCC",
        padding: 0,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 0,
        fontSize: "0.6em",
        textAlign: "center",
    },

    tagsWrapper: {
        zIndex: 500,
    },

    funilTagBadge: {
        color: "#FFF",
        border: "1px solid #CCC",
        padding: 0,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 0,
        fontSize: "0.7em",
        textAlign: "center",
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginTop: 2,
        marginBottom: 2
    },

    badge: {
        backgroundColor: "#44b700",
        color: "#44b700",
        boxShadow: `0 0 0 2px var(--color-primary)`,
        "&::after": {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            animation: "$ripple 1.2s infinite ease-in-out",
            border: "1px solid currentColor",
            content: '""',
        },
    },
    "@keyframes ripple": {
        "0%": {
            transform: "scale(.8)",
            opacity: 1,
        },
        "100%": {
            transform: "scale(2.4)",
            opacity: 0,
        },
    },
    tagIcon: {
        fontSize: "0.8em",
        marginRight: 2,
        marginLeft: 2,
        verticalAlign: "middle"
    },
};

const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 22,
    height: 22,
    border: `2px solid var(--color-primary)`,
}));

const getAvatarChannel = (channel) => {
    if (channel === "facebook") {
        return facebookIcon;
    }

    if (channel === "whatsapp") {
        return whatsappIcon;
    }

    if (channel === "whatsappapi") {
        return whatsappIcon;
    }

    if (channel === "instagram") {
        return insatagramIcon;
    }
};

const TicketListItem = ({ ticket }) => {
    // MIGRAÇÃO: usando objeto de estilos direto ao invés de makeStyles
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { user } = useContext(AuthContext);
    const { setCurrentTicket, setTabOpen } = useContext(TicketsContext);
    const [tagsWithFunnel, setTagsWithFunnel] = useState([]);

    useEffect(() => {
        console.log("======== TicketListItemCustom ===========")
        console.log(ticket)
        console.log("=========================================")
    }, [ticket])

    useEffect(() => {
        if (ticket && ticket.id) {
            const fetchTagsWithFunnel = async () => {
                try {
                    const { data } = await api.get(`/tags-funnel/${ticket.id}`);
                    console.log("Tags com funil recebidas:", data);
                    if (data && data.length > 0) {
                        setTagsWithFunnel(data);
                    }
                } catch (err) {
                    console.error("Erro ao buscar tags com funil:", err);
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

    function getRatingIcon(rate) {
        let icon = "";
        if (rate === 1) {
            icon = "😡";
        } else if (rate === 2) {
            icon = "😠";
        } else if (rate === 3) {
            icon = "😐";
        } else if (rate === 4) {
            icon = "😃";
        } else if (rate === 5) {
            icon = "😍";
        }

        return icon;
    }


    const handleAcepptTicket = async (ticket) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: "open",
                userId: user?.id,
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleAcepptTicketBot = async (ticket) => {
        // alert("Bot");
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: "open",
                userId: user?.id,
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleReopenTicket = async (ticket) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: "open",
                userId: user?.id,
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleViewTicket = async (ticket) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: "pending",
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    };

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setTabOpen(ticket.status)
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

    const handleClosedTicket = async (ticket) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: "closed",
            });
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
    };

    const renderUserName = (name) => {
        let str = name.replace(emojiRegex(), "").trim();

        const firstName = str.split(" ")[0];

        return firstName;
    };

    return (
        <React.Fragment key={ticket.id}>
            <ListItem
                dense
                button
                onClick={(e) => {
                    handleSelectTicket(ticket)
                }}
                selected={ticketId && +ticketId === ticket.id}
                sx={{
                    ...ticketStyles.ticket,
                    ...(ticket.status === "pending" ? ticketStyles.pendingTicket : {})
                }}
            >
                <Tooltip
                    arrow
                    placement="right"
                    title={ticket.queue?.name || "Sem departamento"}
                >
                    <span
                        style={{
                            backgroundColor: ticket.queue?.color || "#7C7C7C",
                        }}
                        sx={ticketStyles.ticketQueueColor}
                    ></span>
                </Tooltip>
                <ListItemAvatar>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        badgeContent={
                            <SmallAvatar
                                alt={ticket?.channel}
                                src={getAvatarChannel(ticket?.channel)}
                            />
                        }
                    >
                        <Avatar
                            alt={ticket?.contact?.name}
                            src={ticket?.contact?.urlPicture}
                        />
                    </Badge>
                </ListItemAvatar>
                <ListItemText
                    disableTypography
                    primary={
                        <span sx={ticketStyles.contactNameWrapper}>
                            <Typography
                                noWrap
                                component="span"
                                variant="body2"
                                color="textPrimary"
                            >
                                {ticket.contact.name}
                            </Typography>

                            {ticket.lastMessage && (
                                <Typography
                                    sx={ticketStyles.lastMessageTime}
                                    component="span"
                                    variant="body2"
                                    color="textSecondary"
                                >
                                    {isSameDay(
                                        parseISO(ticket.updatedAt),
                                        new Date()
                                    ) ? (
                                        <>
                                            {format(
                                                parseISO(ticket.updatedAt),
                                                "HH:mm"
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {format(
                                                parseISO(ticket.updatedAt),
                                                "dd/MM/yyyy"
                                            )}
                                        </>
                                    )}
                                </Typography>
                            )}
                            {ticket.whatsappId && (
                                <div
                                    sx={ticketStyles.userTag}
                                    title={i18n.t(
                                        "ticketsList.connectionTitle"
                                    )}
                                >
                                    {ticket.whatsapp?.name}
                                </div>
                            )}
                        </span>
                    }
                    secondary={
                        <span sx={ticketStyles.contactNameWrapper}>
                            {ticket.status === "closed"
                                ? ticket?.userRating
                                    ? getRatingIcon(ticket?.userRating?.rate)
                                    : null
                                : null}
                            <Typography
                                sx={ticketStyles.contactLastMessage}
                                noWrap
                                component="span"
                                variant="body2"
                                color="textSecondary"
                            >
                                {ticket.lastMessage ? (
                                    <MarkdownWrapper>
                                        {ticket.lastMessage}
                                    </MarkdownWrapper>
                                ) : (
                                    <br />
                                )}
                            </Typography>

                            <Badge
                                overlap="rectangular"
                                sx={ticketStyles.newMessagesCount}
                                badgeContent={ticket.unreadMessages}
                                classes={{
                                    badge: ticketStyles.badgeStyle,
                                }}
                            />
                        </span>
                    }
                />
                {ticket.status === "pending" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        loading={loading.toString()}
                        onClick={(e) =>
                            ticket.isBot
                                ? handleAcepptTicketBot(ticket)
                                : handleAcepptTicket(ticket)
                        }
                    >
                        <CheckIcon />
                    </IconButton>
                )}
                {/* {ticket.status === "pending" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        onClick={(e) => handleViewTicket(ticket)}
                    >
                        <VisibilityIcon />
                    </IconButton>
                )} */}
                <div sx={ticketStyles.divTags}>
                    {ticket.isGroup && (
                        <div sx={ticketStyles.tagsWrapper}>
                            <div
                                key={ticket.id}
                                sx={ticketStyles.tags}
                                // title={ticket.isGroup}
                                style={{
                                    backgroundColor: "#7C7C7C",
                                }}
                            >
                                Grupo
                            </div>
                        </div>
                    )}
                    {ticket.user?.id &&
                        user.profile.toUpperCase() === "ADMIN" && (
                            <div sx={ticketStyles.tagsWrapper}>
                                <div
                                    key={ticket.user.id}
                                    sx={ticketStyles.tags}
                                    title={renderUserName(ticket.user.name)}
                                    style={{
                                        backgroundColor:
                                            ticket.user.color === "" ||
                                                !ticket.user.color
                                                ? "#7C7C7C"
                                                : ticket.user.color,
                                    }}
                                >
                                    {renderUserName(ticket.user.name)}
                                </div>
                            </div>
                        )}
                    {/* Ícones de tags normais (não kanban) */}
                    {getNormalTags().map((tag, index) => (
                        <div key={`normal-tag-${tag.id}`} sx={ticketStyles.tagsWrapper}>
                            <Tooltip title={tag.name}>
                                <LocalOfferIcon 
                                    sx={ticketStyles.tagIcon}
                                    style={{ color: tag.color }}
                                />
                            </Tooltip>
                        </div>
                    ))}
                    {/* Novo badge para exibir funil + tag */}
                    {tagsWithFunnel.length > 0 && (
                        <div sx={ticketStyles.tagsWrapper} style={{ marginBottom: '4px' }}>
                            <FunilTag tag={tagsWithFunnel[0]} />
                        </div>
                    )}
                        
                    {/* Mostrar tags com informações de funil, se disponíveis */}
                    {tagsWithFunnel.length > 0 ? (
                        <>
                            <div sx={ticketStyles.tagsWrapper}>
                                <div
                                    key={tagsWithFunnel[0].id}
                                    sx={ticketStyles.tags}
                                    title={tagsWithFunnel[0].funilName ? `${tagsWithFunnel[0].funilName} - ${tagsWithFunnel[0].name}` : tagsWithFunnel[0].name}
                                    style={{
                                        backgroundColor: tagsWithFunnel[0].color,
                                    }}
                                >
                                    {tagsWithFunnel[0].funilName 
                                        ? `${tagsWithFunnel[0].funilName} - ${tagsWithFunnel[0].name}`.toUpperCase()
                                        : tagsWithFunnel[0].name.toUpperCase()
                                    }
                                </div>
                            </div>
                            {tagsWithFunnel.length > 1 && (
                                <div
                                    key={tagsWithFunnel[1].id}
                                    sx={ticketStyles.tags}
                                    title={`+${tagsWithFunnel.length - 1}`}
                                    style={{
                                        backgroundColor: tagsWithFunnel[1].color,
                                    }}
                                >
                                    +{tagsWithFunnel.length - 1}
                                </div>
                            )}
                        </>
                    ) : (
                        ticket.tags?.length > 0 && (
                            <>
                                <div sx={ticketStyles.tagsWrapper}>
                                    <div
                                        key={ticket.tags[0].id}
                                        sx={ticketStyles.tags}
                                        title={ticket.tags[0].name}
                                        style={{
                                            backgroundColor: ticket.tags[0].color,
                                        }}
                                    >
                                        {ticket.tags[0].name.toUpperCase()}
                                    </div>
                                </div>
                                {ticket.tags.length > 1 && (
                                    <div
                                        key={ticket.tags[1].id}
                                        sx={ticketStyles.tags}
                                        title={ticket.tags[1].name}
                                        style={{
                                            backgroundColor: ticket.tags[1].color,
                                        }}
                                    >
                                        +{ticket.tags.length - 1}
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {(ticket.status === "pending" && (user.showDashboard === "enabled" || user.profile === "admin")) && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        onClick={(e) => handleClosedTicket(ticket)}
                    >
                        <ClearOutlinedIcon />
                    </IconButton>
                )}
                {ticket.status === "open" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        onClick={(e) => handleViewTicket(ticket)}
                    >
                        <ReplayIcon />
                    </IconButton>
                )}
                {ticket.status === "open" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        onClick={(e) => handleClosedTicket(ticket)}
                    >
                        <ClearOutlinedIcon />
                    </IconButton>
                )}
                {ticket.status === "closed" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                        onClick={(e) => handleReopenTicket(ticket)}
                    >
                        <ReplayIcon />
                    </IconButton>
                )}
                {ticket.status === "closed" && (
                    <IconButton
                        sx={ticketStyles.bottomButton}
                        color="primary"
                    ></IconButton>
                )}
            </ListItem>
            <Divider variant="inset" component="li" />
        </React.Fragment>
    );
};

export default TicketListItem;
