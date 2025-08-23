import React, { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

import { AuthContext } from "../../context/Auth/AuthContext";
import {  ReportProblem, VisibilityOutlined } from "@mui/icons-material";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { toast } from "../ui/ToastProvider";
import { yellow } from "@mui/material/colors";
import { Avatar, CardHeader, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography, Card, Container, Badge, Grid, Tooltip } from "@mui/material";
import { format, isSameDay, parseISO } from "date-fns";
import { grey } from "@mui/material/colors";
import { getBackendUrl } from "../../config";

const backendUrl = getBackendUrl();

const useStyles = () => ({
  main: {
    display: "flex",
    justifyContent: "space-between",
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    overflowY: "scroll",
    
  },
  cardHeader: {
    width: "380px",
    height: "78px",
    padding: 10,
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    borderBottom: 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    "@media (max-width:600px)": {
      width: '100%',
      maxWidth: '380px',
    },
    '& .MuiCardHeader-root': {
      padding: '8px 16px',
      alignItems: 'center',
    },
    '& .MuiCardHeader-content': {
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiCardHeader-title': {
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2,
    },
    '&:hover': {
      background: '#000',
      '& .MuiCardHeader-title': {
        color: '#fff',
      },
      '& .MuiCardHeader-subheader': {
        color: '#f0f0f0',
      },
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
  },
  cardHeaderPending: {
    width: "380px",
    height: "78px",
    padding: 10,
    background: '#02c208',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    borderBottom: 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    "@media (max-width:600px)": {
      width: '100%',
      maxWidth: '380px',
    },
    '& .MuiCardHeader-root': {
      padding: '8px 16px',
      alignItems: 'center',
    },
    '& .MuiCardHeader-content': {
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiCardHeader-title': {
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2,
    },
    '&:hover': {
      background: 'rgb(4, 170, 9)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
  },
  card: {
    height: "300px",
    width: "380px",
    borderRadius: 8,
    flex: 1,
    maxHeight: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    "@media (max-width:600px)": {
      width: '100%',
      maxWidth: '380px',
      margin: "4px",
    },
    // Custom scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#02c208',
      borderRadius: '4px',
      '&:hover': {
        background: '#019a06',
      },
    },
    '&:hover': {
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      transform: 'translateY(-2px)',
    },
  },
  changeWarap: {
    width: '380px',
    padding: 0,
    margin: 0,
    borderRadius: 8,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    "@media (max-width:600px)": {
      width: '100%',
      maxWidth: '380px',
    },
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
  pending: {
    color: yellow[600],
    fontSize: '20px'
  },
  connectionTag: {
    background: "linear-gradient(45deg, #02c208,rgb(4, 170, 9))",
    color: "#FFF",
    marginRight: 4,
    padding: '2px 8px',
    fontWeight: 'bold',
    borderRadius: 12,
    fontSize: "0.7em",
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    marginRight: "1px",
    color: grey[400],
    fontSize: '0.75rem',
  },
  lastMessageTimeUnread: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    color: "#02c208",
    fontWeight: "bold",
    marginRight: "1px",
    fontSize: '0.75rem',
  },
  listItem: {
    borderRadius: 8,
    margin: 4,
    paddingLeft: 8,
    paddingRight: 8,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.04)',
      transform: 'translateX(4px)',
    },
    '& .MuiListItemText-root': {
      marginLeft: 0,
      paddingLeft: 0,
    },
    '& .MuiListItemAvatar-root': {
      minWidth: '40px',
      marginRight: 8,
    },
  },
});

const DashboardManage = () => {
  const classes = useStyles();
  const history = useHistory();
  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [update, setUpdate] = useState(false);
  const [ticketNot, setTicketNot] = useState(0);
  const companyId = user.companyId;


  const userQueueIds = user?.queues?.map((q) => q.id) || [];
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);

 

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/usersMoments");
        console.log(data)
        setTickets(data);
        setUpdate(!update);
      } catch (err) {
        if (err.response?.status !== 500) {
          toastError(err);
        } else {
          toast.error(`${i18n.t("frontEndErrors.getUsers")}`);
        }
      }
    })();
  }, []);

  useEffect(() => {
    const companyId = user.companyId;
    console.log("socket painel")
    // const socket = socketManager.GetSocket();
  
    // const onConnect = () => {
    //   socket.emit("joinChatBox", `${ticketId}`);
    // }
    const onAppMessage = (data) => {
      if (data.action === "create" || data.action === "update" || data.action === "delete") {
        (async () => {
          try {
            const { data } = await api.get("/usersMoments");
            setTickets(data);
            setUpdate(!update);
          } catch (err) {
            if (err.response?.status !== 500) {
              toastError(err);
            } else {
              toast.error(`${i18n.t("frontEndErrors.getUsers")}`);
            }
          }
        })();
      }
    }
  
    // socket.on("connect", onConnect);
    socket.on(`company-${companyId}-ticket`, onAppMessage)
    socket.on(`company-${companyId}-appMessage`, onAppMessage);
  
    return () => {
      // socket.off("connect", onConnect);
      socket.off(`company-${companyId}-ticket`, onAppMessage)
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
  }, [socket]);

  const Moments = useMemo(() => {
    // console.log(tickets)
    if (tickets && tickets.length > 0) {
      const ticketsByUser = tickets.reduce((userTickets, ticket) => {
        const user = ticket.user;

        if (user) {
          const userIndex = userTickets.findIndex((group) => group.user.id === user.id);
          if (userIndex === -1) {
            userTickets.push({
              user,
              userTickets: [ticket],
            });
          } else {
            userTickets[userIndex].userTickets.push(ticket);
          }
        }
        return userTickets;
      }, []);

      return ticketsByUser.map((group, index) => (
        <Grid item key={index}>
          <div padding={20} className={classes.main} key={index}>
            <div className={classes.changeWarap}>
              <Paper elevation={0} className={classes.cardHeader}>
                <CardHeader
                  style={{ maxWidth: '380px', width: '100%' }}
                  avatar={<Avatar alt={`${group.user.profileImage}`} src={group.user.profileImage ? `${backendUrl}/public/company${companyId}/user/${group.user.profileImage}` : null} />}
                  title={(
                    <span>{group?.user?.name || "Pendentes"} <br />
                      {`Atendimentos: ${group.userTickets?.length}`}
                    </span>
                  )}
                />
              </Paper>
              <Paper square elevation={0} className={classes.card}>
                {group.userTickets.map((ticket) => (
                  <List style={{ paddingTop: 0 }} key={ticket.id}>
                    <ListItem dense button className={classes.listItem}>
                      <ListItemAvatar>
                        <Avatar alt={`${ticket.contact.urlPicture}`} src={`${ticket.contact.urlPicture}`} />
                      </ListItemAvatar>
                      <ListItemText
                        disableTypography
                        primary={ticket?.contact?.name?.length > 30 ? ticket?.contact?.name.substring(0, 25) + '...' : ticket?.contact?.name}
                        secondary={
                          <Fragment>
                            <div>
                              <Typography
                                style={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                              >
                                {`${ticket.lastMessage?.length > 30 ? String(ticket.lastMessage).substring(0, 27) + '...' : ticket.lastMessage}`}
                              </Typography>
                            </div>
                            <Badge className={classes.connectionTag}>{ticket?.whatsapp?.name}</Badge>
                            <Badge style={{ backgroundColor: ticket.queue?.color || "#7c7c7c" }} className={classes.connectionTag}>{ticket.queue?.name.toUpperCase() || "SEM FILA"}</Badge>
                          </Fragment>
                        }
                      />
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
                      {(user.profile === "admin" || ticket.userId === user.id) && (
                        <Tooltip title="Acessar Ticket">
                          <VisibilityOutlined
                            onClick={() => history.push(`/tickets/${ticket.uuid}`)}
                            fontSize="small"
                            style={{
                              color: grey[500],
                              cursor: "pointer",
                              marginRight: 5,
                              bottom: "-15px"
                            }}
                          />
                        </Tooltip>
                      )}
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </List>
                ))}
              </Paper>
            </div>
          </div>
        </Grid>
      )
      );
    } else {
      return null;
    }
  }, [update]);

  const MomentsPending = useMemo(() => {
    if (tickets && tickets.length > 0) {
      const pendingTickets = tickets.filter((ticket) => !ticket.user);

      return (
        <Grid item >
          <div className={classes.main}>
            <div padding={2} className={classes.changeWarap}>
              <Paper elevation={0} className={classes.cardHeaderPending}>
                <CardHeader
                  style={{ maxWidth: '380px', width: '100%' }}
                  avatar={<Avatar />}
                  title={(
                    <span>{"Pendentes"}
                      <ReportProblem className={classes.pending} />
                      <div>
                        Atendimentos: {pendingTickets?.length}
                      </div>
                    </span>
                  )}
                />
              </Paper>
              <Paper square elevation={0} className={classes.card}>
                {pendingTickets.map((ticket) => (
                  <List style={{ paddingTop: 0 }} key={ticket.id}>
                    <ListItem dense button className={classes.listItem}>
                      <ListItemAvatar>
                        <Avatar alt={`${ticket.contact.urlPicture}`} src={`${ticket.contact.urlPicture}`} />
                      </ListItemAvatar>
                      <ListItemText
                        disableTypography
                        primary={ticket?.contact?.name}
                        secondary={
                          <Fragment>
                            <div>
                              <Typography
                                style={{ display: 'inline' }}
                                component="span"
                                variant="body2"
                              >
                                {`${ticket.lastMessage?.length > 30 ? String(ticket.lastMessage).substring(0, 27) + '...' : ticket.lastMessage}`}
                              </Typography>
                            </div>
                            <Badge className={classes.connectionTag}>{ticket?.whatsapp?.name}</Badge>
                            <Badge style={{ backgroundColor: ticket.queue?.color || "#7c7c7c" }} className={classes.connectionTag}>{ticket.queue?.name.toUpperCase() || "SEM FILA"}</Badge>
                          </Fragment>
                        }
                      />
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
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </List>
                ))}
              </Paper>
            </div>
          </div>
        </Grid>
      );
    } else {
      return null;
    }
  }, [update]);

  return (
    <Fragment>
      <Grid container spacing={2}>
        {Moments}
        {MomentsPending}
      </Grid>
    </Fragment>
  );
};

export default DashboardManage;
