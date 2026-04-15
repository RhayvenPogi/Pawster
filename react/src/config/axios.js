import axios from 'axios';
console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
});

// Attach JWT as Bearer token on every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('pawster_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
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