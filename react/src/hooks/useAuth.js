import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

export const useAuth = () => {
    const [user, setUser]           = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate                  = useNavigate();

    // On mount: check if JWT cookie is still valid by calling /api/auth/me
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await api.get('/api/auth/me');
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    // Login with email + password as multipart/form-data (matches Spring Boot @RequestParam)
    const login = useCallback(async (email, password) => {
        const fd = new FormData();
        fd.append('email',    email);
        fd.append('password', password);

        const { data } = await api.post('/api/auth/login', fd);
        setUser(data);

        // Redirect based on role returned from the server
        if (data.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/home');
        }

        return data;
    }, [navigate]);

    // Register with multipart/form-data (includes idFile)
    const register = useCallback(async (formData) => {
        const { data } = await api.post('/api/auth/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUser(data);
        navigate('/home');
        return data;
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
            navigate('/login');
        }
    }, [navigate]);

    return {
        user,
        isAuthenticated: !!user,
        isAdmin:         user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
    };
};