import { toast } from "../components/ui/ToastProvider";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const toastError = err => {
	// Verificar se err é undefined ou null
	if (!err) {
		console.warn('toastError called with undefined/null error');
		toast.error("Erro desconhecido. Tente novamente.", {
			duration: 2000
		});
		return;
	}

	const errorMsg = err.response?.data?.error;
	if (errorMsg) {
		// Log específico para problemas de sessão
		if (errorMsg === 'ERR_SESSION_EXPIRED') {
			console.log('[AUTH ERROR] Sessão expirada detectada:', err);
			// Para ERR_SESSION_EXPIRED, usar mensagem mais amigável
			toast.error("Sua sessão expirou. Você será redirecionado para o login.", {
				id: errorMsg,
				duration: 3000
			});
			// Forçar redirecionamento após um breve delay
			setTimeout(() => {
				window.location.href = '/login';
			}, 1000);
			return;
		}
		
		if (i18n.exists(`backendErrors.${errorMsg}`)) {
			toast.error(i18n.t(`backendErrors.${errorMsg}`), {
				id: errorMsg,
				duration: 2000
			});
			return
		} else {
			toast.error(errorMsg, {
				id: errorMsg,
				duration: 2000
			});
			return
		}
	} 
	
	// Verificar se err é string
	if (isString(err)) {
		toast.error(err, {
			duration: 2000
		});
		return
	} 
	
	// Verificar se tem mensagem de erro genérica
	if (err.message) {
		toast.error(err.message, {
			duration: 2000
		});
		return
	}
	
	// Fallback padrão
	toast.error("Ops! algo deu errado. Revise sua ação ou chame nosso suporte!", {
		duration: 2000
	});
};

export default toastError;
