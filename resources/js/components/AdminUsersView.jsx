import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EnrollStudentModal from './EnrollStudentModal';
import {
    Users,
    UserCheck,
    Shield,
    ShieldAlert,
    UserX,
    Search,
    RefreshCw,
    UserPlus,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Lock,
    Unlock,
    Sparkles,
    AlertCircle
} from 'lucide-react';

export default function AdminUsersView() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [metrics, setMetrics] = useState({
        total_accounts: 0,
        active_students: 0,
        peer_lenders: 0,
        staff_members: 0,
        suspended_accounts: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [p2pFilter, setP2pFilter] = useState('all');
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, isError = false) => {
        setToastMessage({ text: msg, isError });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (p2pFilter === 'p2p_only') params.is_peer_lender = true;

            const res = await adminApi.listUsers(params);
            setUsers(res.users || []);
            if (res.metrics) {
                setMetrics(res.metrics);
            }
        } catch (err) {
            console.error('Failed to load campus accounts:', err);
            showToast('Failed to load accounts: ' + (err.response?.data?.message || err.message), true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, roleFilter, statusFilter, p2pFilter]);

    // Toggle Account Status (active <-> suspended)
    const handleToggleStatus = async (user) => {
        const userId = user.id || user._id;
        if (String(userId) === String(currentUser?._id || currentUser?.id)) {
            showToast('Self-suspension lockout: You cannot suspend your own administrative account.', true);
            return;
        }

        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        const confirmMsg = newStatus === 'suspended'
            ? `Suspend campus account for ${user.name} (${user.id_number})? They will not be able to log in or reserve equipment.`
            : `Re-activate campus account for ${user.name} (${user.id_number})?`;

        if (!window.confirm(confirmMsg)) return;

        setActionLoadingId(userId);
        try {
            await adminApi.updateStatus(userId, newStatus);
            showToast(`Account [${user.id_number}] is now ${newStatus}.`);
            await fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update account status.', true);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Toggle Peer Lender Privileges
    const handleTogglePeerLender = async (user) => {
        const userId = user.id || user._id;
        const newPrivilege = !user.is_peer_lender;

        setActionLoadingId(userId);
        try {
            await adminApi.updatePeerLender(userId, newPrivilege);
            showToast(
                `Peer lending privileges ${newPrivilege ? 'granted to' : 'revoked from'} ${user.name}.`
            );
            await fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update peer lending privilege.', true);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Change User Role
    const handleChangeRole = async (user, newRole) => {
        const userId = user.id || user._id;
        if (user.role === newRole) return;

        if (String(userId) === String(currentUser?._id || currentUser?.id) && newRole !== 'admin') {
            showToast('Self-demotion lockout: You cannot revoke your own administrator privileges.', true);
            return;
        }

        if (!window.confirm(`Change role of ${user.name} to ${newRole.toUpperCase()}?`)) return;

        setActionLoadingId(userId);
        try {
            await adminApi.updateRole(userId, newRole);
            showToast(`Role for [${user.id_number}] updated to ${newRole}.`);
            await fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update role.', true);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6">
            {/* Toast Feedback */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 ${
                        toastMessage.isError
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                    {toastMessage.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header Banner */}
            <div className="p-6 rounded-2xl flat-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-navy-deep dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/30 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-ustp-navy dark:text-white font-['Outfit']">
                                    Campus Account Management
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-ustp-gold border border-amber-300 dark:border-amber-700/50">
                                    ADMINISTRATION
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                In-person facility provisioning, ID verification, privilege assignment, and account governance.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                            title="Refresh account list"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <button
                            onClick={() => setEnrollModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            <UserPlus className="w-4 h-4 text-ustp-gold" />
                            <span>+ Enroll Campus Account</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Total Accounts
                        </span>
                        <div className="text-2xl font-extrabold text-ustp-navy dark:text-white mt-0.5 font-mono">
                            {metrics.total_accounts}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Issued records</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Active Students
                        </span>
                        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                            {metrics.active_students}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Verified borrowers</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            P2P Lenders
                        </span>
                        <div className="text-2xl font-extrabold text-amber-600 dark:text-ustp-gold mt-0.5 font-mono">
                            {metrics.peer_lenders}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Peer privileges</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Facility Staff
                        </span>
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                            {metrics.staff_members}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Custodians & Admins</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Suspended
                        </span>
                        <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
                            {metrics.suspended_accounts}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Access revoked</span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search */}
                <div className="w-full lg:w-80 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search name, 10-digit ID (2024...), or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs flat-input"
                    />
                </div>

                {/* Filter Badges */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Role Filter */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        {[
                            { id: 'all', label: 'All Roles' },
                            { id: 'student', label: 'Students' },
                            { id: 'custodian', label: 'Custodians' },
                            { id: 'admin', label: 'Admins' },
                        ].map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setRoleFilter(r.id)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                    roleFilter === r.id
                                        ? 'bg-white dark:bg-ustp-navy text-ustp-navy dark:text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        {[
                            { id: 'all', label: 'All Status' },
                            { id: 'active', label: 'Active' },
                            { id: 'suspended', label: 'Suspended' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStatusFilter(s.id)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                    statusFilter === s.id
                                        ? 'bg-white dark:bg-ustp-navy text-ustp-navy dark:text-white shadow-xs font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Peer Lender Quick Toggle */}
                    <button
                        onClick={() => setP2pFilter(p2pFilter === 'p2p_only' ? 'all' : 'p2p_only')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            p2pFilter === 'p2p_only'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-ustp-gold border-amber-400 dark:border-amber-600 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-ustp-gold" />
                        <span>P2P Only</span>
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151136] overflow-hidden shadow-xs">
                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-ustp-gold" />
                        Loading campus accounts...
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        <UserX className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No accounts match query</h3>
                        <p className="mt-1">Try adjusting the search query or role/status filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">Campus Account</th>
                                    <th className="py-3 px-4">USTP ID</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">P2P Lending</th>
                                    <th className="py-3 px-4">Account Status</th>
                                    <th className="py-3 px-4">Contact</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {users.map((account) => {
                                    const accountId = account.id || account._id;
                                    const isSelf = String(accountId) === String(currentUser?._id || currentUser?.id);
                                    const isSuspended = account.status === 'suspended';
                                    const isP2P = !!account.is_peer_lender;

                                    return (
                                        <tr
                                            key={accountId}
                                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors ${
                                                isSuspended ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                                            }`}
                                        >
                                            {/* Name & Avatar */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-ustp-navy text-ustp-gold font-bold text-xs flex items-center justify-center shrink-0 border border-ustp-navy/20 dark:border-ustp-gold/30">
                                                        {getInitials(account.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                {account.name}
                                                            </span>
                                                            {isSelf && (
                                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                                    YOU
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                                                            {account.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 10-Digit ID */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                                    {account.id_number}
                                                </span>
                                            </td>

                                            {/* Role & Role Selector */}
                                            <td className="py-3.5 px-4">
                                                <select
                                                    disabled={actionLoadingId === accountId || isSelf}
                                                    value={account.role}
                                                    onChange={(e) => handleChangeRole(account, e.target.value)}
                                                    className={`text-[11px] font-bold uppercase rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                                        account.role === 'admin'
                                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                            : account.role === 'custodian'
                                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                    title={isSelf ? 'Cannot modify your own administrator role' : 'Change account role'}
                                                >
                                                    <option value="student">STUDENT</option>
                                                    <option value="custodian">CUSTODIAN</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                            </td>

                                            {/* P2P Lending Toggle */}
                                            <td className="py-3.5 px-4">
                                                <button
                                                    disabled={actionLoadingId === accountId}
                                                    onClick={() => handleTogglePeerLender(account)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                                        isP2P
                                                            ? 'bg-amber-500/10 text-amber-700 dark:text-ustp-gold border border-amber-400 dark:border-amber-600 hover:bg-amber-500/20'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 hover:text-slate-700'
                                                    }`}
                                                    title="Click to toggle peer lending status"
                                                >
                                                    <Sparkles className={`w-3 h-3 ${isP2P ? 'text-ustp-gold' : ''}`} />
                                                    <span>{isP2P ? 'Granted' : 'Disabled'}</span>
                                                </button>
                                            </td>

                                            {/* Account Status Badge & Toggle */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        isSuspended
                                                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                                                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                    {account.status}
                                                </span>
                                            </td>

                                            {/* Contact */}
                                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                                {account.contact_number || '—'}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    disabled={actionLoadingId === accountId || isSelf}
                                                    onClick={() => handleToggleStatus(account)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                        isSelf
                                                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                                                            : isSuspended
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                                                    }`}
                                                    title={isSelf ? 'Cannot suspend self' : isSuspended ? 'Reactivate account' : 'Suspend account'}
                                                >
                                                    {isSuspended ? 'Reactivate' : 'Suspend'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Enroll Account Modal */}
            <EnrollStudentModal
                isOpen={enrollModalOpen}
                onClose={() => setEnrollModalOpen(false)}
                onSuccess={() => {
                    fetchUsers();
                    showToast('New campus account enrolled successfully!');
                }}
            />
        </div>
    );
}
