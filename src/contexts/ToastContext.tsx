// src/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer } from '../components/ui/ToastContainer';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const recentMessages = useRef<Map<string, number>>(new Map());
    const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const now = Date.now();

        // Create a key for deduplication (message + type combination)
        const dedupeKey = `${message}-${type}`;

        // Check if we've shown this exact message recently (within 500ms)
        const lastShown = recentMessages.current.get(dedupeKey);
        if (lastShown && (now - lastShown) < 500) {
            console.log('Duplicate toast prevented:', message);
            return; // Skip duplicate toast
        }

        // Update the last shown time for this message
        recentMessages.current.set(dedupeKey, now);

        // Clean up old entries after 1 second
        setTimeout(() => {
            recentMessages.current.delete(dedupeKey);
        }, 1000);

        // Create unique ID with timestamp + random number to ensure uniqueness
        const id = `${now}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        // Clear any existing timeout for this toast
        if (toastTimeouts.current.has(id)) {
            clearTimeout(toastTimeouts.current.get(id)!);
        }

        // Auto remove after duration
        const timeout = setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
            toastTimeouts.current.delete(id);
        }, duration);

        toastTimeouts.current.set(id, timeout);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));

        // Clear the timeout if it exists
        const timeout = toastTimeouts.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            toastTimeouts.current.delete(id);
        }
    }, []);

    // Cleanup timeouts on unmount
    React.useEffect(() => {
        // Capture the current Map in a variable
        const timeouts = toastTimeouts.current;

        return () => {
            // Use the captured variable in cleanup
            timeouts.forEach(timeout => clearTimeout(timeout));
            timeouts.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};