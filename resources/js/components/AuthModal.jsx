import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { X, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const { login, register, switchPersona } = useAuth();
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

    const handleQuickPersona = async (key) => {
        setLoading(true);
        setError(null);
        try {
            await switchPersona(key);
            onClose();
        } catch (err) {
            setError('Persona login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white font-['Outfit']">
                        {isRegister ? 'Register Student Account' : 'Sign in to Equiply'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Quick Persona Buttons */}
                <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Instant Demo Sign-in:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                        {DEMO_PERSONAS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => handleQuickPersona(p.key)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium text-left border border-white/5 transition-all truncate"
                            >
                                <span className="block font-bold text-white truncate">{p.title}</span>
                                <span className="text-[10px] text-slate-400 block capitalize">{p.role}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {isRegister && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Campus ID Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 2024-50112"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="+63 9XX XXX XXXX"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            {isRegister ? 'Email Address' : 'Email Address or Campus ID Number'}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="alex.rivera@campus.edu or 2023-10042"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                    >
                        {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                        {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center mt-4 pt-3 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError(null);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register as student"}
                    </button>
                </div>
            </div>
        </div>
    );
}
