import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const TONE_STYLES = {
    success: {
        wrapper: 'bg-white dark:bg-slate-900 border-emerald-500/40 text-slate-800 dark:text-slate-100',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        Icon: CheckCircle2,
    },
    error: {
        wrapper: 'bg-white dark:bg-slate-900 border-rose-500/40 text-slate-800 dark:text-slate-100',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        Icon: AlertCircle,
    },
    warning: {
        wrapper: 'bg-white dark:bg-slate-900 border-ustp-gold/60 text-slate-800 dark:text-slate-100',
        badge: 'bg-ustp-gold/15 text-amber-700 dark:text-ustp-gold',
        Icon: AlertTriangle,
    },
    info: {
        wrapper: 'bg-white dark:bg-slate-900 border-ustp-navy/30 dark:border-indigo-500/40 text-slate-800 dark:text-slate-100',
        badge: 'bg-ustp-navy/10 text-ustp-navy dark:bg-indigo-500/15 dark:text-indigo-300',
        Icon: Info,
    },
};

export default function ToastBanner({ toasts = [], onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((item) => {
                const style = TONE_STYLES[item.type] || TONE_STYLES.info;
                const Icon = style.Icon;
                return (
                    <div
                        key={item.id}
                        className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl ${style.wrapper}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            {item.title && (
                                <p className="text-xs font-bold text-ustp-navy dark:text-white">
                                    {item.title}
                                </p>
                            )}
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug break-words">
                                {item.message}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onDismiss(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
