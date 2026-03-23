import axios from 'axios';

// IMPORTANT — Vite bakes VITE_* variables at BUILD time, not runtime.
// When Docker passes VITE_API_BASE_URL as an environment variable to the
// running container, Vite has already finished building and the value is
// ignored. The fallback 'http://localhost:8080' is what actually gets used.
//
// Since the browser runs on your HOST machine and port 8080 is mapped
// from the sb container → host, 'http://localhost:8080' is correct.
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
        if (import.meta.env.DEV) {
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