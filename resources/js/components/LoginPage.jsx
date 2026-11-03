import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Layers,
    Package,
    ShieldCheck,
    RotateCcw,
    Lock,
    LogIn,
    ArrowRight,
    Sun,
    Moon,
    AlertCircle,
    Info,
    CheckCircle2,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';

export default function LoginPage({ onContinueAsGuest }) {
    const { login } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(loginInput.trim(), password);
            // On success, AuthContext state updates and MainApp will show MainLayout
        } catch (err) {
            console.error('Login error:', err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                'Authentication failed. Please verify your 10-digit ID or campus email.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-canvas-light dark:bg-[#120E2E] flex flex-col lg:flex-row font-['Inter',sans-serif]">
            {/* Left Panel: USTP Branding & 3-Step Campus Borrowing Stepper */}
            <div className="lg:w-7/12 xl:w-3/5 bg-ustp-navy dark:bg-[#120E2E] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-ustp-navy-light/40 dark:border-slate-800 relative overflow-hidden">
                {/* Subtle Geometric Background Elements */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-ustp-navy-light/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                {/* Brand Header */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-ustp-navy-light dark:bg-ustp-navy-deep border border-ustp-gold/30 flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6 text-ustp-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-2xl tracking-tight text-white font-['Outfit']">
                                    Equip<span className="text-ustp-gold">ly</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-ustp-gold border border-amber-500/30">
                                    USTP
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium">
                                Campus Equipment Portal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Concept 1: 3-Step Campus Borrowing Stepper */}
                <div className="my-10 lg:my-14 space-y-6 relative z-10 max-w-xl">
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ustp-gold">
                            Streamlined Campus Operations
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] leading-tight">
                            Reserve Lab Gear & Calculators in Three Swift Steps.
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 font-normal">
                            Engineered for USTP students, faculty, and facility custodians to eliminate paper logbooks and ensure guaranteed gear availability.
                        </p>
                    </div>

                    {/* Stepper Steps */}
                    <div className="space-y-4 pt-2">
                        {/* Step 1 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 dark:border-slate-800 hover:border-ustp-gold/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-sm">
                                01
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-ustp-gold" />
                                    <h3 className="text-sm font-bold text-white">
                                        Real-Time Equipment Discovery
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Check live availability of laboratory attire, PRC-compliant engineering calculators, and breadboard kits before visiting the facility desk.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 dark:border-slate-800 hover:border-ustp-gold/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-sm">
                                02
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-ustp-gold" />
                                    <h3 className="text-sm font-bold text-white">
                                        Instant Reservation & Collateral Lock
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Reserve gear allocations instantly using your verified 10-digit USTP Student ID (<span className="font-mono text-ustp-gold">2024######</span>) for an academic clearance guarantee, eliminating physical ID retention.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 dark:border-slate-800 hover:border-ustp-gold/40 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-sm">
                                03
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-ustp-gold" />
                                    <h3 className="text-sm font-bold text-white">
                                        Facility Dispatch & Fast Return
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Walk up to the operations desk for quick QR/barcode handover, complete your laboratory class or exam, and return on time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Official In-Person Notice */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
                        <Info className="w-4 h-4 text-ustp-gold shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-white">Campus Facility Policy:</span>{' '}
                            Student accounts are issued in person at the Campus Facility Desk upon presenting a valid physical USTP School ID.
                        </div>
                    </div>
                </div>

                {/* Footer Subtitle */}
                <div className="pt-4 border-t border-white/10 dark:border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
                    <span>© 2026 University of Science and Technology of Southern Philippines (USTP)</span>
                    <span className="font-mono text-[10px] text-ustp-gold">CDO CAMPUS OPERATIONS</span>
                </div>
            </div>

            {/* Right Panel: Clean Sign-In Form & Guest Access */}
            <div className="lg:w-5/12 xl:w-2/5 bg-white dark:bg-[#151136] p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                {/* Top Bar: Theme Toggle */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                        aria-label="Toggle visual theme"
                    >
                        {isDark ? (
                            <>
                                <Sun className="w-4 h-4 text-ustp-gold" />
                                <span>Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-ustp-navy" />
                                <span>Dark Mode</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Main Sign-In Card Content */}
                <div className="max-w-md w-full mx-auto my-auto space-y-6">
                    <div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-gold/10 dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/20">
                            USTP UNIFIED RESOURCE PORTAL
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] mt-2">
                            Sign in to Equiply
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Enter your credentials to access your borrowings, equipment reservations, or staff desk.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <div>
                                <span className="font-bold">Authentication Notice:</span> {error}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Campus ID or University Email <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 2024300616 or user@campus.edu"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flat-input"
                            />
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                Students, custodians, and faculty may use their 10-digit ID or campus email.
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs font-mono flat-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4 text-ustp-gold" />
                            <span>{loading ? 'Authenticating...' : 'Sign In to Campus Portal'}</span>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase">
                            <span className="bg-white dark:bg-[#151136] px-3 text-slate-400 dark:text-slate-500 font-bold">
                                Or explore without signing in
                            </span>
                        </div>
                    </div>

                    {/* Guest Mode Action Button */}
                    <button
                        type="button"
                        onClick={onContinueAsGuest}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 group shadow-xs"
                    >
                        <span>Continue as Guest (Browse Catalog Only)</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                        Guests can view real-time inventory and technical specifications without signing in.
                    </p>
                </div>

                {/* Facility Desk Help Notice */}
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    <p>
                        Need an account or password reset? Visit the{' '}
                        <span className="font-semibold text-ustp-navy dark:text-ustp-gold">
                            Facility Operations Desk
                        </span>{' '}
                        with your physical school ID.
                    </p>
                </div>
            </div>
        </div>
    );
}

