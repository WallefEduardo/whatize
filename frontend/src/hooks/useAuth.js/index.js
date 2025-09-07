import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "../../components/ui/ToastProvider";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
// AUTHMANAGER REMOVIDO - usando apenas interceptors globais
// import authManager from "../../services/authManager";
// import { useDate } from "../../hooks/useDate";
import moment from "moment";

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [socket, setSocket] = useState(null)
 

  // INTERCEPTORS CORRIGIDOS PARA FUNCIONAR COM VITE
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Token está em JSON.stringify, fazer parse
          const tokenValue = JSON.parse(token);
          config.headers["Authorization"] = `Bearer ${tokenValue}`;
          setIsAuth(true);
          
        } catch (error) {
          console.error('❌ [AUTH] Erro ao processar token:', error);
          localStorage.removeItem("token");
          setIsAuth(false);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // 403 - Token expirado, tentar refresh
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        console.log('🔄 [AUTH] Token expirado, tentando refresh...');

        try {
          // Enviar refresh token do localStorage no body
          const refreshToken = localStorage.getItem("refresh_token");
          
          if (!refreshToken) {
            console.error('❌ [AUTH] Sem refresh token disponível');
            throw new Error('No refresh token');
          }
          
          const { data } = await api.post("/auth/refresh_token", {
            refreshToken: refreshToken
          });
          
          if (data && data.token) {
            // Salvar novos tokens
            localStorage.setItem("token", JSON.stringify(data.token));
            if (data.refreshToken) {
              localStorage.setItem("refresh_token", data.refreshToken);
            }
            
            // Atualizar header e retry
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            
            console.log('✅ [AUTH] Token renovado com sucesso');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ [AUTH] Falha ao renovar token:', refreshError);
          // Limpar tudo e redirecionar para login
          localStorage.clear();
          setIsAuth(false);
          setUser({});
          history.push("/login");
        }
      }
      
      // 401 - Não autorizado, fazer logout
      if (error?.response?.status === 401) {
        console.log('🚪 [AUTH] 401 - Sessão expirada, redirecionando para login...');
        localStorage.clear();
        api.defaults.headers.Authorization = undefined;
        setIsAuth(false);
        setUser({});
        history.push("/login");
      }
      
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    // Verificar se já há token e definir estado inicial
    const token = localStorage.getItem('token');
    
    (async () => {
      if (token) {
        try {
          // Interceptor global vai adicionar token automaticamente
          const { data } = await api.get("/auth/me");
          
          if (data && data.id) {
            setIsAuth(true);
            setUser(data);
          }
        } catch (err) {
          setIsAuth(false);
          setUser({});
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (Object.keys(user).length && user.id > 0) {
      // console.log("Entrou useWhatsapp com user", Object.keys(user).length, Object.keys(socket).length ,user, socket)
      let io;
      if (!socket) {
        io = socketConnection({ user });
        setSocket(io)
      } else {
        io = socket
      }
      io.on(`company-${user.companyId}-user`, (data) => {
        if (data.action === "update" && data.user.id === user.id) {
          setUser(data.user);
        }
      });

      return () => {
        // console.log("desconectou o company user ", user.id)
        io.off(`company-${user.companyId}-user`);
        // io.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [user]);

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      const {
        user: { company },
      } = data;

      if (has(company, "companieSettings") && isArray(company.companieSettings[0])) {
        const setting = company.companieSettings[0].find(
          (s) => s.key === "campaignsEnabled"
        );
        if (setting && setting.value === "true") {
          localStorage.setItem("cshow", null); //regra pra exibir campanhas
        }
      }

      if (has(company, "companieSettings") && isArray(company.companieSettings[0])) {
        const setting = company.companieSettings[0].find(
          (s) => s.key === "sendSignMessage"
        );

        const signEnable = setting.value === "enable";

        if (setting && setting.value === "enabled") {
          localStorage.setItem("sendSignMessage", signEnable); //regra pra exibir campanhas
        }
      }
      localStorage.setItem("profileImage", data.user.profileImage); //regra pra exibir imagem contato

      moment.locale('pt-br');
      let dueDate;
      if (data.user.company.id === 1) {
        dueDate = '2999-12-31T00:00:00.000Z'
      } else {
        dueDate = data.user.company.dueDate;
      }
      const hoje = moment(moment()).format("DD/MM/yyyy");
      const vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(dueDate).diff(moment(moment()).format());

      var before = moment(moment().format()).isBefore(dueDate);
      var dias = moment.duration(diff).asDays();

      if (before === true) {
        console.log('[LOGIN] Salvando tokens após login bem-sucedido');
        console.log('[LOGIN] Access Token recebido:', data.token?.substring(0, 20) + '...');
        console.log('[LOGIN] Refresh Token recebido:', data.refreshToken ? 'SIM' : 'NÃO');
        
        // Salvar tokens diretamente no localStorage (formato JSON como versão antiga)
        localStorage.setItem("token", JSON.stringify(data.token));
        
        // Salvar refresh token se vier na resposta
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
          console.log('[LOGIN] Refresh token salvo no localStorage');
        } else {
          console.warn('[LOGIN] Nenhum refresh token recebido do backend!');
        }
        
        // Verificar se salvou
        console.log('[LOGIN] Tokens no localStorage após salvar:', {
          accessToken: localStorage.getItem('token') ? 'PRESENTE' : 'AUSENTE',
          refreshToken: localStorage.getItem('refresh_token') ? 'PRESENTE' : 'AUSENTE'
        });
        
        localStorage.setItem("companyDueDate", vencimento);
        localStorage.removeItem("assinaturaVencida");
        
        setUser(data.user);
        setIsAuth(true);
        toast.success(i18n.t("auth.toasts.success"));
        
        if (Math.round(dias) < 5) {
          toast.warn(`Sua assinatura vence em ${Math.round(dias)} ${Math.round(dias) === 1 ? 'dia' : 'dias'} `);
        }

        // // Atraso para garantir que o cache foi limpo
        // setTimeout(() => {
        //   window.location.reload(true); // Recarregar a página
        // }, 1000);

        history.push("/tickets");
        setLoading(false);
      } else {
        // Salvar token mesmo com assinatura vencida  
        localStorage.setItem("token", JSON.stringify(data.token));
        setIsAuth(true);
        localStorage.setItem("assinaturaVencida", "true");
        toastError(`Opss! Sua assinatura venceu ${vencimento}.
Entre em contato com o Suporte para mais informações! `);
        history.push("/financeiro-aberto");
        setLoading(false);
      }

    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      // socket.disconnect();
      await api.delete("/auth/logout");
      
      // Remover tokens do localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("cshow");
      localStorage.removeItem("assinaturaVencida");
      
      setIsAuth(false);
      setUser({});
      setLoading(false);
      history.push("/login");
    } catch (err) {
      // Mesmo com erro, fazer logout local
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("cshow");
      localStorage.removeItem("assinaturaVencida");
      
      setIsAuth(false);
      setUser({});
      setLoading(false);
      
      toastError(err);
      history.push("/login");
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (error) {
      return null;
    }
  };

    // NOVA FUNÇÃO PARA ATUALIZAR O USUÁRIO LOGADO
    const updateUser = (newUserData) => {
      setUser((prevUser) => ({
        ...prevUser,
        ...newUserData,
      }));
    };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
    socket,
    updateUser
  };
};

export default useAuth;
