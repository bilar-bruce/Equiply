import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import ToastBanner from '../components/ToastBanner';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState({ open: false });
    const resolverRef = useRef(null);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const confirm = useCallback((options) => {
        const normalized = typeof options === 'string' ? { message: options } : options;
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setConfirmState({
                open: true,
                title: normalized.title || 'Confirm Action',
                message: normalized.message || '',
                confirmLabel: normalized.confirmLabel || 'Confirm',
                cancelLabel: normalized.cancelLabel || 'Cancel',
                tone: normalized.tone || 'primary',
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setConfirmState({ open: false });
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = null;
        }
    }, []);

    const handleCancel = useCallback(() => {
        setConfirmState({ open: false });
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
    }, []);

    return (
        <FeedbackContext.Provider value={{ showToast, confirm }}>
            {children}
            <ToastBanner toasts={toasts} onDismiss={dismissToast} />
            <ConfirmModal
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                cancelLabel={confirmState.cancelLabel}
                tone={confirmState.tone}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const ctx = useContext(FeedbackContext);
    if (!ctx) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return ctx;
}
