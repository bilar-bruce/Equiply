import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../api/client';
import { formatPHP } from '../utils/currency';
import {
    History,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    Clock,
    FileText,
    ShieldCheck,
    CalendarCheck,
    Building2,
    Users,
    Tag,
    AlertCircle,
    RotateCcw
} from 'lucide-react';

export default function CustodianHistoryView({ refreshKey }) {
    const { user, isCustodian } = useAuth();
    const [historyRentals, setHistoryRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Retrieve all rental records
            const res = await reservationsApi.list({ per_page: 100 });
            const all = res.data || [];
            // Filter to historical records (returned, cancelled, or expired)
            const historical = all.filter(
                (r) => r.status === 'returned' || r.status === 'cancelled' || r.status === 'expired'
            );
            setHistoryRentals(historical);
        } catch (err) {
            console.error('Failed to load loan history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [refreshKey]);

    // Filter by status tab & search term
    const filteredRentals = historyRentals.filter((rental) => {
        if (statusFilter !== 'all' && rental.status !== statusFilter) {
            return false;
        }

        if (searchQuery.trim() !== '') {
            const term = searchQuery.toLowerCase().trim();
            const code = (rental.rental_code || '').toLowerCase();
            const borrowerName = (rental.borrower?.name || '').toLowerCase();
            const borrowerId = (rental.borrower?.id_number || '').toLowerCase();
            const itemName = (
                rental.item_snapshot?.name ||
                rental.item?.name ||
                ''
            ).toLowerCase();
            const itemCode = (
                rental.item?.item_code || ''
            ).toLowerCase();

            return (
                code.includes(term) ||
                borrowerName.includes(term) ||
                borrowerId.includes(term) ||
                itemName.includes(term) ||
                itemCode.includes(term)
            );
        }

        return true;
    });

    // Metric summaries
    const totalArchived = historyRentals.length;
    const totalReturned = historyRentals.filter((r) => r.status === 'returned').length;
    const totalCancelled = historyRentals.filter((r) => r.status === 'cancelled').length;
    const flaggedMaintenance = historyRentals.filter((r) => {
        const condIn = (r.condition_logs?.condition_in || '').toLowerCase();
        return condIn.includes('damage') || condIn.includes('maintenance') || condIn.includes('repair');
    }).length;

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl flat-panel relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-navy-deep dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/30 flex items-center justify-center">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-ustp-navy dark:text-white font-['Outfit']">
                                    Campus Loan & Audit History
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50">
                                    AUDIT ARCHIVE
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Searchable transaction register of completed returns, condition logs, and collateral settlements.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchHistory}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto shadow-xs"
                        title="Refresh loan history"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh Archive</span>
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Archived</span>
                        <div className="text-2xl font-extrabold text-ustp-navy dark:text-white mt-1 font-mono">{totalArchived}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Historical records</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Completed Returns</span>
                        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{totalReturned}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Fully inspected & shelved</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Cancelled Bookings</span>
                        <div className="text-2xl font-extrabold text-slate-600 dark:text-slate-400 mt-1 font-mono">{totalCancelled}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Pre-dispatch withdrawals</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Maintenance Flags</span>
                        <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">{flaggedMaintenance}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Wear or damage noted</span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-80 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by rental code, student ID, name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-xs flat-input"
                    />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {[
                        { id: 'all', label: 'All History' },
                        { id: 'returned', label: 'Returned' },
                        { id: 'cancelled', label: 'Cancelled' },
                        { id: 'expired', label: 'Expired' },
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

            {/* History Cards List */}
            {loading ? (
                <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading historical records...</div>
            ) : filteredRentals.length === 0 ? (
                <div className="p-12 text-center rounded-2xl flat-panel">
                    <History className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">No historical loan records found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Completed equipment returns and cancellations will be archived here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRentals.map((rental) => {
                        const isReturned = rental.status === 'returned';
                        const isCancelled = rental.status === 'cancelled';
                        const isExpired = rental.status === 'expired';
                        const hasOverdue =
                            (rental.financials?.overdue_fee ?? 0) > 0 || Boolean(rental.financials?.is_overdue);

                        return (
                            <div
                                key={rental.id || rental._id}
                                className="p-5 rounded-2xl flat-card space-y-3"
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-ustp-navy dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                            {rental.rental_code}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                isReturned
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                                    : isExpired
                                                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                            }`}
                                        >
                                            {isReturned ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            ) : isExpired ? (
                                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                            ) : (
                                                <XCircle className="w-3 h-3 text-slate-500" />
                                            )}
                                            {rental.status}
                                        </span>
                                        {hasOverdue && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                                <AlertCircle className="w-3 h-3" />
                                                OVERDUE
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Requested: {new Date(rental.schedule?.requested_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Transaction Information Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                                    {/* Equipment */}
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                            Equipment
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                                            {rental.item_snapshot?.name || rental.item?.name || 'Equipment Unit'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            {rental.item?.item_code || '—'}
                                        </span>
                                    </div>

                                    {/* Borrower Details */}
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                            Borrower Student
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                            {rental.borrower?.name || 'Student Borrower'}
                                        </span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                            ID: {rental.borrower?.id_number || '—'}
                                        </span>
                                    </div>

                                    {/* Timestamps */}
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                            Return Timestamp
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                            {rental.schedule?.returned_time
                                                ? new Date(rental.schedule.returned_time).toLocaleString()
                                                : isExpired
                                                ? 'Expired (Unclaimed)'
                                                : isCancelled
                                                ? 'Cancelled (Not Dispatched)'
                                                : '—'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">
                                            Due: {rental.schedule?.due_time ? new Date(rental.schedule.due_time).toLocaleDateString() : '—'}
                                        </span>
                                    </div>

                                    {/* Collateral & Fee */}
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase font-medium">
                                            Settlement & Collateral
                                        </span>
                                        <span className="font-semibold text-ustp-navy dark:text-ustp-gold font-mono block truncate">
                                            {rental.financials?.collateral_held || 'Academic Clearance Hold'}
                                        </span>
                                        {rental.financials?.collateral_status === 'withheld_damage' && (
                                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                Collateral Deducted
                                            </span>
                                        )}
                                        {rental.financials?.collateral_status === 'clearance_hold_flagged' && (
                                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                                Clearance Hold Flagged
                                            </span>
                                        )}
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                                            Fee: {formatPHP(rental.financials?.total_fee ?? 30)}
                                        </span>
                                        {hasOverdue && (
                                            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold block">
                                                Overdue: +{formatPHP(rental.financials.overdue_fee)}
                                            </span>
                                        )}
                                        {(rental.financials?.damage_fee ?? 0) > 0 && (
                                            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                                Damage: +{formatPHP(rental.financials.damage_fee)}
                                            </span>
                                        )}
                                        {(hasOverdue || (rental.financials?.damage_fee ?? 0) > 0) && (
                                            <span className="text-[11px] font-mono text-slate-900 dark:text-white font-bold block">
                                                Total: {formatPHP(rental.financials.final_total ?? ((rental.financials.total_fee ?? 30) + (rental.financials.overdue_fee ?? 0) + (rental.financials.damage_fee ?? 0)))}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Condition Comparison Log */}
                                {rental.condition_logs && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="flex items-start gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">Condition Out: </span>
                                                <span>{rental.condition_logs.condition_out || 'Inspected undamaged'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">Condition In: </span>
                                                <span className={isReturned ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}>
                                                    {rental.condition_logs.condition_in || (isCancelled ? 'N/A (Cancelled before release)' : 'Pending')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

