// useAuth.js — full file

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

export const useAuth = () => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('pawster_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // ── Session check on mount ────────────────────────────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            const token      = localStorage.getItem('pawster_token');
            const storedUser = localStorage.getItem('pawster_user');

            if (!token && !storedUser) {
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/api/auth/me');
                const merged = { ...(user ?? {}), ...data };
                setUser(merged);
                localStorage.setItem('pawster_user', JSON.stringify(merged));
            } catch {
                setUser(null);
                localStorage.removeItem('pawster_user');
                localStorage.removeItem('pawster_token');
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const fd = new FormData();
        fd.append('email', email);
        fd.append('password', password);

        const { data } = await api.post('/api/auth/login', fd);

        if (data.token) localStorage.setItem('pawster_token', data.token);
        setUser(data);
        localStorage.setItem('pawster_user', JSON.stringify(data));

        if (data.role === 'admin') navigate('/admin');
        // else LoginPage handles via LoadingScreen

        return data;
    }, [navigate]);

    // ── Register ──────────────────────────────────────────────────────────────
    const register = useCallback(async (formData) => {
        const { data } = await api.post('/api/auth/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return data;
    }, []);

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
            localStorage.removeItem('pawster_user');
            localStorage.removeItem('pawster_token');
            navigate('/login');
        }
    }, [navigate]);

    // ── Google Login ──────────────────────────────────────────────────────────
    const googleLogin = useCallback(async (credentialResponse) => {
        const { data } = await api.post('/api/auth/google', {
            token: credentialResponse.credential,
        });

        if (data.token) localStorage.setItem('pawster_token', data.token);
        setUser(data);
        localStorage.setItem('pawster_user', JSON.stringify(data));

        if (data.role === 'admin') {
            navigate('/admin');
        } else if (data.profileComplete === false) {
            navigate('/complete-profile');   // ← gate incomplete Google users
        }
        // else LoginPage handles via LoadingScreen

        return data;
    }, [navigate]);

    return {
        user,
        setUser,
        isAuthenticated:   !!user,
        isAdmin:           user?.role === 'admin',
        isProfileComplete: user?.profileComplete !== false,   // ← new
        isLoading,
        login,
        register,
        logout,
        googleLogin,
    };
};