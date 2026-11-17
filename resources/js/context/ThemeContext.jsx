import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'equiply_theme';

export function ThemeProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [theme, setThemeState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
            // Default to Light Mode as per USTP Design System requirements
            return 'light';
        } catch {
            return 'light';
        }
    });

    // Apply dark mode only for authenticated sessions; keep saved preference intact
    const activeTheme = isAuthenticated ? theme : 'light';

    useEffect(() => {
        const root = document.documentElement;
        if (activeTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Reflect active color scheme in meta tag per Modern Web Guidance
        let meta = document.querySelector('meta[name="color-scheme"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'color-scheme';
            document.head.appendChild(meta);
        }
        meta.content = activeTheme;
    }, [activeTheme]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Unable to persist theme to localStorage', e);
        }
    }, [theme, isAuthenticated]);

    // Cross-tab synchronization
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
                setThemeState(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setTheme = (newTheme) => {
        if (newTheme === 'dark' || newTheme === 'light') {
            setThemeState(newTheme);
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                theme: activeTheme,
                isDark: activeTheme === 'dark',
                toggleTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
