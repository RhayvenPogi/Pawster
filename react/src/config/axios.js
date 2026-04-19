// ── axios.js (config/axios.js) ────────────────────────────────────────────────
import axios from 'axios';

const api = axios.create({
    baseURL:         import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
});

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use(config => {
    const token = localStorage.getItem('pawster_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

// ── Log errors in dev (except expected 401 on /me) ────────────────────────────
api.interceptors.response.use(
    response => response,
    error => {
        const is401onMe =
            error.response?.status === 401 &&
            error.config?.url?.includes('/api/auth/me');

        if (import.meta.env.DEV && !is401onMe) {
            console.error(
                '[API Error]',
                error.config?.url,
                error.response?.status ?? 'NO_RESPONSE',
                error.message,
            );
        }

        return Promise.reject(error);
    },
);

export default api;