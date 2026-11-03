import React, { useState } from 'react';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
    X,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Shield,
    Key,
    Phone,
    Mail,
    User,
    CreditCard
} from 'lucide-react';

export default function EnrollStudentModal({ isOpen, onClose, onSuccess }) {
    const { user: currentUser, isAdmin } = useAuth();

    const [idNumber, setIdNumber] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [role, setRole] = useState('student');
    const [isPeerLender, setIsPeerLender] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setIdNumber('');
        setName('');
        setEmail('');
        setContactNumber('');
        setRole('student');
        setIsPeerLender(false);
        setCustomPassword('');
        setError(null);
        setSuccessData(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        // Client-side 10-digit check
        if (!/^\d{10}$/.test(idNumber.trim())) {
            setError('USTP Campus ID must be exactly 10 digits (e.g. 2024300616).');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                id_number: idNumber.trim(),
                name: name.trim(),
                email: email.trim(),
                contact_number: contactNumber.trim(),
                role: isAdmin ? role : 'student',
                is_peer_lender: isPeerLender,
                ...(customPassword.trim() ? { password: customPassword.trim() } : {}),
            };

            const res = await adminApi.provisionUser(payload);
            setSuccessData({
                user: res.user,
                tempPassword: res.temporary_password || customPassword.trim() || `USTP@${idNumber.trim()}`,
            });

            if (onSuccess) {
                onSuccess(res.user);
            }
        } catch (err) {
            console.error('Account provisioning error:', err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.[Object.keys(err.response?.data?.errors || {})[0]]?.[0] ||
                'Failed to provision account. Please verify input data.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-ustp-navy dark:bg-ustp-gold"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-navy-deep dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/30 flex items-center justify-center shrink-0">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                                    Enroll Campus Account
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    In-person physical ID verification & account provisioning
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Success Notice Card */}
                    {successData ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>Account Successfully Provisioned!</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300">
                                    The campus account has been issued and can now sign in immediately at the portal.
                                </p>

                                <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 font-mono text-[11px] space-y-1.5">
                                    <div>
                                        <span className="text-slate-400">USTP ID:</span>{' '}
                                        <span className="font-bold text-ustp-navy dark:text-ustp-gold">
                                            {successData.user?.id_number}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Name:</span>{' '}
                                        <span className="font-semibold text-slate-800 dark:text-white">
                                            {successData.user?.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Email:</span>{' '}
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {successData.user?.email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Temporary Password:</span>{' '}
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                            {successData.tempPassword}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-2.5 rounded-xl bg-ustp-navy hover:bg-ustp-navy-hover text-white text-xs font-bold shadow-xs transition-colors"
                            >
                                Done & Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Provisioning Failed:</span> {error}
                                    </div>
                                </div>
                            )}

                            {/* 10-Digit USTP ID */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    USTP 10-Digit Campus ID <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        placeholder="e.g. 2024300616"
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono flat-input"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                    Standard 10-digit ID format (YYYY######) printed on the physical campus ID.
                                </span>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Juan Dela Cruz"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs flat-input"
                                    />
                                </div>
                            </div>

                            {/* Email & Contact Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Campus Email <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="juan.dc@campus.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs flat-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Contact Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="+63 9XX XXX XXXX"
                                            value={contactNumber}
                                            onChange={(e) => setContactNumber(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs flat-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection (Admin only) */}
                            {isAdmin && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Account Role
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'student', label: 'Student' },
                                            { id: 'custodian', label: 'Custodian' },
                                            { id: 'admin', label: 'Admin' },
                                        ].map((r) => (
                                            <button
                                                type="button"
                                                key={r.id}
                                                onClick={() => setRole(r.id)}
                                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                                                    role === r.id
                                                        ? 'bg-ustp-navy text-white border-ustp-navy dark:border-ustp-gold/50 shadow-xs'
                                                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Peer Lender Checkbox */}
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                                <input
                                    type="checkbox"
                                    id="enrollPeerLender"
                                    checked={isPeerLender}
                                    onChange={(e) => setIsPeerLender(e.target.checked)}
                                    className="w-4 h-4 rounded text-ustp-navy focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                />
                                <label htmlFor="enrollPeerLender" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <span className="font-semibold block">Grant Verified Peer Lender Privileges</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                        Allows the student to list personal equipment on the P2P campus catalog.
                                    </span>
                                </label>
                            </div>

                            {/* Custom Password (Optional) */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Initial Password (Optional)
                                </label>
                                <div className="relative">
                                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder={`Default: USTP@${idNumber || '2024######'}`}
                                        value={customPassword}
                                        onChange={(e) => setCustomPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono flat-input"
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                    Leave blank to automatically assign standard default password format.
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                                >
                                    <UserPlus className="w-4 h-4 text-ustp-gold" />
                                    {submitting ? 'Provisioning Account...' : 'Enroll Account'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

