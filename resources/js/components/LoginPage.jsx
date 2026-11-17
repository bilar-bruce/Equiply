import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import {
    Layers,
    Package,
    ShieldCheck,
    RotateCcw,
    LogIn,
    ArrowRight,
    ArrowLeft,
    KeyRound,
    Mail,
    AlertCircle,
    Info,
    CheckCircle2,
    Eye,
    EyeOff
} from 'lucide-react';

export default function LoginPage({ onContinueAsGuest }) {
    const { login } = useAuth();

    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Self-Service Password Recovery Stepper ('request' | 'verify' | 'done' | null)
    const [recoveryStep, setRecoveryStep] = useState(null);
    const [resetLogin, setResetLogin] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState(null);
    const [resetMessage, setResetMessage] = useState(null);

    const isValidLoginIdentifier = (val) => {
        const clean = val.trim();
        return /^\d{10}$/.test(clean) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    };

    const validateInputs = () => {
        if (!isValidLoginIdentifier(loginInput)) {
            return 'Please enter a valid 10-digit USTP Campus ID (e.g. 2024300616) or a valid university email address.';
        }

        if (password.length < 8) {
            return 'Password must be at least 8 characters in length.';
        }

        return null;
    };

    const openRecoveryStepper = () => {
        setError(null);
        setResetError(null);
        setResetMessage(null);
        setResetLogin(loginInput.trim());
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setRecoveryStep('request');
    };

    const closeRecoveryStepper = (prefillLogin = false) => {
        if (prefillLogin && resetLogin.trim()) {
            setLoginInput(resetLogin.trim());
            setPassword('');
        }
        setRecoveryStep(null);
        setResetError(null);
        setResetMessage(null);
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setResetError(null);
        setResetMessage(null);

        if (!isValidLoginIdentifier(resetLogin)) {
            setResetError('Please enter a valid 10-digit USTP Campus ID (e.g. 2024300616) or a valid university email address.');
            return;
        }

        setResetLoading(true);
        try {
            const res = await authApi.forgotPassword(resetLogin.trim());
            setResetMessage(res.message || 'A 6-digit password reset code has been sent to your registered campus email.');
            setRecoveryStep('verify');
        } catch (err) {
            const msg =
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                err.response?.data?.message ||
                'Unable to send verification code. Please check your 10-digit USTP ID or campus email.';
            setResetError(msg);
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyAndReset = async (e) => {
        e.preventDefault();
        setResetError(null);

        const cleanOtp = resetOtp.trim();
        if (!/^\d{6}$/.test(cleanOtp)) {
            setResetError('Please enter the exact 6-digit numeric verification code sent to your email.');
            return;
        }

        if (newPassword.length < 8) {
            setResetError('New password must be at least 8 characters in length.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setResetError('New password and confirmation password do not match.');
            return;
        }

        setResetLoading(true);
        try {
            const res = await authApi.resetPassword({
                login: resetLogin.trim(),
                otp: cleanOtp,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setResetMessage(res.message || 'Your password has been reset successfully.');
            setRecoveryStep('done');
        } catch (err) {
            const msg =
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                err.response?.data?.message ||
                'Password reset failed. Please verify your 6-digit code and try again.';
            setResetError(msg);
        } finally {
            setResetLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Client-side pre-flight constraint check
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            return;
        }

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
        <div className="min-h-screen w-full bg-canvas-light dark:bg-[#0E0B25] flex flex-col lg:flex-row font-['Inter',sans-serif]">
            {/* Left Panel: USTP Branding & 3-Step Campus Borrowing Stepper */}
            <aside aria-label="Equiply overview" className="lg:w-7/12 xl:w-3/5 bg-ustp-navy dark:bg-[#0E0B25] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-ustp-navy-light/40 dark:border-[#282256] relative overflow-hidden">
                {/* Subtle Geometric Background Elements */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-ustp-navy-light/20 blur-3xl pointer-events-none" aria-hidden="true" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

                {/* Brand Header */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-ustp-navy-light dark:bg-[#19143E] border border-ustp-gold/30 flex items-center justify-center shadow-lg">
                            <Layers className="w-5 h-5 text-ustp-gold" aria-hidden="true" />
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

                {/* 3-Step Campus Borrowing Stepper */}
                <div className="my-6 lg:my-8 space-y-5 relative z-10 max-w-xl">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] leading-tight">
                            Reserve Lab Gear & Calculators in Three Swift Steps.
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed">
                            Engineered for USTP students, faculty, and facility custodians to eliminate paper logbooks and ensure guaranteed gear availability.
                        </p>
                    </div>

                    {/* Stepper Steps */}
                    <ol className="space-y-3 pt-1">
                        {/* Step 1 */}
                        <li className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-[#141033]/70 border border-white/10 dark:border-[#282256] hover:border-ustp-gold/40 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-xs" aria-hidden="true">
                                01
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-ustp-gold shrink-0" aria-hidden="true" />
                                    <h2 className="text-sm font-bold text-white">
                                        Real-Time Equipment Discovery
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Check live availability of laboratory attire, PRC-compliant engineering calculators, and breadboard kits before visiting the facility desk.
                                </p>
                            </div>
                        </li>

                        {/* Step 2 */}
                        <li className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-[#141033]/70 border border-white/10 dark:border-[#282256] hover:border-ustp-gold/40 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-xs" aria-hidden="true">
                                02
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-ustp-gold shrink-0" aria-hidden="true" />
                                    <h2 className="text-sm font-bold text-white">
                                        Instant Reservation & Collateral Lock
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Reserve gear allocations instantly using your verified 10-digit USTP Student ID (<span className="font-mono text-ustp-gold">2024######</span>) for an academic clearance guarantee, eliminating physical ID retention.
                                </p>
                            </div>
                        </li>

                        {/* Step 3 */}
                        <li className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 dark:bg-[#141033]/70 border border-white/10 dark:border-[#282256] hover:border-ustp-gold/40 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-ustp-gold flex items-center justify-center shrink-0 font-bold font-mono text-xs" aria-hidden="true">
                                03
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-ustp-gold shrink-0" aria-hidden="true" />
                                    <h2 className="text-sm font-bold text-white">
                                        Facility Dispatch & Fast Return
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Walk up to the operations desk for quick QR/barcode handover, complete your laboratory class or exam, and return on time.
                                </p>
                            </div>
                        </li>
                    </ol>

                    {/* Official In-Person Notice */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-100">
                        <Info className="w-4 h-4 text-ustp-gold shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <span className="font-bold text-white">Campus Facility Policy:</span>{' '}
                            Student accounts are issued in person at the Campus Facility Desk upon presenting a valid physical USTP School ID.
                        </div>
                    </div>
                </div>

                {/* Footer Subtitle */}
                <div className="pt-4 border-t border-white/15 dark:border-[#282256] text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
                    <span>© 2026 University of Science and Technology of Southern Philippines (USTP)</span>
                    <span className="font-mono text-[10px] font-semibold text-ustp-gold">CDO CAMPUS OPERATIONS</span>
                </div>
            </aside>

            {/* Right Panel: Clean Sign-In Form & Guest Access */}
            <main className="lg:w-5/12 xl:w-2/5 bg-white dark:bg-[#141033] p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                {/* Main Sign-In or Password Recovery Card Content */}
                <div className="max-w-md w-full mx-auto my-auto space-y-6">
                    {recoveryStep === null ? (
                        <>
                            <div>
                                <h2 id="sign-in-heading" className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                                    Sign in to Equiply
                                </h2>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                    Enter your credentials to access your borrowings, equipment reservations, or staff desk.
                                </p>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div role="alert" className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
                                    <div>
                                        <span className="font-bold">Authentication Notice:</span> {error}
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} aria-labelledby="sign-in-heading" className="space-y-4">
                                <div>
                                    <label htmlFor="login-identifier" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                        Campus ID or University Email <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        id="login-identifier"
                                        name="login"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        enterKeyHint="next"
                                        aria-invalid={error ? 'true' : undefined}
                                        placeholder="e.g. 2024300616 or user@campus.edu"
                                        value={loginInput}
                                        onChange={(e) => setLoginInput(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flat-input"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                                            Password <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={openRecoveryStepper}
                                            className="text-[11px] font-bold text-ustp-navy dark:text-ustp-gold hover:underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="login-password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            autoComplete="current-password"
                                            enterKeyHint="done"
                                            aria-describedby="login-password-hint"
                                            aria-invalid={error ? 'true' : undefined}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-xs font-mono flat-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-pressed={showPassword}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                                        </button>
                                    </div>
                                    <p id="login-password-hint" className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                                        Minimum 8 characters in length.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                >
                                    <LogIn className="w-4 h-4 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                                    <span>{loading ? 'Authenticating...' : 'Sign In to Campus Portal'}</span>
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700/80" />
                                </div>
                                <div className="relative flex justify-center text-[11px] uppercase">
                                    <span className="bg-white dark:bg-[#141033] px-3 text-slate-500 dark:text-slate-400 font-bold">
                                        Or explore without signing in
                                    </span>
                                </div>
                            </div>

                            {/* Guest Mode Action Button */}
                            <button
                                type="button"
                                onClick={onContinueAsGuest}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 group shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                            >
                                <span>Continue as Guest (Browse Catalog Only)</span>
                                <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                            </button>
                        </>
                    ) : (
                        <div className="space-y-5 animate-in fade-in">
                            {/* Recovery Header */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => closeRecoveryStepper(false)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold mb-2"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Back to Sign In</span>
                                </button>
                                <h2 id="recovery-heading" className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                                    Reset Campus Password
                                </h2>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                    Verify your identity with a one-time 6-digit code sent to your USTP email.
                                </p>
                            </div>

                            {/* 3-Step Recovery Progress Bar */}
                            <ol aria-label="Password recovery progress" className="grid grid-cols-3 gap-2 pt-1">
                                {[
                                    { key: 'request', step: '01', label: 'Request OTP' },
                                    { key: 'verify', step: '02', label: 'Verify & Reset' },
                                    { key: 'done', step: '03', label: 'Complete' },
                                ].map((item) => {
                                    const isActive = recoveryStep === item.key;
                                    const isPassed =
                                        (recoveryStep === 'verify' && item.key === 'request') ||
                                        (recoveryStep === 'done' && item.key !== 'done');
                                    return (
                                        <li
                                            key={item.key}
                                            aria-current={isActive ? 'step' : undefined}
                                            className={`px-3 py-2 rounded-xl border text-left transition-colors ${
                                                isActive
                                                    ? 'bg-ustp-navy text-white border-ustp-navy dark:bg-ustp-gold/15 dark:border-ustp-gold dark:text-white'
                                                    : isPassed
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className="text-[10px] font-mono font-bold uppercase">
                                                Step {item.step}
                                            </div>
                                            <div className="text-[11px] font-bold truncate">
                                                {item.label}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>

                            {/* Error Banner */}
                            {resetError && (
                                <div role="alert" className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
                                    <div>
                                        <span className="font-bold">Recovery Notice:</span> {resetError}
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Request 6-Digit OTP */}
                            {recoveryStep === 'request' && (
                                <form onSubmit={handleRequestOtp} aria-labelledby="recovery-heading" className="space-y-4">
                                    <div>
                                        <label htmlFor="reset-identifier" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                            Campus ID or University Email <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="reset-identifier"
                                            name="reset_login"
                                            type="text"
                                            required
                                            autoComplete="username"
                                            autoCorrect="off"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            enterKeyHint="send"
                                            aria-describedby="reset-identifier-hint"
                                            placeholder="e.g. 2024300616 or student@ustp.edu.ph"
                                            value={resetLogin}
                                            onChange={(e) => setResetLogin(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flat-input"
                                        />
                                        <p id="reset-identifier-hint" className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                                            We will dispatch a 6-digit OTP to the email linked to your campus record.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full py-3 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                    >
                                        <Mail className="w-4 h-4 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                                        <span>{resetLoading ? 'Sending 6-Digit OTP...' : 'Send 6-Digit Verification Code'}</span>
                                    </button>
                                </form>
                            )}

                            {/* Step 2: Enter 6-Digit OTP & New Password */}
                            {recoveryStep === 'verify' && (
                                <form onSubmit={handleVerifyAndReset} aria-labelledby="recovery-heading" className="space-y-4">
                                    {resetMessage && (
                                        <div role="status" className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />
                                            <div>
                                                <span className="font-bold">OTP Sent:</span> {resetMessage}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label htmlFor="reset-otp" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                6-Digit Verification OTP <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetError(null);
                                                    setRecoveryStep('request');
                                                }}
                                                className="text-[11px] font-bold text-ustp-navy dark:text-ustp-gold hover:underline rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                            >
                                                Change ID / Resend
                                            </button>
                                        </div>
                                        <input
                                            id="reset-otp"
                                            name="otp"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            enterKeyHint="next"
                                            maxLength={6}
                                            required
                                            aria-describedby="reset-otp-hint"
                                            placeholder="123456"
                                            value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold tracking-[0.25em] text-center flat-input"
                                        />
                                        <p id="reset-otp-hint" className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                                            Code expires in 15 minutes and is valid for a single use.
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                            New Password <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="reset-new-password"
                                                name="new_password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                autoComplete="new-password"
                                                enterKeyHint="next"
                                                placeholder="Minimum 8 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3.5 py-2.5 pr-11 rounded-xl text-xs font-mono flat-input"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                aria-pressed={showNewPassword}
                                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                                            Confirm New Password <span className="text-rose-600 dark:text-rose-400" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="reset-confirm-password"
                                            name="password_confirmation"
                                            type={showNewPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            enterKeyHint="done"
                                            placeholder="Re-enter your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono flat-input"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full py-3 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                    >
                                        <KeyRound className="w-4 h-4 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                                        <span>{resetLoading ? 'Resetting Password...' : 'Verify OTP & Update Password'}</span>
                                    </button>
                                </form>
                            )}

                            {/* Step 3: Password Reset Complete */}
                            {recoveryStep === 'done' && (
                                <div role="status" className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 space-y-4 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                                            Password Reset Complete
                                        </h3>
                                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                                            {resetMessage || 'Your campus account password has been updated and previous sessions have been signed out.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => closeRecoveryStepper(true)}
                                        className="w-full py-3 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                    >
                                        <LogIn className="w-4 h-4 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                                        <span>Return to Sign In</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Facility Desk Help Notice */}
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-[#282256] text-center text-[11px] text-slate-600 dark:text-slate-300">
                    <p>
                        Need an account or password reset? Visit the{' '}
                        <span className="font-semibold text-ustp-navy dark:text-ustp-gold">
                            Facility Operations Desk
                        </span>{' '}
                        with your physical school ID.
                    </p>
                </div>
            </main>
        </div>
    );
}

