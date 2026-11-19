import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { reservationsApi, itemsApi, peerLenderApi } from '../api/client';
import { formatPHP } from '../utils/currency';
import EnrollStudentModal from './EnrollStudentModal';
import MaintenanceQueueTab from './custodian/MaintenanceQueueTab';
import P2pIntakeQueueTab from './custodian/P2pIntakeQueueTab';
import CheckinModal from './custodian/CheckinModal';
import ResolveMaintenanceModal from './custodian/ResolveMaintenanceModal';
import {
    ShieldCheck,
    CheckCircle2,
    Clock,
    AlertTriangle,
    RotateCcw,
    Send,
    User,
    UserPlus,
    Search,
    RefreshCw,
    X,
    Wrench,
    FileText,
    ArrowUpRight,
    Tag,
    Package,
    QrCode
} from 'lucide-react';

export default function CustodianDashboard({ onRefreshTrigger, refreshKey = 0, isActive = true }) {
    const { user, isCustodian } = useAuth();
    const { showToast, confirm } = useFeedback();
    const [rentals, setRentals] = useState([]);
    const [p2pIntakeItems, setP2pIntakeItems] = useState([]);
    const [maintenanceItems, setMaintenanceItems] = useState([]);
    const [resolveModalItem, setResolveModalItem] = useState(null);
    const [repairNotes, setRepairNotes] = useState('Repaired, tested, and verified ready for campus circulation');
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchCode, setSearchCode] = useState('');
    const [quickScanCode, setQuickScanCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);

    // Return check-in modal state
    const [checkinModalRental, setCheckinModalRental] = useState(null);
    const [conditionIn, setConditionIn] = useState('Returned in good condition, complete');
    const [markMaintenance, setMarkMaintenance] = useState(false);
    const [collateralStatus, setCollateralStatus] = useState('released');
    const [damageFee, setDamageFee] = useState('0');
    const [checkinNotes, setCheckinNotes] = useState('');

    const fetchRentals = async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        try {
            if (statusFilter === 'p2p-intake') {
                const res = await itemsApi.list({ owner_type: 'student', availability_stat: 'pending_intake' });
                setP2pIntakeItems(res.data || []);
            } else if (statusFilter === 'maintenance') {
                const res = await itemsApi.list({ availability_stat: 'maintenance' });
                setMaintenanceItems(res.data || []);
            } else {
                const params = {};
                if (statusFilter !== 'all') params.status = statusFilter;
                if (searchCode) params.search = searchCode;

                const res = await reservationsApi.list(params);
                setRentals(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load records for custodian:', err);
        } finally {
            setLoading(false);
        }
    };

    const dirtyRef = React.useRef(false);
    const prevFiltersRef = React.useRef({ statusFilter, searchCode });
    useEffect(() => {
        const filtersChanged =
            prevFiltersRef.current.statusFilter !== statusFilter ||
            prevFiltersRef.current.searchCode !== searchCode;
        prevFiltersRef.current = { statusFilter, searchCode };
        if (!isActive) {
            dirtyRef.current = true;
            return;
        }
        const isSilentRefresh = refreshKey > 0 && !filtersChanged;
        fetchRentals(isSilentRefresh);
    }, [statusFilter, searchCode, refreshKey]);

    useEffect(() => {
        if (isActive && dirtyRef.current) {
            dirtyRef.current = false;
            fetchRentals(rentals.length > 0);
        }
    }, [isActive]);

    const applyUpdatedRental = (updatedRental) => {
        if (!updatedRental) return;
        const targetId = String(updatedRental.id || updatedRental._id);
        setRentals((prev) => {
            const exists = prev.some((r) => String(r.id || r._id) === targetId);
            const next = exists
                ? prev.map((r) => (String(r.id || r._id) === targetId ? updatedRental : r))
                : [updatedRental, ...prev];
            if (statusFilter !== 'all' && statusFilter !== 'p2p-intake' && statusFilter !== 'maintenance') {
                return next.filter((r) => r.status === statusFilter);
            }
            return next;
        });
    };

    // Verify & Accept P2P Physical Intake
    const handleVerifyIntake = async (itemId) => {
        const ok = await confirm({
            title: 'Verify Peer Equipment Intake',
            message: 'Confirm physical inspection and accept this peer equipment into facility vault storage?',
            confirmLabel: 'Accept & Activate',
        });
        if (!ok) return;
        setActionLoading(true);
        try {
            await peerLenderApi.verifyIntake(itemId);
            setP2pIntakeItems((prev) => prev.filter((item) => String(item.id || item._id) !== String(itemId)));
            showToast({ type: 'success', title: 'Intake Verified', message: 'Equipment verified and activated in campus catalog.' });
        } catch (err) {
            showToast({ type: 'error', title: 'Verification Failed', message: err.response?.data?.message || 'Intake verification failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Settle P2P Payout at Desk
    const handleSettlePayout = async (rentalId) => {
        const ok = await confirm({
            title: 'Settle Peer Lender Payout',
            message: 'Confirm physical cash disbursement of P2P rental earnings to the student lender at the Facility Desk?',
            confirmLabel: 'Confirm Disbursement',
        });
        if (!ok) return;
        setActionLoading(true);
        try {
            const res = await peerLenderApi.settlePayout(rentalId);
            applyUpdatedRental(res?.rental);
            showToast({ type: 'success', title: 'Payout Settled', message: 'Peer lender earnings marked as settled.' });
        } catch (err) {
            showToast({ type: 'error', title: 'Payout Failed', message: err.response?.data?.message || 'Payout settlement failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Authorize & Handover (Checkout)
    const handleCheckout = async (rentalId) => {
        const ok = await confirm({
            title: 'Confirm Equipment Dispatch',
            message: 'Confirm physical handover and dispatch of this equipment to the borrower?',
            confirmLabel: 'Dispatch Gear',
        });
        if (!ok) return;
        setActionLoading(true);
        try {
            const res = await reservationsApi.checkout(rentalId);
            applyUpdatedRental(res?.rental);
            showToast({ type: 'success', title: 'Equipment Dispatched', message: 'Handover logged and loan is now active.' });
        } catch (err) {
            showToast({ type: 'error', title: 'Checkout Failed', message: err.response?.data?.message || 'Checkout failed.' });
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
            const res = await reservationsApi.checkin(checkinModalRental.id || checkinModalRental._id, {
                condition_in: conditionIn,
                mark_maintenance: markMaintenance,
                collateral_status: collateralStatus,
                damage_fee: parseFloat(damageFee) || 0,
                notes: checkinNotes,
            });

            setCheckinModalRental(null);
            applyUpdatedRental(res?.rental);
            showToast({ type: 'success', title: 'Return Checked In', message: 'Equipment return and collateral disposition recorded.' });
        } catch (err) {
            showToast({ type: 'error', title: 'Check-In Failed', message: err.response?.data?.message || 'Return check-in failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Resolve Maintenance & Restore to Catalog
    const handleResolveMaintenanceSubmit = async (e) => {
        e.preventDefault();
        if (!resolveModalItem) return;
        setActionLoading(true);

        try {
            const targetId = resolveModalItem.id || resolveModalItem._id;
            await itemsApi.resolveMaintenance(targetId, {
                repair_notes: repairNotes,
            });

            setResolveModalItem(null);
            setMaintenanceItems((prev) => prev.filter((item) => String(item.id || item._id) !== String(targetId)));
            showToast({ type: 'success', title: 'Maintenance Resolved', message: 'Equipment restored to active campus catalog.' });
        } catch (err) {
            showToast({ type: 'error', title: 'Resolution Failed', message: err.response?.data?.message || 'Maintenance resolution failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Quick Scan / Code Lookup (USB/camera barcode scanner or manual entry)
    const handleQuickScanSubmit = async (e) => {
        e.preventDefault();
        const code = quickScanCode.trim().toUpperCase();
        if (!code) return;

        setStatusFilter('all');
        setSearchCode(code);

        try {
            const res = await reservationsApi.list({ search: code });
            const list = res.data || [];
            const exact = list.find((r) => (r.rental_code || '').toUpperCase() === code) || (list.length === 1 ? list[0] : null);

            if (!exact) {
                showToast({ type: 'warning', title: 'Code Not Found', message: `No rental record matched [${code}].` });
                return;
            }

            setQuickScanCode('');
            if (exact.status === 'pending' || exact.status === 'reserved') {
                await handleCheckout(exact.id || exact._id);
            } else if (exact.status === 'active') {
                setCheckinModalRental(exact);
            } else {
                showToast({ type: 'info', title: 'Record Located', message: `[${exact.rental_code}] is currently '${exact.status}'.` });
            }
        } catch (err) {
            showToast({ type: 'error', title: 'Lookup Failed', message: err.response?.data?.message || 'Failed to look up rental code.' });
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

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={fetchRentals}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                            title="Refresh records"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh Desk</span>
                        </button>

                        <button
                            onClick={() => setEnrollModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            <UserPlus className="w-3.5 h-3.5 text-ustp-gold" />
                            <span>+ Enroll Student</span>
                        </button>
                    </div>
                </div>

                {/* Quick Scan / Code Lookup Bar */}
                <form onSubmit={handleQuickScanSubmit} className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl bg-ustp-navy/5 dark:bg-ustp-gold/5 border border-ustp-navy/15 dark:border-ustp-gold/25">
                    <div className="flex items-center gap-2 text-xs font-bold text-ustp-navy dark:text-ustp-gold shrink-0">
                        <QrCode className="w-4 h-4" />
                        <span>Quick Scan / Code Lookup</span>
                    </div>
                    <input
                        type="text"
                        value={quickScanCode}
                        onChange={(e) => setQuickScanCode(e.target.value)}
                        placeholder="Scan QR pass or type RNT-2026-XXXXXX and press Enter..."
                        className="flex-1 px-3.5 py-2 rounded-lg text-xs font-mono flat-input"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-ustp-navy hover:bg-ustp-navy/90 text-white dark:bg-ustp-gold dark:text-ustp-navy transition-colors shrink-0"
                    >
                        Lookup & Open
                    </button>
                </form>

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
                        { id: 'p2p-intake', label: 'P2P Intake Queue' },
                        { id: 'maintenance', label: 'Maintenance & Repair' },
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

            {/* Records or P2P Intake or Maintenance List */}
            {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading records...</div>
            ) : statusFilter === 'maintenance' ? (
                <MaintenanceQueueTab
                    items={maintenanceItems}
                    actionLoading={actionLoading}
                    onOpenResolveModal={(item) => {
                        setResolveModalItem(item);
                        setRepairNotes('Repaired, tested, and verified ready for campus circulation');
                    }}
                />
            ) : statusFilter === 'p2p-intake' ? (
                <P2pIntakeQueueTab
                    items={p2pIntakeItems}
                    actionLoading={actionLoading}
                    onVerifyIntake={handleVerifyIntake}
                />
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
                        const isPeerItem = (rental.item_snapshot?.owner_type || rental.item?.owner_type) === 'student';
                        const payoutStatus = rental.financials?.payout_status || 'unclaimed';
                        const isCurrentlyOverdue =
                            isActive &&
                            rental.schedule?.due_time &&
                            new Date() > new Date(rental.schedule.due_time);
                        const hadOverduePenalty =
                            isReturned &&
                            ((rental.financials?.overdue_fee ?? 0) > 0 || rental.financials?.is_overdue);
                        const isOverdue = isCurrentlyOverdue || hadOverduePenalty;

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

                                        {isOverdue && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                                <AlertTriangle className="w-3 h-3" />
                                                OVERDUE
                                            </span>
                                        )}

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
                                            <span className="font-semibold text-ustp-navy dark:text-ustp-gold font-mono block">
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
                                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
                                                Base Fee: {formatPHP(rental.financials?.total_fee ?? 30)}
                                            </span>
                                            {(rental.financials?.overdue_fee ?? 0) > 0 && (
                                                <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold block">
                                                    Overdue: +{formatPHP(rental.financials.overdue_fee)}
                                                </span>
                                            )}
                                            {(rental.financials?.damage_fee ?? 0) > 0 && (
                                                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                                    Damage Fee: +{formatPHP(rental.financials.damage_fee)}
                                                </span>
                                            )}
                                            {((rental.financials?.overdue_fee ?? 0) > 0 || (rental.financials?.damage_fee ?? 0) > 0) && (
                                                <span className="text-[11px] font-mono text-slate-900 dark:text-white font-bold block">
                                                    Final Total: {formatPHP(rental.financials.final_total ?? ((rental.financials?.total_fee ?? 30) + (rental.financials?.overdue_fee ?? 0) + (rental.financials?.damage_fee ?? 0)))}
                                                </span>
                                            )}
                                            {isPeerItem && isReturned && (
                                                payoutStatus === 'settled' ? (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                                        Settled Payouts (₱): {formatPHP(rental.financials?.total_fee ?? 0)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                        Unclaimed Balance (₱): {formatPHP(rental.financials?.total_fee ?? 0)}
                                                    </span>
                                                )
                                            )}
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
                                                setCollateralStatus('released');
                                                setDamageFee('0');
                                                setCheckinNotes('');
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Process Check-in Return
                                        </button>
                                    )}

                                    {isReturned && (
                                        <>
                                            {isPeerItem && payoutStatus !== 'settled' && (
                                                <button
                                                    disabled={actionLoading}
                                                    onClick={() => handleSettlePayout(rental.id || rental._id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors"
                                                >
                                                    <span>Disburse P2P Payout ({formatPHP(rental.financials?.total_fee ?? 0)})</span>
                                                </button>
                                            )}
                                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Closed & Restocked
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Check-in Return Modal */}
            <CheckinModal
                rental={checkinModalRental}
                conditionIn={conditionIn}
                setConditionIn={setConditionIn}
                markMaintenance={markMaintenance}
                setMarkMaintenance={setMarkMaintenance}
                collateralStatus={collateralStatus}
                setCollateralStatus={setCollateralStatus}
                damageFee={damageFee}
                setDamageFee={setDamageFee}
                actionLoading={actionLoading}
                onSubmit={handleCheckinSubmit}
                onClose={() => setCheckinModalRental(null)}
            />

            {/* Resolve Maintenance Modal */}
            <ResolveMaintenanceModal
                item={resolveModalItem}
                repairNotes={repairNotes}
                setRepairNotes={setRepairNotes}
                actionLoading={actionLoading}
                onSubmit={handleResolveMaintenanceSubmit}
                onClose={() => setResolveModalItem(null)}
            />
            {/* In-Person Student Enrollment Modal */}
            <EnrollStudentModal
                isOpen={enrollModalOpen}
                mode="student_only"
                onClose={() => setEnrollModalOpen(false)}
                onSuccess={() => {
                    fetchRentals();
                }}
            />
        </div>
    );
}
