import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    },
});

api.interceptors.response.use(
    response => response,
    error => {
        const is401onMe = error.response?.status === 401 
            && error.config?.url?.includes('/api/auth/me');

        if (import.meta.env.DEV && !is401onMe) {
            console.error(
                '[API Error]',
                error.config?.url,
                error.response?.status ?? 'NO_RESPONSE',
                error.message
            );
        }
        return Promise.reject(error);
    }
);

export default api;