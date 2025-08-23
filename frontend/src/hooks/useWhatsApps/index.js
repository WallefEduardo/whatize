import { useState, useEffect, useReducer, useContext } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { isNill } from "lodash";

const reducer = (state, action) => {
  if (action.type === "LOAD_WHATSAPPS") {
    const whatsApps = action.payload;

    return [...whatsApps];
  }

  if (action.type === "UPDATE_WHATSAPPS") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = whatsApp;
      return [...state];
    } else {
      return [whatsApp, ...state];
    }
  }

  if (action.type === "UPDATE_SESSION") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      const oldStatus = state[whatsAppIndex].status;
      console.log(`🔄 [REDUCER-DEBUG] Status mudando de "${oldStatus}" → "${whatsApp.status}" para ${whatsApp.name || whatsApp.id}`);
      
      state[whatsAppIndex].status = whatsApp.status;
      state[whatsAppIndex].updatedAt = whatsApp.updatedAt;
      state[whatsAppIndex].qrcode = whatsApp.qrcode;
      state[whatsAppIndex].retries = whatsApp.retries;
      return [...state];
    } else {
      console.log(`⚠️ [REDUCER-DEBUG] WhatsApp ${whatsApp.id} não encontrado no state para atualização`);
      return [...state];
    }
  }

  if (action.type === "DELETE_WHATSAPPS") {
    const whatsAppId = action.payload;

    const whatsAppIndex = state.findIndex((s) => s.id === whatsAppId);
    if (whatsAppIndex !== -1) {
      state.splice(whatsAppIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useWhatsApps = () => {
  const [whatsApps, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(true);
//   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);



  useEffect(() => {
    setLoading(true);
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/whatsapp/?session=0");
        dispatch({ type: "LOAD_WHATSAPPS", payload: data });
        setLoading(false);
      } catch (_) {
        setLoading(false);
        // toastError(err);
      }
    };
    fetchSession();
    
    // 🛡️ FALLBACK: Listener para force refresh
    const handleForceRefresh = (event) => {
      console.log(`🔄 [FALLBACK-LISTENER] Forçando refresh dos WhatsApps...`);
      dispatch({ type: "LOAD_WHATSAPPS", payload: event.detail });
    };
    
    window.addEventListener('forceWhatsAppRefresh', handleForceRefresh);
    
    return () => {
      window.removeEventListener('forceWhatsAppRefresh', handleForceRefresh);
    };
  }, []);

  useEffect(() => {
    if (user.companyId) {

      const companyId = user.companyId;
//    const socket = socketManager.GetSocket();

      const onCompanyWhatsapp = (data) => {
        if (data.action === "update") {
          dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
        }
        if (data.action === "delete") {
          dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
        }
      }

      const onCompanyWhatsappSession = (data) => {
        // 🔍 DEBUG: Log todos os eventos recebidos
        console.log(`📡 [SOCKET-DEBUG] Evento whatsappSession recebido:`, {
          action: data.action,
          sessionId: data.session?.id,
          sessionName: data.session?.name,
          newStatus: data.session?.status,
          timestamp: new Date().toISOString()
        });
        
        if (data.action === "update") {
          console.log(`🔄 [SOCKET-DEBUG] Atualizando status de ${data.session?.name || data.session?.id}: ${data.session?.status}`);
          dispatch({ type: "UPDATE_SESSION", payload: data.session });
        }
        
        // ✅ TRATAMENTO DE ERRO DE VALIDAÇÃO
        if (data.action === "validation_error") {
          // Atualizar status da sessão como desconectada
          dispatch({ type: "UPDATE_SESSION", payload: { 
            ...data.session, 
            status: "DISCONNECTED" 
          }});
          
          // Mostrar toast de erro
          const { toast } = require("react-toastify");
          toast.error(`❌ ERRO DE CONEXÃO:\n\n${data.error}`, {
            position: "top-center",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        }
      }

      socket.on(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
      socket.on(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);

      return () => {
        socket.off(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
        socket.off(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);
      };
    }
  }, [socket]);

  return { whatsApps, loading };
};

export default useWhatsApps;
