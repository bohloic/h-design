import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        if (type !== 'loading') {
            setTimeout(() => hideToast(id), 5000);
        }
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border animate-in slide-in-from-bottom-5 duration-300 ${
                            toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                            toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                            toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                            toast.type === 'loading' ? 'bg-slate-900 border-slate-800 text-white' :
                            'bg-blue-50 border-blue-100 text-blue-800'
                        }`}
                    >
                        <div className="shrink-0">
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                            {toast.type === 'loading' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                        </div>
                        <p className="text-sm font-bold flex-1">{toast.message}</p>
                        <button 
                            onClick={() => hideToast(toast.id)}
                            title="Fermer"
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X size={16} className="opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
