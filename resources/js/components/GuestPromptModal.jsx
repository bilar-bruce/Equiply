import React from 'react';
import { LogIn, X, ShieldAlert, ArrowRight } from 'lucide-react';

export default function GuestPromptModal({ isOpen, onClose, onNavigateToLogin, itemName }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-ustp-gold border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                    Campus Account Required
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Reserving <span className="font-semibold text-ustp-navy dark:text-ustp-gold">{itemName ? `"${itemName}"` : 'equipment'}</span> requires an active USTP campus account verified by the Facility Desk.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-left">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Facility Policy:</p>
                    <p>Accounts are issued in person upon presenting a physical USTP ID. If you already have your credentials, sign in to proceed.</p>
                </div>

                <div className="mt-5 space-y-2">
                    <button
                        onClick={() => {
                            onClose();
                            onNavigateToLogin();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ustp-navy hover:bg-ustp-navy-hover text-white text-xs font-bold shadow-xs transition-colors"
                    >
                        <LogIn className="w-4 h-4 text-ustp-gold" />
                        <span>Sign In with USTP ID</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        Continue Browsing as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}

