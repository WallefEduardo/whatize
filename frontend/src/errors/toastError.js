import { toast } from "../components/ui/ToastProvider";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

const toastError = err => {
	const errorMsg = err.response?.data?.error;
	if (errorMsg) {
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
	} if (isString(err)) {
		toast.error(err);
		return
	} else {
		toast.error("Ops! algo deu errado. Revise sua ação ou chame nosso suporte!");
		return
	}
};

export default toastError;
