import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff, LogOut } from 'lucide-react';

export default function ForcePasswordChangeModal({ isOpen = true, onSuccess }) {
    const { user, updateUser, logout } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('New password must be at least 8 characters in length.');
            return;
        }

        if (password !== passwordConfirmation) {
            setError('New password and confirmation do not match.');
            return;
        }

        if (password === currentPassword) {
            setError('Please choose a new password different from your temporary desk password.');
            return;
        }

        setLoading(true);
        try {
            const res = await authApi.changePassword({
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            });
            updateUser(res.user);
            if (onSuccess) {
                onSuccess(res.message || 'Password updated and account verified successfully.');
            }
        } catch (err) {
            const msg =
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                err.response?.data?.message ||
                'Failed to update password. Please verify your temporary password.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                {/* USTP Branded Header Banner */}
                <div className="bg-ustp-navy dark:bg-[#1B1642] px-6 py-5 border-b border-ustp-gold/30 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-ustp-gold/40 text-ustp-gold flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-white font-['Outfit']">
                            Update Temporary Password
                        </h3>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Welcome, <span className="font-bold text-ustp-navy dark:text-ustp-gold">{user?.name || 'Student'}</span> ({user?.id_number}). Because your account was provisioned at the Campus Facility Desk with a temporary password, you must set a personal password before reserving equipment.
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Temporary Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    required
                                    placeholder="e.g. USTP@2024300616"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs font-mono flat-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                New Personal Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                required
                                minLength={8}
                                placeholder="Minimum 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono flat-input"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Confirm New Password <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                required
                                minLength={8}
                                placeholder="Re-enter new password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono flat-input"
                            />
                        </div>

                        <div className="pt-2 space-y-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 px-4 rounded-xl bg-ustp-navy hover:bg-ustp-navy-hover text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4 text-ustp-gold" />
                                <span>{loading ? 'Updating & Verifying...' : 'Save Password & Verify Account'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                disabled={loading}
                                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
