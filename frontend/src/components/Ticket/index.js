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
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
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
    gap: "4px",
  },
  
  ticketActionButtonsSmall: {
    "@media (max-width: 1366px)": {
      "& .MuiIconButton-root": {
        padding: "4px",
        "& svg": {
          fontSize: "1.2rem",
        },
      },
      "& .MuiButton-root": {
        padding: "4px 8px",
        fontSize: "0.75rem",
        minWidth: "auto",
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
  const headerRef = useRef(null);
  const { companyId } = user;

  useEffect(() => {
    console.log("======== Ticket ===========")
    console.log(ticket)
    console.log("===========================")
}, [ticket])


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
      <Paper
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
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
      />

    </div>
  );
};

export default Ticket;
