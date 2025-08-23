function getConfig(name, defaultValue = null) {
    // If inside a docker container, use window.ENV
    if (window.ENV !== undefined) {
        return window.ENV[name] || defaultValue;
    }

    // Convert REACT_APP_ to VITE_ for Vite compatibility
    const viteName = name.replace('REACT_APP_', 'VITE_');
    return import.meta.env[viteName] || import.meta.env[name] || defaultValue;
}

export function getBackendUrl() {
    return getConfig('REACT_APP_BACKEND_URL');
}

export function getHoursCloseTicketsAuto() {
    return getConfig('REACT_APP_HOURS_CLOSE_TICKETS_AUTO');
}

export function getFrontendPort() {
    // Em desenvolvimento, detectar porta atual do browser
    if (typeof window !== 'undefined' && window.location) {
        return window.location.port || '3000';
    }
    // Fallback para variáveis de ambiente
    return getConfig('VITE_FRONTEND_PORT') || getConfig('SERVER_PORT') || '3000';
}

export function getFrontendUrl() {
    // Em desenvolvimento, usar URL atual do browser
    if (typeof window !== 'undefined' && window.location) {
        return `${window.location.protocol}//${window.location.host}`;
    }
    // Fallback para variável de ambiente
    return getConfig('VITE_FRONTEND_URL') || 'http://localhost:3000';
}

export function getPrimaryColor() {
    return getConfig("REACT_APP_PRIMARY_COLOR");
}

export function getPrimaryDark() {
    return getConfig("REACT_APP_PRIMARY_DARK");
}

export function getNumberSupport() {
    return getConfig("REACT_APP_NUMBER_SUPPORT");
}