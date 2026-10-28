import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('equiply_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem('equiply_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const currentToken = localStorage.getItem('equiply_token');
            if (currentToken) {
                try {
                    const data = await authApi.me();
                    setUser(data.user);
                    localStorage.setItem('equiply_user', JSON.stringify(data.user));
                } catch {
                    localStorage.removeItem('equiply_token');
                    localStorage.removeItem('equiply_user');
                    setUser(null);
                    setToken(null);
                }
            } else {
                // Production: Unauthenticated visitors remain guests
                setUser(null);
                setToken(null);
            }
            setIsLoading(false);
        };

        verifyAuth();

        const handleUnauthorized = () => {
            setUser(null);
            setToken(null);
        };
        window.addEventListener('equiply:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('equiply:unauthorized', handleUnauthorized);
    }, []);

    const login = async (loginVal, passwordVal) => {
        setIsLoading(true);
        try {
            const res = await authApi.login(loginVal, passwordVal);
            localStorage.setItem('equiply_token', res.token);
            localStorage.setItem('equiply_user', JSON.stringify(res.user));
            setUser(res.user);
            setToken(res.token);
            return res.user;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (payload) => {
        setIsLoading(true);
        try {
            const res = await authApi.register(payload);
            localStorage.setItem('equiply_token', res.token);
            localStorage.setItem('equiply_user', JSON.stringify(res.user));
            setUser(res.user);
            setToken(res.token);
            return res.user;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authApi.logout();
        } finally {
            setUser(null);
            setToken(null);
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                register,
                logout,
                isCustodian: user?.role === 'custodian' || user?.role === 'admin',
                isAdmin: user?.role === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
