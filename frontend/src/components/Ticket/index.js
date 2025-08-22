import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";

import clsx from "clsx";

import { makeStyles, Paper, Tooltip } from "@material-ui/core";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageProvider } from "../../context/ForwarMessage/ForwardMessageContext";

import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { isNil } from 'lodash';
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderLeft: "0",
    marginRight: 0, // Removido marginRight negativo pois agora é sempre overlay
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.down("md")]: {
      height: "calc(100vh - 64px)", // Ajuste para header mobile
    },
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    "@media (max-width: 1366px)": {
      maxWidth: "100%",
    },
  },

  mainWrapperShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
  
  ticketActionButtonsWrapper: {
    transition: "all 0.3s ease-in-out",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    "@media (max-width: 1366px)": {
      gap: "1px",
    },
  },
  
  ticketActionButtonsSmall: {
    "@media (max-width: 1366px)": {
      "& .MuiIconButton-root": {
        padding: "2px",
        margin: "0 1px",
        "& svg": {
          fontSize: "1.1rem",
        },
      },
      "& .MuiButton-root": {
        padding: "2px 6px",
        fontSize: "0.7rem",
        minWidth: "auto",
      },
    },
    "@media (max-width: 1200px)": {
      "& .MuiIconButton-root": {
        padding: "1px",
        margin: "0",
        "& svg": {
          fontSize: "1rem",
        },
      },
    },
  },
  
  ticketHeaderWrapper: {
    "@media (max-width: 1366px)": {
      "& #TicketHeader": {
        minWidth: "200px !important",
      },
    },
  },

  // Seta flutuante indicativa
  floatingIndicator: {
    position: "fixed",
    top: "50%",
    right: "15px",
    transform: "translateY(-50%)",
    zIndex: 1200,
    color: "#46c9b3", // Verde do sistema
    cursor: "pointer",
    animation: "$pulse 2s infinite",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-50%) scale(1.2)",
      color: "#3ba896", // Verde mais escuro no hover
    },
  },

  "@keyframes pulse": {
    "0%": {
      opacity: 0.7,
      transform: "translateY(-50%) scale(1)",
    },
    "50%": {
      opacity: 1,
      transform: "translateY(-50%) scale(1.05)",
    },
    "100%": {
      opacity: 0.7,
      transform: "translateY(-50%) scale(1)",
    },
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user, socket } = useContext(AuthContext);
  const { setTabOpen } = useContext(TicketsContext);


  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [dragDropFiles, setDragDropFiles] = useState([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hasSpaceConflict, setHasSpaceConflict] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const headerRef = useRef(null);
  const { companyId } = user;

  useEffect(() => {
    console.log("======== Ticket ===========")
    console.log(ticket)
    console.log("===========================")
}, [ticket])

  // Detectar telas pequenas apenas para responsividade dos botões
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallScreen(width <= 1366);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Detectar quando precisa usar modo compacto
  useEffect(() => {
    const checkForCompactMode = () => {
      if (!headerRef.current) return;
      
      const headerWidth = headerRef.current.offsetWidth;
      const ticketInfoElement = document.getElementById('TicketHeader');
      const ticketInfoWidth = ticketInfoElement ? ticketInfoElement.offsetWidth : 0;
      
      // Múltiplas condições para ativar modo compacto
      const spaceRatio = ticketInfoWidth / headerWidth;
      const hasLimitedSpace = spaceRatio > 0.45; // Threshold reduzido para 45%
      const isNarrowScreen = headerWidth < 600; // Telas muito estreitas sempre usam compacto
      
      // Detectar se botões quebraram para segunda linha
      const buttonsContainer = headerRef.current?.querySelector('[style*="flexShrink: 0"]');
      const headerRect = headerRef.current?.getBoundingClientRect();
      const buttonsRect = buttonsContainer?.getBoundingClientRect();
      const buttonsWrapped = buttonsRect && headerRect && 
        (buttonsRect.top > headerRect.top + 10); // 10px de tolerância
      
      const needsCompactMode = hasLimitedSpace || isNarrowScreen || buttonsWrapped;
      
      
      
      setHasSpaceConflict(needsCompactMode);
      return needsCompactMode;
    };

    // Usar requestAnimationFrame para garantir que o layout esteja completo
    const checkWithAnimation = () => {
      requestAnimationFrame(() => {
        setTimeout(checkForCompactMode, 50); // Pequeno delay adicional
      });
    };

    checkWithAnimation();
    
    // Também verificar quando a janela for redimensionada
    window.addEventListener('resize', checkWithAnimation);
    
    return () => {
      window.removeEventListener('resize', checkWithAnimation);
    };
  }, [drawerOpen, ticket.id]); // Reagir a mudanças no drawer e ticket

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {

          if (!isNil(ticketId) && ticketId !== "undefined") {

            const { data } = await api.get("/tickets/u/" + ticketId);

            setContact(data.contact);
            // setWhatsapp(data.whatsapp);
            // setQueueId(data.queueId);
            setTicket(data);
            if (["pending", "open", "group"].includes(data.status)) {
              setTabOpen(data.status);
            }
            setLoading(false);
          }
        } catch (err) {
          history.push("/tickets");   // correção para evitar tela branca uuid não encontrado Feito por Altemir 16/08/2023
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    if (!ticket && !ticket.id && ticket.uuid !== ticketId && ticketId === "undefined") {
      return;
    }

    if (user.companyId) {
      //    const socket = socketManager.GetSocket();

      const onConnectTicket = () => {
        socket.emit("joinChatBox", `${ticket.id}`);
      }

      const onCompanyTicket = (data) => {
        if (data.action === "update" && data.ticket.id === ticket?.id) {
          setTicket(data.ticket);
        }

        if (data.action === "delete" && data.ticketId === ticket?.id) {
          history.push("/tickets");
        }
      };

      const onCompanyContactTicket = (data) => {
        if (data.action === "update") {
          // if (isMounted) {
          setContact((prevState) => {
            if (prevState.id === data.contact?.id) {
              return { ...prevState, ...data.contact };
            }
            return prevState;
          });
          // }
        }
      };

      socket.on("connect", onConnectTicket)
      socket.on(`company-${companyId}-ticket`, onCompanyTicket);
      socket.on(`company-${companyId}-contact`, onCompanyContactTicket);

      return () => {

        socket.emit("joinChatBoxLeave", `${ticket.id}`);
        socket.off("connect", onConnectTicket);
        socket.off(`company-${companyId}-ticket`, onCompanyTicket);
        socket.off(`company-${companyId}-contact`, onCompanyContactTicket);
      };
    }
  }, [ticketId, ticket, history]);

  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);


  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          isGroup={ticket.isGroup}
          onDrop={setDragDropFiles}
          whatsappId={ticket.whatsappId}
          queueId={ticket.queueId}
          channel={ticket.channel}
        >
        </MessagesList>
        <MessageInput
          ticketId={ticket.id}
          ticketStatus={ticket.status}
          ticketChannel={ticket.channel}
          droppedFiles={dragDropFiles}
          contactId={contact.id}
          ticket={ticket}
        />
      </>
    );
  };


  return (
    <div className={classes.root} id="drawer-container">
      {/* Ícone flutuante indicativo do drawer */}
      {!drawerOpen && (
        <Tooltip title="Clique para ver informações do contato" placement="left">
          <div 
            className={classes.floatingIndicator}
            onClick={handleDrawerOpen}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.58Z"/>
            </svg>
          </div>
        </Tooltip>
      )}

      <Paper
        elevation={0}
        className={classes.mainWrapper}
      >
        {/* <div id="TicketHeader"> */}
        <TicketHeader loading={loading}>
          <div 
            ref={headerRef}
            className={classes.ticketHeaderWrapper} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              flexWrap: 'nowrap', // Sempre nowrap, deixamos o modo compacto lidar com overflow
              gap: '8px'
            }}
          >
            {ticket.contact !== undefined && (
              <div id="TicketHeader" style={{ 
                flex: '1', 
                minWidth: '180px', // Sempre valor menor para mais flexibilidade
                overflow: 'hidden' 
              }}>
                <TicketInfo
                  contact={contact}
                  ticket={ticket}
                  onClick={handleDrawerOpen}
                />
              </div>
            )}
            <div 
              className={clsx(
                classes.ticketActionButtonsWrapper,
                hasSpaceConflict && classes.ticketActionButtonsSmall
              )}
              style={{ flexShrink: 0 }}
            >
              <TicketActionButtons
                ticket={ticket}
                compactMode={hasSpaceConflict}
              />
            </div>
          </div>
        </TicketHeader>
        {/* </div> */}
        
        <ReplyMessageProvider>
          <ForwardMessageProvider>
            <EditMessageProvider>
              {renderMessagesList()}
            </EditMessageProvider>
          </ForwardMessageProvider>
        </ReplyMessageProvider>
      </Paper>

      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
        isOverlay={true}
      />

    </div>
  );
};

export default Ticket;
