import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Phone, KeyRound, User as UserIcon, Mail, IdCard } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';

export default function ProfileModal({ open, onClose }) {
    const { user, refreshUser } = useAuth();
    const { showToast } = useFeedback();

    const [contactNumber, setContactNumber] = useState('');
    const [savingContact, setSavingContact] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (open && user) {
            setContactNumber(user.contact_number || '');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [open, user]);

    if (!open || !user) return null;

    const handleSaveContact = async (e) => {
        e.preventDefault();
        setSavingContact(true);
        try {
            const res = await authApi.updateProfile({ contact_number: contactNumber.trim() });
            if (refreshUser) await refreshUser();
            showToast({
                type: 'success',
                title: 'Profile Updated',
                message: res.message || 'Contact number updated.',
            });
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Update Failed',
                message: err.response?.data?.message || 'Could not update contact number.',
            });
        } finally {
            setSavingContact(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast({ type: 'error', title: 'Mismatch', message: 'New passwords do not match.' });
            return;
        }
        setSavingPassword(true);
        try {
            const res = await authApi.changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast({
                type: 'success',
                title: 'Password Updated',
                message: res.message || 'Your password has been changed.',
            });
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Password Change Failed',
                message: err.response?.data?.message || 'Could not change password.',
            });
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
        >
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 bg-ustp-navy text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-ustp-gold/20 text-ustp-gold flex items-center justify-center font-bold text-xs">
                            {(user.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 id="profile-modal-title" className="text-sm font-bold font-['Outfit']">
                                Campus Account Profile
                            </h3>
                            <p className="text-[10px] text-slate-300">
                                Verified USTP Identity & Self-Service Settings
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close profile"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 overflow-y-auto">
                    {/* Verified Identity (Read-Only) */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ustp-navy dark:text-ustp-gold flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verified by Facility Desk
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-ustp-navy/10 dark:bg-ustp-gold/15 text-ustp-navy dark:text-ustp-gold">
                                    {user.role}
                                </span>
                                {user.is_peer_lender && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                        Peer Lender
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                            <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" /> Full Name
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                                    {user.name}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <IdCard className="w-3 h-3" /> 10-Digit USTP ID
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block">
                                    {user.id_number}
                                </span>
                            </div>
                            <div className="sm:col-span-2">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Email Address
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                            To correct your name, ID number, or email, please visit the USTP Facility Operations Desk.
                        </p>
                    </div>

                    {/* Editable Contact Number */}
                    <form onSubmit={handleSaveContact} className="space-y-2.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-ustp-navy dark:text-ustp-gold" />
                            Mobile / Contact Number
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                placeholder="e.g. 09171234567"
                                className="flex-1 px-3 py-2 rounded-xl text-xs font-mono flat-input"
                            />
                            <button
                                type="submit"
                                disabled={savingContact}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy/90 text-white dark:bg-ustp-gold dark:text-ustp-navy transition-colors shrink-0"
                            >
                                {savingContact ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>

                    {/* Change Password */}
                    <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-ustp-navy dark:text-ustp-gold" />
                            Change Password
                        </h4>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password (min 8 chars)"
                                className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                            />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                            >
                                {savingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
