import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegister) {
                await register({
                    id_number: idNumber,
                    name,
                    email: loginInput,
                    password,
                    password_confirmation: password,
                    contact_number: contactNumber,
                });
            } else {
                await login(loginInput, password);
            }
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                'Authentication failed. Please verify your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                        {isRegister ? 'Register Student Account' : 'Sign in to Equiply'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {isRegister && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Campus ID Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 2024-50112"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="+63 9XX XXX XXXX"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {isRegister ? 'Email Address' : 'Email Address or Campus ID Number'}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="alex.rivera@campus.edu or 2023-10042"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                        {isRegister ? <UserPlus className="w-4 h-4 text-ustp-gold" /> : <LogIn className="w-4 h-4 text-ustp-gold" />}
                        {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError(null);
                        }}
                        className="text-xs text-ustp-navy dark:text-ustp-gold hover:underline font-medium"
                    >
                        {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register as student"}
                    </button>
                </div>
            </div>
        </div>
    );
}
