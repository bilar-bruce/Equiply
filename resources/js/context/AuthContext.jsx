import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_PERSONAS = [
    {
        key: 'student',
        role: 'student',
        title: 'Alex Rivera',
        badge: 'Borrower Student',
        login: 'alex.rivera@campus.edu',
        password: 'password123',
        id_number: '2023-10042',
    },
    {
        key: 'peer_lender',
        role: 'student',
        title: 'Jordan Lee',
        badge: 'Peer Lender (P2P)',
        login: 'jordan.lee@campus.edu',
        password: 'password123',
        id_number: '2022-20088',
    },
    {
        key: 'custodian',
        role: 'custodian',
        title: 'Maria Santos',
        badge: 'Facility Custodian',
        login: 'custodian@campus.edu',
        password: 'custodian123',
        id_number: 'EMP-2019-041',
    },
    {
        key: 'admin',
        role: 'admin',
        title: 'System Admin',
        badge: 'Administrator',
        login: 'admin@campus.edu',
        password: 'admin123',
        id_number: 'ADM-2015-001',
    },
];

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
                // Auto-login Alex Rivera (Student) by default so app is immediately interactive!
                try {
                    const res = await authApi.login('alex.rivera@campus.edu', 'password123');
                    localStorage.setItem('equiply_token', res.token);
                    localStorage.setItem('equiply_user', JSON.stringify(res.user));
                    setUser(res.user);
                    setToken(res.token);
                } catch (e) {
                    console.warn('Auto-login fallback:', e);
                }
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

    const switchPersona = async (personaKey) => {
        const persona = DEMO_PERSONAS.find((p) => p.key === personaKey);
        if (!persona) return;
        return await login(persona.login, persona.password);
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
                switchPersona,
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
