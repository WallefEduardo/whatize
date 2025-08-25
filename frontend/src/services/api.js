import axios from "axios";

// Sempre usar URL completa do backend - não depender de proxy
const getBaseURL = () => {
  // Usar URL do backend definida no .env ou fallback para localhost:4000
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
};

const api = axios.create({
	baseURL: getBaseURL(),
	withCredentials: true, // Essencial para cookies/CORS
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json',
	}
});

// Log em desenvolvimento para debug
if (import.meta.env.DEV) {
	api.interceptors.request.use(
		(config) => {
			console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
				hasAuth: !!config.headers.Authorization,
				withCredentials: config.withCredentials
			});
			return config;
		}
	);
}

export const openApi = axios.create({
	baseURL: getBaseURL(),
	timeout: 30000,
});

export default api;
