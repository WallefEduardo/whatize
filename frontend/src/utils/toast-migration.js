import { toast as newToast } from '../components/ui/ToastProvider';

// Alias para manter compatibilidade com código existente
export const toastError = (error) => {
  const message = error?.response?.data?.message || error?.message || 'Erro interno do servidor';
  return newToast.error(message);
};

export const toastSuccess = (message) => {
  return newToast.success(message);
};

export const toastInfo = (message) => {
  return newToast.info(message);
};

export const toastWarning = (message) => {
  return newToast.warning(message);
};

// Preservar funcionalidade de erro padrão
export default toastError;