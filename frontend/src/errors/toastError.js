import { toast } from "../components/ui/ToastProvider";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

// Função para mostrar mensagem de sucesso personalizada
export const toastSuccess = (message, options = {}) => {
	toast.success(message, options);
};

// Mapeamento completo de mensagens de erro personalizadas
const getCustomErrorMessage = (errorMsg) => {
	const customErrorMessages = {
		// Erros de Filas
		'ERR_QUEUE_NAME_ALREADY_EXISTS': 'Este nome de fila já existe! Escolha um nome diferente.',
		'ERR_QUEUE_COLOR_ALREADY_EXISTS': 'Esta cor já está sendo usada por outra fila! Escolha uma cor diferente.',
		'ERR_QUEUE_INVALID_NAME': 'Nome da fila inválido! Deve ter pelo menos 2 caracteres.',
		'ERR_QUEUE_INVALID_COLOR': 'Cor inválida! Deve estar no formato hexadecimal (#RRGGBB).',
		'ERR_QUEUE_NOT_FOUND': 'Fila não encontrada! Ela pode ter sido excluída.',
		'ERR_DUPLICATE_QUEUE': 'Esta fila já existe no sistema!',
		'ERR_QUEUE_IN_USE': 'Esta fila não pode ser excluída pois está sendo usada!',
		'ERR_QUEUE_REQUIRED_FIELD': 'Todos os campos obrigatórios devem ser preenchidos!',
		
		// Erros de Usuários
		'ERR_USER_NAME_ALREADY_EXISTS': 'Este nome de usuário já existe! Escolha um nome diferente.',
		'ERR_USER_EMAIL_ALREADY_EXISTS': 'Este e-mail já está cadastrado! Use um e-mail diferente.',
		'ERR_USER_INVALID_EMAIL': 'E-mail inválido! Verifique o formato.',
		'ERR_USER_NOT_FOUND': 'Usuário não encontrado!',
		'ERR_USER_WEAK_PASSWORD': 'Senha muito fraca! Use pelo menos 8 caracteres.',
		
		// Erros de Contatos
		'ERR_CONTACT_NOT_FOUND': 'Contato não encontrado!',
		'ERR_CONTACT_ALREADY_EXISTS': 'Este contato já existe no sistema!',
		'ERR_CONTACT_INVALID_NUMBER': 'Número de telefone inválido!',
		
		// Erros de Tickets
		'ERR_TICKET_NOT_FOUND': 'Ticket não encontrado!',
		'ERR_TICKET_ALREADY_CLOSED': 'Este ticket já foi fechado!',
		'ERR_TICKET_ALREADY_OPEN': 'Este ticket já está aberto!',
		
		// Erros de WhatsApp
		'ERR_WAPP_NOT_INITIALIZED': 'WhatsApp não inicializado! Verifique a conexão.',
		'ERR_SESSION_EXPIRED': 'Sua sessão expirou.',
		'ERR_WAPP_CHECK_CONTACT': 'Erro ao verificar contato no WhatsApp.',
		
		// Erros de Conexão
		'ERR_CONNECTION_CREATION_COUNT': 'Limite de conexões atingido!',
		'ERR_CONNECTION_NOT_FOUND': 'Conexão não encontrada!',
		
		// Erros Gerais
		'ERR_NO_PERMISSION': 'Você não tem permissão para realizar esta ação!',
		'ERR_INVALID_CREDENTIALS': 'Credenciais inválidas!',
		'ERR_DUPLICATED_CONTACT': 'Contato duplicado!',
		'ERR_REQUIRED_FIELD': 'Todos os campos obrigatórios devem ser preenchidos!'
	};
	
	return customErrorMessages[errorMsg] || null;
};

const toastError = err => {
	// Verificar se err é undefined ou null
	if (!err) {
		console.warn('toastError called with undefined/null error');
		toast.error("Erro desconhecido. Tente novamente.");
		return;
	}

	const errorMsg = err.response?.data?.error;
	if (errorMsg) {
		// Log específico para problemas de sessão
		if (errorMsg === 'ERR_SESSION_EXPIRED') {
			console.log('[AUTH ERROR] Sessão expirada detectada:', err);
			toast.error("Sua sessão expirou. Você será redirecionado para o login.");
			setTimeout(() => {
				window.location.href = '/login';
			}, 1000);
			return;
		}

		// Verificar se há uma mensagem personalizada para este erro
		const customErrorMessage = getCustomErrorMessage(errorMsg);
		if (customErrorMessage) {
			toast.error(customErrorMessage);
			return;
		}
		
		if (i18n.exists(`backendErrors.${errorMsg}`)) {
			toast.error(i18n.t(`backendErrors.${errorMsg}`));
			return
		} else {
			toast.error(errorMsg);
			return
		}
	} 
	
	// Verificar se err é string
	if (isString(err)) {
		toast.error(err);
		return
	} 
	
	// Verificar se tem mensagem de erro genérica
	if (err && err.message) {
		toast.error(err.message);
		return
	}
	
	// Fallback padrão
	toast.error("Ops! algo deu errado. Revise sua ação ou chame nosso suporte!");
};

export default toastError;
