import React from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export default function ConfirmModal({
    open,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'primary',
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    const isDanger = tone === 'danger';
    const isWarning = tone === 'warning';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="px-5 py-4 bg-ustp-navy text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-ustp-gold/20 text-ustp-gold flex items-center justify-center">
                            {isDanger || isWarning ? (
                                <AlertTriangle className="w-4 h-4" />
                            ) : (
                                <HelpCircle className="w-4 h-4" />
                            )}
                        </div>
                        <h3 id="confirm-modal-title" className="text-sm font-bold font-['Outfit']">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close confirmation"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                            isDanger
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : isWarning
                                ? 'bg-ustp-gold hover:bg-amber-500 text-ustp-navy'
                                : 'bg-ustp-navy hover:bg-ustp-navy/90 text-white dark:bg-ustp-gold dark:hover:bg-amber-400 dark:text-ustp-navy'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
