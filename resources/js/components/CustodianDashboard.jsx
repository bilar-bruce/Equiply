import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../api/client';
import {
    ShieldCheck,
    CheckCircle2,
    Clock,
    AlertTriangle,
    RotateCcw,
    Send,
    User,
    Search,
    RefreshCw,
    X,
    Wrench,
    FileText,
    ArrowUpRight
} from 'lucide-react';

export default function CustodianDashboard({ onRefreshTrigger }) {
    const { user, isCustodian } = useAuth();
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchCode, setSearchCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Return check-in modal state
    const [checkinModalRental, setCheckinModalRental] = useState(null);
    const [conditionIn, setConditionIn] = useState('Returned in good condition, complete');
    const [markMaintenance, setMarkMaintenance] = useState(false);
    const [checkinNotes, setCheckinNotes] = useState('');

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchCode) params.search = searchCode;

            const res = await reservationsApi.list(params);
            setRentals(res.data || []);
        } catch (err) {
            console.error('Failed to load rentals for custodian:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, [statusFilter, searchCode]);

    // Authorize & Handover (Checkout)
    const handleCheckout = async (rentalId) => {
        if (!confirm('Confirm physical handover and dispatch of this equipment to the borrower?')) return;
        setActionLoading(true);
        try {
            await reservationsApi.checkout(rentalId);
            await fetchRentals();
            if (onRefreshTrigger) onRefreshTrigger();
        } catch (err) {
            alert(err.response?.data?.message || 'Checkout failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Process Return (Checkin)
    const handleCheckinSubmit = async (e) => {
        e.preventDefault();
        if (!checkinModalRental) return;
        setActionLoading(true);

        try {
            await reservationsApi.checkin(checkinModalRental.id || checkinModalRental._id, {
                condition_in: conditionIn,
                mark_maintenance: markMaintenance,
                notes: checkinNotes,
            });

            setCheckinModalRental(null);
            await fetchRentals();
            if (onRefreshTrigger) onRefreshTrigger();
        } catch (err) {
            alert(err.response?.data?.message || 'Return check-in failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate metrics
    const activeCount = rentals.filter((r) => r.status === 'active').length;
    const pendingCount = rentals.filter((r) => r.status === 'pending' || r.status === 'reserved').length;
    const returnedCount = rentals.filter((r) => r.status === 'returned').length;

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl flat-panel relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-navy-deep dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/30 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-ustp-navy dark:text-white font-['Outfit']">
                                    Custodian Operations Desk
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-ustp-gold border border-amber-300 dark:border-amber-700/50">
                                    FACILITY DESK
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Physical equipment handovers, collateral vault inspection, and return check-ins.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchRentals}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Desk
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Pending Release</span>
                        <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">{pendingCount}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Awaiting student pickup</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Active Borrowings</span>
                        <div className="text-2xl font-extrabold text-ustp-navy dark:text-ustp-gold mt-1 font-mono">{activeCount}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Collateral currently held</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Returned Records</span>
                        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{returnedCount}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Processed returns</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="w-full sm:w-72 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by rental code (e.g. RNT-2026)..."
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-xs flat-input"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All Records' },
                        { id: 'pending', label: 'Pending Release' },
                        { id: 'active', label: 'Active Loans' },
                        { id: 'returned', label: 'Returned' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-ustp-navy text-white shadow-xs dark:bg-ustp-navy dark:border dark:border-ustp-gold/40'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rentals List */}
            {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading custodian dispatch records...</div>
            ) : rentals.length === 0 ? (
                <div className="p-12 text-center rounded-2xl flat-panel">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">No rental operations pending</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All borrower checkouts and returns are up to date.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rentals.map((rental) => {
                        const isPending = rental.status === 'pending' || rental.status === 'reserved';
                        const isActive = rental.status === 'active';
                        const isReturned = rental.status === 'returned';

                        return (
                            <div
                                key={rental.id || rental._id}
                                className="p-5 rounded-2xl flat-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                            >
                                {/* Left Info */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-ustp-navy dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                            {rental.rental_code}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                isPending
                                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                    : isActive
                                                    ? 'bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-gold/10 dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/20'
                                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                            }`}
                                        >
                                            {rental.status}
                                        </span>

                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Requested: {new Date(rental.schedule?.requested_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                                Equipment
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {rental.item_snapshot?.name || rental.item?.name || 'Equipment Item'}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                                Borrower Student
                                            </span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {rental.borrower?.name || 'Alex Rivera'}
                                            </span>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                                ID: {rental.borrower?.id_number}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                                Collateral Vault
                                            </span>
                                            <span className="font-semibold text-ustp-navy dark:text-ustp-gold font-mono">
                                                {rental.financials?.collateral_held || 'Standard School ID'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Condition Notes */}
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>Out: {rental.condition_logs?.condition_out}</span>
                                        {rental.condition_logs?.condition_in && (
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                • Return: {rental.condition_logs?.condition_in}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-2 self-end lg:self-center">
                                    {isPending && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleCheckout(rental.id || rental._id)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                                        >
                                            <Send className="w-3.5 h-3.5 text-ustp-gold" />
                                            Authorize Handover
                                        </button>
                                    )}

                                    {isActive && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setCheckinModalRental(rental);
                                                setConditionIn('Returned in good condition, complete');
                                                setMarkMaintenance(false);
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Process Check-in Return
                                        </button>
                                    )}

                                    {isReturned && (
                                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Closed & Restocked
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Check-in Return Modal */}
            {checkinModalRental && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    {checkinModalRental.rental_code}
                                </span>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                                    Process Return Check-in
                                </h3>
                            </div>
                            <button
                                onClick={() => setCheckinModalRental(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCheckinSubmit} className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Gear Item</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {checkinModalRental.item_snapshot?.name || 'Equipment'}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-2">
                                    Return Collateral to Student:
                                </span>
                                <span className="font-mono text-ustp-navy dark:text-ustp-gold font-bold">
                                    {checkinModalRental.financials?.collateral_held}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Return Inspection Log <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={conditionIn}
                                    onChange={(e) => setConditionIn(e.target.value)}
                                    placeholder="Verify condition, clean state, functionality..."
                                    className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                                <input
                                    type="checkbox"
                                    id="markMaint"
                                    checked={markMaintenance}
                                    onChange={(e) => setMarkMaintenance(e.target.checked)}
                                    className="w-4 h-4 rounded text-ustp-navy focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                />
                                <label htmlFor="markMaint" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                                    Flag for Maintenance / Service (Damages found)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCheckinModalRental(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {actionLoading ? 'Updating Atlas...' : 'Complete Return Check-in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
