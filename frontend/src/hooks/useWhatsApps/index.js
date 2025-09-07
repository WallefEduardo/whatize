import { useState, useEffect, useReducer, useContext } from "react";
import toastError from "../../errors/toastError";
import { toast } from "../../components/ui/ToastProvider";

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
    console.log('🔄 UPDATE_WHATSAPPS reducer called with:', whatsApp);
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);
    console.log('📍 Found WhatsApp at index:', whatsAppIndex);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = whatsApp;
      console.log('✅ Updated existing WhatsApp');
      return [...state];
    } else {
      console.log('➕ Adding new WhatsApp');
      return [whatsApp, ...state];
    }
  }

  if (action.type === "UPDATE_SESSION") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex].status = whatsApp.status;
      state[whatsAppIndex].updatedAt = whatsApp.updatedAt;
      state[whatsAppIndex].qrcode = whatsApp.qrcode;
      state[whatsAppIndex].retries = whatsApp.retries;
      return [...state];
    } else {
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

  const reload = async () => {
    console.log('🔄 Reloading WhatsApp data...');
    setLoading(true);
    await fetchSession();
  };

  useEffect(() => {
    setLoading(true);
    fetchSession();
  }, []);

  useEffect(() => {
    if (user.companyId) {

      const companyId = user.companyId;
//    const socket = socketManager.GetSocket();

      const onCompanyWhatsapp = (data) => {
        console.log('🔥 Socket WhatsApp event received:', data);
        if (data.action === "update") {
          console.log('📝 Updating WhatsApp:', data.session || data.whatsapp);
          dispatch({ type: "UPDATE_WHATSAPPS", payload: data.session || data.whatsapp });
        }
        if (data.action === "delete") {
          console.log('🗑️ Deleting WhatsApp:', data.whatsappId);
          dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
        }
      }

      const onCompanyWhatsappSession = (data) => {
        console.log('🎯 whatsappSession socket received:', data);
        
        if (data.action === "update") {
          console.log('📱 Updating WhatsApp session:', {
            id: data.session?.id,
            status: data.session?.status,
            name: data.session?.name,
            hasQrcode: !!data.session?.qrcode
          });
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
          // Toast já importado no topo
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

      if (socket && socket.on && typeof socket.on === 'function') {
        socket.on(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
      } else {
        console.error('❌ Socket not available for company-whatsapp:', socket);
      }
      
      if (socket && socket.on && typeof socket.on === 'function') {
        socket.on(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);
      } else {
        console.error('❌ Socket not available for company-whatsappSession:', socket);
      }

      return () => {
        if (socket && socket.off && typeof socket.off === 'function') {
          socket.off(`company-${companyId}-whatsapp`, onCompanyWhatsapp);
          socket.off(`company-${companyId}-whatsappSession`, onCompanyWhatsappSession);
        }
      };
    }
  }, [socket]);

  return { whatsApps, loading, reload };
};

export default useWhatsApps;
