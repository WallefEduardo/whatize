import React, { useContext, useState, useEffect, useReducer, useRef, memo, useCallback } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";
import { isNil } from "lodash";
import { blue, green, red } from "@mui/material/colors";
import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Badge,
  Box
} from "@mui/material";

import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Facebook,
  Instagram,
  Reply,
  Close,
  PictureAsPdf,
  Description,
  InsertDriveFile,
} from "@mui/icons-material";

import MarkdownWrapper from "../MarkdownWrapper";
import VcardPreview from "../VcardPreview";
import LocationPreview from "../LocationPreview";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.webp";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";
import YouTubePreview from "../ModalYoutubeCors";

import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import AdMetaPreview from "../AdMetaPreview"; // Adicionado componente de preview de anúncio
// import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";
import SelectMessageCheckbox from "./SelectMessageCheckbox";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";
import AudioModal from "../AudioModal";
import { messages } from "../../translate/languages";
import { useParams, useHistory } from 'react-router-dom';
import { downloadResource } from "../../utils";

// MIGRAÇÃO GRADUAL: makeStyles → sx prop
// Bloco por bloco para preservar funcionalidade
const messageStyles = {
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  currentTick: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "auto",
    backgroundColor: "#1976d2",
    margin: "10px",
    borderRadius: "50px",
    boxShadow: "1px 5px 10px #b3b3b3",
  },

  currentTicktText: {
    color: "#1976d2",
    borderRadius: 8,
    padding: 10,
    alignSelf: "center",
    marginLeft: "0px",
    background: `#46c9b3`
  },

  messagesList: {
    backgroundImage: `url(${whatsBackground})`,
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 100px 20px",
    overflowY: "scroll",
    
  },
  dragElement: {
    background: 'rgba(255, 255, 255, 0.8)',
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 999999,
    textAlign: "center",
    fontSize: "3em",
    border: "5px dashed #333",
    color: '#333',
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  circleLoading: {
    color: blue[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#cffff7",
    color: "#303030",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3"
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#388aff",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3"
  },

  messageRightPrivate: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: "#afeaff",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3"
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: "#cfe9ba",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  messageMedia: {
    objectFit: "cover",
    width: 200,
    height: "auto",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  forwardMessage: {
    fontSize: 12,
    fontStyle: "italic",
    position: "absolute",
    top: 0,
    left: 5,
    color: "#999",
    display: "flex",
    alignItems: "center"
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: blue[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  ackPlayedIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
    color: "#1976d2",
  },

  // Novos estilos para documentos estilo WhatsApp
  documentContainer: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#c5deb2",
    borderRadius: "8px",
    maxWidth: "350px",
    minWidth: "250px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
  },

  documentIcon: {
    width: "48px",
    height: "48px",
    marginRight: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: "#e3f2fd",
  },

  documentInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  documentName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#303030",
    marginBottom: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  documentSize: {
    fontSize: "12px",
    color: "#667781",
  },

  downloadIcon: {
    width: "24px",
    height: "24px",
    color: "#667781",
    marginLeft: "8px",
    cursor: "pointer",
    "&:hover": {
      color: "#303030",
    },
  },

  messageCenter: {
    marginTop: 5,
    alignItems: "center",
    verticalAlign: "center",
    alignContent: "center",
    backgroundColor: "#E1F5FEEB",
    fontSize: "12px",
    minWidth: 100,
    maxWidth: 270,
    color: "#272727",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  deletedMessage: {
    color: '#f55d65'
  }
};

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {

      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({
  isGroup,
  onDrop,
  whatsappId,
  queueId,
  channel
}) => {
  // MIGRAÇÃO: usando objeto de estilos direto ao invés de makeStyles
  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const history = useHistory();
  const lastMessageRef = useRef();

  const [selectedMessage, setSelectedMessage] = useState({});
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const { ticketId } = useParams();

  const currentTicketId = useRef(ticketId);
  const { getAll } = useCompanySettings();
  const [dragActive, setDragActive] = useState(false);

  const [lgpdDeleteMessage, setLGPDDeleteMessage] = useState(false);
  const { selectedQueuesMessage } = useContext(QueueSelectedContext);

  const { showSelectMessageCheckbox } = useContext(ForwardMessageContext);

  const { user, socket } = useContext(AuthContext);

  const companyId = user.companyId;

  useEffect(() => {

    async function fetchData() {

      const settings = await getAll(companyId);

      let settinglgpdDeleteMessage;
      let settingEnableLGPD;

      for (const [key, value] of Object.entries(settings)) {

        if (key === "lgpdDeleteMessage") settinglgpdDeleteMessage = value
        if (key === "enableLGPD") settingEnableLGPD = value
      }
      if (settingEnableLGPD === "enabled" && settinglgpdDeleteMessage === "enabled") {
        setLGPDDeleteMessage(true);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);

    currentTicketId.current = ticketId;
  }, [ticketId, selectedQueuesMessage]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === "undefined") {
          history.push("/tickets");
          return;
        }
        if (isNil(ticketId)) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber, selectedQueues: JSON.stringify(selectedQueuesMessage) },
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setLoading(false);
            setLoadingMore(false);
          }

          if (pageNumber === 1 && data.messages.length > 1) {
            scrollToBottom();
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
          setLoadingMore(false);
        }
      };

      fetchMessages();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId, selectedQueuesMessage]);

  useEffect(() => {
    if (ticketId === "undefined") {
      return;
    }

    const companyId = user.companyId;

    //    const socket = socketManager.GetSocket();
    const connectEventMessagesList = () => {
      socket.emit("joinChatBox", `${ticketId}`);
    }

    const onAppMessageMessagesList = (data) => {
      if (data.action === "create" && data.ticket.uuid === ticketId) {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update" && data?.message?.ticket?.uuid === ticketId) {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
      }

      if (data.action == "delete" && data.message.ticket?.uuid === ticketId) {
        dispatch({ type: "DELETE_MESSAGE", payload: data.messageId });
      }
    }
    socket.on("connect", connectEventMessagesList);
    socket.on(`company-${companyId}-appMessage`, onAppMessageMessagesList);

    return () => {

      socket.emit("joinChatBoxLeave", `${ticketId}`)

      socket.off("connect", connectEventMessagesList);
      socket.off(`company-${companyId}-appMessage`, onAppMessageMessagesList);
    };

  }, [ticketId]);

  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

const scrollToBottom = () => {
  setTimeout(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
    }
  }, 100);
};

const handleScroll = (e) => {
  if (!hasMore) return;
  const { scrollTop } = e.currentTarget;

  if (scrollTop === 0) {
    document.getElementById("messagesList").scrollTop = 1;
  }

  if (loading) {
    return;
  }

  if (scrollTop < 50) {
    loadMore();
  }
};

const handleOpenMessageOptionsMenu = (e, message) => {
  setAnchorEl(e.currentTarget);
  setSelectedMessage(message);
};

const handleCloseMessageOptionsMenu = (e) => {
  setAnchorEl(null);
};

const hanldeReplyMessage = (e, message) => {
  //if (ticket.status === "open" || ticket.status === "group") {
  setAnchorEl(null);
  setReplyingMessage(message);
  //}
};

const checkMessageMedia = (message) => {
  console.log(message)
  if (message.mediaType === "locationMessage" && message.body.split('|').length >= 2) {
    let locationParts = message.body.split('|')
    let imageLocation = locationParts[0]
    let linkLocation = locationParts[1]

    let descriptionLocation = null

    if (locationParts.length > 2)
      descriptionLocation = message.body.split('|')[2]

    return <LocationPreview image={imageLocation} link={linkLocation} description={descriptionLocation} />
  } else

    if (message.mediaType === "contactMessage") {
      let array = message.body.split("\n");
      let obj = [];
      let contact = "";
      for (let index = 0; index < array.length; index++) {
        const v = array[index];
        let values = v.split(":");
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf("+") !== -1) {
            obj.push({ number: values[ind] });
          }
          if (values[ind].indexOf("FN") !== -1) {
            contact = values[ind + 1];
          }
        }
      }
      // console.log(message)
      return <VcardPreview contact={contact} numbers={obj[0]?.number} queueId={message?.ticket?.queueId} whatsappId={message?.ticket?.whatsappId} />
    }
    else if (message.mediaType === "adMetaPreview") { // Adicionado para renderizar o componente de preview de anúncio
      console.log("Entrou no MetaPreview");
      let [image, sourceUrl, title, body, messageUser] = message.body.split('|');
      return <AdMetaPreview image={image} sourceUrl={sourceUrl} title={title} body={body} messageUser={messageUser} />;
  } 
    else

      if (message.mediaType === "image") {
        return <ModalImageCors imageUrl={message.mediaUrl} />;
      } else

        if (message.mediaType === "audio") {
          return (
            <AudioModal url={message.mediaUrl} />
            // <audio controls>
            //   <source src={message.mediaUrl} type="audio/ogg"></source>
            //   {/* <source src={message.mediaUrl} type="audio/mp3"></source> */}
            // </audio>
          );
        } else

          if (message.mediaType === "video") {
            return (
              <video
                style={messageStyles.messageMedia}
                src={message.mediaUrl}
                controls
              />
            );
          } else if (message.mediaType === "application" || isDocumentFile(message.body)) {
            // Layout estilo WhatsApp para documentos
            // Usar mediaUrl se disponível, senão usar body para extrair nome do arquivo
            const fileSource = message.mediaUrl || message.body;
            const fileName = getOriginalFileName(fileSource);
            return (
              <div style={messageStyles.documentContainer}>
                <div style={messageStyles.documentIcon}>
                  {getDocumentIcon(fileSource)}
                </div>
                <div style={messageStyles.documentInfo}>
                  <div style={messageStyles.documentName}>
                    {fileName}
                  </div>
                  <div style={messageStyles.documentSize}>
                    <FileSize fileName={fileSource} mediaUrl={message.mediaUrl} />
                  </div>
                </div>
                <GetApp 
                  sx={messageStyles.downloadIcon}
                  onClick={() => {
                    downloadResource(message.mediaUrl || message.body)
                  }}
                />
              </div>
            );
          } else {
            // Fallback para outros tipos de arquivo
            return (
              <>
                <div style={messageStyles.downloadMedia}>
                  <Button
                    startIcon={<GetApp />}
                    variant="outlined"
                    target="_blank"
                    onClick={() => {
                      downloadResource(message.mediaUrl || message.body)
                    }}
                  >
                    Download
                  </Button>
                </div>
                <Divider />
              </>
            );
          }
};

const renderMessageAck = (message) => {
  if (message.ack === 0) {
    return <AccessTime fontSize="small" sx={messageStyles.ackIcons} />;
  } else
    if (message.ack === 1) {
      return <Done fontSize="small" sx={messageStyles.ackIcons} />;
    } else
      if (message.ack === 2) {
        return <DoneAll fontSize="small" sx={messageStyles.ackIcons} />;
      } else
        if (message.ack === 3 || message.ack === 4) {
          return <DoneAll fontSize="small" sx={message.mediaType === "audio" ? messageStyles.ackPlayedIcon : messageStyles.ackDoneAllIcon} />;
        } else
          if (message.ack === 5) {
            return <DoneAll fontSize="small" sx={messageStyles.ackDoneAllIcon} />
          }
};

const renderDailyTimestamps = (message, index) => {
  const today = format(new Date(), "dd/MM/yyyy")

  if (index === 0) {
    return (
      <span
        style={messageStyles.dailyTimestamp}
        key={`timestamp-${message.id}`}
      >
        <div style={messageStyles.dailyTimestampText}>
          {today === format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy") ? "HOJE" : format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
        </div>
      </span>
    );
  } else
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            style={messageStyles.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div style={messageStyles.dailyTimestampText}>
              {today === format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy") ? "HOJE" : format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    } else
      if (index === messagesList.length - 1) {
        return (
          <div
            key={`ref-${message.id}`}
            ref={lastMessageRef}
            style={{ float: "left", clear: "both" }}
          />
        );
      }
};


const renderTicketsSeparator = (message, index) => {
  let lastTicket = messagesList[index - 1]?.ticketId;
  let currentTicket = message.ticketId;

  if (lastTicket !== currentTicket && lastTicket !== undefined) {
    if (message?.ticket?.queue) {
      return (
        <span
          style={messageStyles.currentTick}
          key={`timestamp-${message.id}a`}
        >
          <div
            style={{
              ...messageStyles.currentTicktText,
              backgroundColor: message?.ticket?.queue?.color || "grey"
            }}
          >
            #{i18n.t("ticketsList.called")} {message?.ticketId} - {message?.ticket?.queue?.name}
          </div>

        </span>
      );
    } else {
      return (
        <span
          style={messageStyles.currentTick}
          key={`timestamp-${message.id}b`}
        >
          <div
            style={{
              ...messageStyles.currentTicktText,
              backgroundColor: "grey"
            }}
          >
            #{i18n.t("ticketsList.called")} {message.ticketId} - {i18n.t("ticketsList.noQueue")}
          </div>

        </span>
      );
    }
  }

};

const renderMessageDivider = (message, index) => {
  if (index < messagesList.length && index > 0) {
    let messageUser = messagesList[index].fromMe;
    let previousMessageUser = messagesList[index - 1].fromMe;
    if (messageUser !== previousMessageUser) {
      return (

        <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
      );
    }
  }
};

// Função para verificar se é um documento baseado na extensão
const isDocumentFile = (fileName) => {
  if (!fileName) return false;
  
  // Usar split para obter a extensão ao invés de path.extname
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'];
  
  return documentExtensions.includes(extension);
};

// Função para extrair o nome original do arquivo removendo os timestamps
const getOriginalFileName = (fileName) => {
  if (!fileName) return fileName;
  
  // Se é uma URL, extrair apenas o nome do arquivo
  if (fileName.startsWith('http') || fileName.includes('/')) {
    fileName = path.basename(fileName);
  }
  
  // Remove extensão temporariamente
  const extension = path.extname(fileName);
  const nameWithoutExt = fileName.replace(extension, '');
  
  // Padrão para remover números de timestamp no início e fim do nome
  // Exemplo: 1750034602009_Kit_de_Ferramentas_Hackers_1750034602009.pdf -> Kit_de_Ferramentas_Hackers.pdf
  const cleanName = nameWithoutExt.replace(/^\d+_/, '').replace(/_\d+$/, '');
  
  // Substitui underscores por espaços para melhor legibilidade
  const readableName = cleanName.replace(/_/g, ' ');
  
  return readableName + extension;
};

// Função para obter o ícone apropriado baseado na extensão do arquivo
const getDocumentIcon = (fileName) => {
  if (!fileName) return <InsertDriveFile style={{ fontSize: 28, color: '#1976d2' }} />;
  
  const extension = path.extname(fileName).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return <PictureAsPdf style={{ fontSize: 28, color: '#d32f2f' }} />;
    case '.doc':
    case '.docx':
      return <Description style={{ fontSize: 28, color: '#1976d2' }} />;
    case '.txt':
      return <Description style={{ fontSize: 28, color: '#757575' }} />;
    default:
      return <InsertDriveFile style={{ fontSize: 28, color: '#1976d2' }} />;
  }
};

// Cache para armazenar tamanhos de arquivo já consultados
const fileSizeCache = new Map();

// Função para formatar bytes em formato legível
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Função para obter o tamanho real do arquivo
const getFileSize = async (fileName, mediaUrl) => {
  if (!fileName) return "Documento";
  
  const extension = path.extname(fileName).toLowerCase();
  const fileType = extension.replace('.', '').toUpperCase();
  
  // Verifica se já temos o tamanho no cache
  const cacheKey = mediaUrl || fileName;
  if (fileSizeCache.has(cacheKey)) {
    const cachedSize = fileSizeCache.get(cacheKey);
    return `${fileType} • ${cachedSize}`;
  }
  
  // Se temos uma URL de mídia, tenta obter o tamanho real
  if (mediaUrl) {
    try {
      const response = await fetch(mediaUrl, { 
        method: 'HEAD',
        headers: {
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const sizeInBytes = parseInt(contentLength);
        const formattedSize = formatFileSize(sizeInBytes);
        
        // Armazena no cache
        fileSizeCache.set(cacheKey, formattedSize);
        
        return `${fileType} • ${formattedSize}`;
      }
    } catch (error) {
      console.log('Erro ao obter tamanho do arquivo:', error);
    }
  }
  
  // Fallback: retorna apenas o tipo do arquivo
  return `${fileType}`;
};

// Função síncrona para uso imediato (retorna tipo + placeholder)
const getFileSizeSync = (fileName) => {
  if (!fileName) return "Documento";
  
  const extension = path.extname(fileName).toLowerCase();
  const fileType = extension.replace('.', '').toUpperCase();
  
  return `${fileType}`;
};

// Componente para exibir o tamanho do arquivo de forma assíncrona
const FileSize = ({ fileName, mediaUrl }) => {
  const [fileSize, setFileSize] = useState(getFileSizeSync(fileName));
  
  useEffect(() => {
    const loadFileSize = async () => {
      const size = await getFileSize(fileName, mediaUrl);
      setFileSize(size);
    };
    
    loadFileSize();
  }, [fileName, mediaUrl]);
  
  return <span>{fileSize}</span>;
};

// Função para rolar até a mensagem citada
const scrollToQuotedMessage = (quotedMessageId) => {
  const messageElement = document.querySelector(`[data-message-id="${quotedMessageId}"]`);
  if (messageElement) {
    messageElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Adiciona um efeito de destaque temporário
    messageElement.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
    setTimeout(() => {
      messageElement.style.backgroundColor = '';
    }, 2000);
  }
};

const renderQuotedMessage = (message) => {

  return (
    <div
      style={{
        ...(message.fromMe ? messageStyles.quotedContainerRight : messageStyles.quotedContainerLeft),
        cursor: 'pointer'
      }}
      onClick={() => scrollToQuotedMessage(message.quotedMsg.id)}
    >
      <span
        style={message.quotedMsg?.fromMe ? messageStyles.quotedSideColorRight : messageStyles.quotedSideColorLeft}
      ></span>
      <div style={messageStyles.quotedMsg}>
        {!message.quotedMsg?.fromMe && (
          <span style={messageStyles.messageContactName}>
            {message.quotedMsg?.contact?.name}
          </span>
        )}

        {message.quotedMsg.mediaType === "audio"
          && (
            <div style={messageStyles.downloadMedia}>
              <AudioModal url={message.quotedMsg.mediaUrl} />

              {/* <audio controls>
                  <source src={message.quotedMsg.mediaUrl} type="audio/mp3"></source>
                  {/* <source src={message.quotedMsg.mediaUrl} type="audio/ogg"></source> 
                </audio> */}
            </div>
          )
        }
        {message.quotedMsg.mediaType === "video"
          && (
            <video
              style={messageStyles.messageMedia}
              src={message.quotedMsg.mediaUrl}
              controls
            />
          )
        }
        {message.quotedMsg.mediaType === "contactMessage"
          && (
            "Contato"
          )
        }
        {(message.quotedMsg.mediaType === "application" || isDocumentFile(message.quotedMsg.body))
          && (
            <div style={{ padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ marginRight: "8px" }}>
                  {getDocumentIcon(message.quotedMsg.body)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getOriginalFileName(message.quotedMsg.body)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#667781" }}>
                    <FileSize fileName={message.quotedMsg.body} mediaUrl={message.quotedMsg.mediaUrl} />
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {message.quotedMsg.mediaType === "image" && (
          <ModalImageCors imageUrl={message.quotedMsg.mediaUrl} />
        )}
        
        {message.quotedMsg.mediaType !== "image" && message.quotedMsg?.body}


      </div>
    </div>
  );
};

const handleDrag = event => {
  event.preventDefault();
  event.stopPropagation();
  if (event.type === "dragenter" || event.type === "dragover") {
    setDragActive(true);
  } else if (event.type === "dragleave") {
    setDragActive(false);
  }
}

const isYouTubeLink = (url) => {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url);
};

const handleDrop = event => {
  event.preventDefault();
  event.stopPropagation();
  setDragActive(false);
  if (event.dataTransfer.files && event.dataTransfer.files[0]) {
    if (onDrop) {
      onDrop(event.dataTransfer.files);
    }
  }
}
const xmlRegex = /<([^>]+)>/g;
const boldRegex = /\*(.*?)\*/g;

const formatXml = (xmlString) => {
  // Verifica se o XML contém a assinatura com nome do atendente
  if (boldRegex.test(xmlString)) {
    // Formata o texto dentro da assinatura em negrito
    xmlString = xmlString.replace(boldRegex, "**$1**");
  }
  return xmlString;
};

const renderMessages = () => {

  if (messagesList.length > 0) {
    const viewMessagesList = messagesList.map((message, index) => {
      if (message.mediaType === "call_log") {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderTicketsSeparator(message, index)}
            {renderMessageDivider(message, index)}
            <div style={messageStyles.messageCenter} data-message-id={message.id}>
              <IconButton
                variant="contained"
                size="small"
                id="messageActionsButton"
                disabled={message.isDeleted}
                sx={messageStyles.messageActionsButton}
                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
              >
                <ExpandMore />
              </IconButton>
              {isGroup && (
                <span style={messageStyles.messageContactName}>
                  {message.contact?.name}
                </span>
              )}

              {/* {isGroup && (
                  <span style={messageStyles.messageContactName}>
                    {JSON.parse(message.dataJson).pushName} #{message.contact?.name}
                  </span>
                )} */}
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">
                  <path fill="#df3333" d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"></path>
                </svg> <span>{i18n.t("ticketsList.missedCall")} {format(parseISO(message.createdAt), "HH:mm")}</span>
              </div>
            </div>
          </React.Fragment>
        );
      }

      if (!message.fromMe) {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderTicketsSeparator(message, index)}
            {renderMessageDivider(message, index)}
            <Box
              sx={messageStyles.messageLeft}
              title={message.queueId && message.queue?.name}
              onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              data-message-id={message.id}
            >
              {showSelectMessageCheckbox && (
                <SelectMessageCheckbox
                  // showSelectMessageCheckbox={showSelectMessageCheckbox}
                  message={message}
                // selectedMessagesList={selectedMessagesList}
                // setSelectedMessagesList={setSelectedMessagesList}
                />
              )}
              <IconButton
                variant="contained"
                size="small"
                id="messageActionsButton"
                disabled={message.isDeleted}
                sx={messageStyles.messageActionsButton}
                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
              >
                <ExpandMore />
              </IconButton>

              {message.isForwarded && (
                <div>
                  <span style={messageStyles.forwardMessage}
                  ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                  </span>
                  <br />
                </div>
              )}
              {isGroup && (
                <span style={messageStyles.messageContactName}>
                  {message.contact?.name}
                </span>
              )}
              {isYouTubeLink(message.body) && (
                <>
                  <YouTubePreview videoUrl={message.body} />
                </>
              )}
              {/* {isGroup && (
                  <span style={messageStyles.messageContactName}>
                    {JSON.parse(message.dataJson).pushName} #{message.contact?.name}
                  </span>
                )} */}

              {/* aviso de mensagem apagado pelo contato */}

              {!lgpdDeleteMessage && message.isDeleted && (
                <div>
                  <span style={messageStyles.deletedMessage}
                  >🚫 Essa mensagem foi apagada pelo contato &nbsp;
                  </span>
                </div>
              )}

              {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "contactMessage" || message.mediaType === "template" || message.mediaType === "adMetaPreview" // Adicionado para aceitar o componente de preview de anúncio
                //|| message.mediaType === "multi_vcard" 
              ) && checkMessageMedia(message)}

              <Box sx={{
                ...messageStyles.textContentItem,
                ...(message.isDeleted ? messageStyles.textContentItemDeleted : {})
              }}>
                {message.quotedMsg && renderQuotedMessage(message)}
                {
                  (
                    (message.mediaUrl !== null && (message.mediaType === "image" || message.mediaType === "video") && path.basename(message.mediaUrl).trim() !== message.body.trim()) ||
                    (message.mediaType === "application" || isDocumentFile(message.body)) && message.body && !isDocumentFile(message.body) ||
                    (message.mediaType !== "audio" &&
                    message.mediaType !== "image" &&
                    message.mediaType !== "video" &&
                    message.mediaType !== "application" &&
                    !isDocumentFile(message.body) &&
                    message.mediaType != "reactionMessage" &&
                    message.mediaType != "locationMessage" && message.mediaType !== "contactMessage" &&
                    message.mediaType !== "template" && message.mediaType !== "adMetaPreview")) && (
                    <>
                      {xmlRegex.test(message.body) && (
                        <span>{message.body}</span>

                      )}
                      {!xmlRegex.test(message.body) && (
                        <MarkdownWrapper>{(lgpdDeleteMessage && message.isDeleted) ? "🚫 _Mensagem apagada_ " :
                          message.body
                        }</MarkdownWrapper>)}

                    </>

                  )}

                {message.quotedMsg && message.mediaType === "reactionMessage" && (
                  <>
                    <span style={{ marginLeft: "0px" }}>
                      <MarkdownWrapper>
                        {"" + message?.contact?.name + " reagiu... " + message.body}
                      </MarkdownWrapper>
                    </span>
                  </>
                )}

                <span style={messageStyles.timestamp}>
                  {message.isEdited ? "Editada " + format(parseISO(message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                </span>
              </Box>
            </Box>
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderTicketsSeparator(message, index)}
            {renderMessageDivider(message, index)}
            <Box
              sx={message.isPrivate ? messageStyles.messageRightPrivate : messageStyles.messageRight}
              title={message.queueId && message.queue?.name}
              onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              data-message-id={message.id}
            >
              {showSelectMessageCheckbox && (
                <SelectMessageCheckbox
                  // showSelectMessageCheckbox={showSelectMessageCheckbox}
                  message={message}
                // selectedMessagesList={selectedMessagesList}
                // setSelectedMessagesList={setSelectedMessagesList}
                />
              )}

              <IconButton
                variant="contained"
                size="small"
                id="messageActionsButton"
                disabled={message.isDeleted}
                sx={messageStyles.messageActionsButton}
                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
              >
                <ExpandMore />
              </IconButton>
              {message.isForwarded && (
                <div>
                  <span style={messageStyles.forwardMessage}
                  ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                  </span>
                  <br />
                </div>
              )}
              {isYouTubeLink(message.body) && (
                <>
                  <YouTubePreview videoUrl={message.body} />
                </>
              )}
              {!lgpdDeleteMessage && message.isDeleted && (
                <div>
                  <span style={messageStyles.deletedMessage}
                  >🚫 Essa mensagem foi apagada &nbsp;
                  </span>
                </div>
              )}
              {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "contactMessage" || message.mediaType === "template" || message.mediaType === "adMetaPreview" // Adicionado para aceitar o componente de preview de anúncio
                //|| message.mediaType === "multi_vcard" 
              ) && checkMessageMedia(message)}
              <Box
                sx={{
                  ...messageStyles.textContentItem,
                  ...(message.isDeleted ? messageStyles.textContentItemDeleted : {})
                }}
              >

                {/* {message.isDeleted && (`🚫`)} */}



                {message.quotedMsg && renderQuotedMessage(message)}

                {
                  (
                    ((message.mediaType === "image" || message.mediaType === "video") && path.basename(message.mediaUrl) !== message.body) ||
                    ((message.mediaType === "application" || isDocumentFile(message.body)) && message.body && !isDocumentFile(message.body)) ||
                    (message.mediaType !== "audio" && message.mediaType !== "application" && !isDocumentFile(message.body) && message.mediaType != "reactionMessage" && message.mediaType != "locationMessage" && message.mediaType !== "contactMessage" && message.mediaType !== "template" && message.mediaType !== "adMetaPreview")
                  ) && (
                    <>
                      {xmlRegex.test(message.body) && (
                        <div>{formatXml(message.body)}</div>

                      )}
                      {!xmlRegex.test(message.body) && (<MarkdownWrapper>{message.body}</MarkdownWrapper>)}

                    </>
                  )}

                {message.quotedMsg && message.mediaType === "reactionMessage" && (
                  <>
                    <span style={{ marginLeft: "0px" }}>
                      <MarkdownWrapper>
                        {"Você reagiu... " + message.body}
                      </MarkdownWrapper>
                    </span>
                  </>
                )}

                <span style={messageStyles.timestamp}>
                  {message.isEdited ? "Editada " + format(parseISO(message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                  {renderMessageAck(message)}
                </span>
              </Box>
            </Box>
          </React.Fragment>
        );
      }
    });
    return viewMessagesList;
  } else {
    return <div>Diga olá para seu novo contato!</div>;
  }
};

return (
  <Box sx={messageStyles.messagesListWrapper} onDragEnter={handleDrag}>
    {dragActive && <Box sx={messageStyles.dragElement} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>Solte o arquivo aqui</Box>}

    <MessageOptionsMenu
      message={selectedMessage}
      anchorEl={anchorEl}
      menuOpen={messageOptionsMenuOpen}
      handleClose={handleCloseMessageOptionsMenu}
      isGroup={isGroup}
      whatsappId={whatsappId}
      queueId={queueId}
    />
    <Box
      id="messagesList"
      sx={messageStyles.messagesList}
      onScroll={handleScroll}
    >
      {messagesList.length > 0 ?
        renderMessages()
        : []}
    </Box>

    {(channel !== "whatsapp" && channel !== undefined) && (
      <div
        style={{
          width: "100%",
          display: "flex",
          padding: "10px",
          alignItems: "center",
          backgroundColor: "#E1F3FB",
        }}
      >
        {channel === "facebook" ? (
          <Facebook />
        ) : (
          <Instagram />
        )}

        <span>
          Você tem 24h para responder após receber uma mensagem, de acordo
          com as políticas do Facebook.
        </span>
      </div>
    )}
    {loading && (
      <div>
        <CircularProgress sx={messageStyles.circleLoading} />
      </div>
    )}
  </Box>
);
};

export default MessagesList;