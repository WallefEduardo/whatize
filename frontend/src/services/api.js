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


export const openApi = axios.create({
	baseURL: getBaseURL(),
	timeout: 30000,
});

/**
 * Corrige texto usando OpenAI API
 * @param {string} text - Texto a ser corrigido
 * @returns {Promise<{originalText: string, correctedText: string}>}
 */
export const correctText = async (text) => {
	const { data } = await api.post('/api/messages/correct-text', { text });
	return data;
};

export default api;
