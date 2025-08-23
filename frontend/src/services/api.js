import axios from "axios";

// Para desenvolvimento, usar caminho relativo para aproveitar o proxy do Vite
// Para produção, usar URL completa do backend
const getBaseURL = () => {
  // Se estamos em desenvolvimento e há proxy configurado, usar caminho relativo
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  // Em produção, usar URL completa do backend
  return process.env.REACT_APP_BACKEND_URL;
};

const api = axios.create({
	baseURL: getBaseURL(),
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: getBaseURL(),
	
});

export default api;
