import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { reservationsApi } from '../api/client';
import { formatPHP } from '../utils/currency';
import PickupPassModal from './PickupPassModal';
import {
    Clock,
    CalendarCheck,
    CheckCircle2,
    AlertCircle,
    XCircle,
    FileText,
    RefreshCw,
    Shield,
    QrCode
} from 'lucide-react';

export default function MyRentalsView({ onRefreshTrigger, onNavigateToLogin, onOpenAuthModal, refreshKey }) {
    const { user, isAuthenticated } = useAuth();
    const { showToast, confirm } = useFeedback();
    const [myRentals, setMyRentals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [pickupPassData, setPickupPassData] = useState(null);

    const handleLoginClick = onNavigateToLogin || onOpenAuthModal;

    useEffect(() => {
        const timer = setInterval(() => setNowMs(Date.now()), 15000);
        return () => clearInterval(timer);
    }, []);

    const fetchMyRentals = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await reservationsApi.list();
            setMyRentals(res.data || []);
        } catch (err) {
            console.error('Failed to load my rentals:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchMyRentals();
        } else {
            setMyRentals([]);
        }
    }, [user, isAuthenticated, refreshKey]);

    if (!isAuthenticated) {
        return (
            <div className="p-8 sm:p-12 text-center rounded-2xl flat-panel max-w-xl mx-auto my-8">
                <div className="w-14 h-14 rounded-2xl bg-ustp-navy/10 dark:bg-ustp-gold/10 border border-ustp-navy/20 dark:border-ustp-gold/20 flex items-center justify-center mx-auto mb-4 text-ustp-navy dark:text-ustp-gold">
                    <Shield className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                    Sign In to Access Campus Borrowings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Authenticate with your USTP Student or Faculty ID to inspect active reservations, collateral custody receipts, and equipment return schedules.
                </p>
                <div className="mt-6">
                    <button
                        onClick={handleLoginClick}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-md shadow-ustp-navy/20 transition-all inline-flex items-center gap-2"
                    >
                        <CalendarCheck className="w-4 h-4 text-ustp-gold" />
                        Authenticate with USTP Account
                    </button>
                </div>
            </div>
        );
    }

    const handleCancel = async (id) => {
        const ok = await confirm({
            title: 'Cancel Reservation',
            message: 'Are you sure you want to cancel this pending reservation? The equipment will be released back to the catalog.',
            confirmLabel: 'Cancel Reservation',
            tone: 'danger',
        });
        if (!ok) return;
        setCancellingId(id);
        try {
            await reservationsApi.cancel(id);
            showToast({ type: 'success', title: 'Reservation Cancelled', message: 'Pending reservation cancelled and equipment released.' });
            await fetchMyRentals();
            if (onRefreshTrigger) onRefreshTrigger();
        } catch (err) {
            showToast({ type: 'error', title: 'Cancellation Failed', message: err.response?.data?.message || 'Cancellation failed.' });
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl flat-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-ustp-navy dark:text-white font-['Outfit']">My Campus Borrowings</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Active reservations, ongoing loans, and collateral receipts for{' '}
                        <span className="font-semibold text-ustp-navy dark:text-ustp-gold">{user?.name}</span> ({user?.id_number}).
                    </p>
                </div>

                <button
                    onClick={fetchMyRentals}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto shadow-xs"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading your borrowing records...</div>
            ) : myRentals.length === 0 ? (
                <div className="p-12 text-center rounded-2xl flat-panel">
                    <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active borrowings found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Visit the Gear Catalog to reserve lab attire, calculators, or electronics.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {myRentals.map((rental) => {
                        const isPending = rental.status === 'pending' || rental.status === 'reserved';
                        const isActive = rental.status === 'active';
                        const isReturned = rental.status === 'returned';
                        const isExpired = rental.status === 'expired';
                        const isOverdue =
                            (isActive && rental.schedule?.due_time && nowMs > new Date(rental.schedule.due_time).getTime()) ||
                            (rental.financials?.overdue_fee ?? 0) > 0 ||
                            Boolean(rental.financials?.is_overdue);
                        const remainingMins =
                            isPending && rental.schedule?.expires_at
                                ? Math.max(0, Math.ceil((new Date(rental.schedule.expires_at).getTime() - nowMs) / 60000))
                                : null;

                        return (
                            <div
                                key={rental.id || rental._id}
                                className="p-5 rounded-2xl flat-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-ustp-navy dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                            {rental.rental_code}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                isPending
                                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                    : isActive
                                                    ? 'bg-ustp-navy/10 text-ustp-navy dark:bg-ustp-gold/10 dark:text-ustp-gold border border-ustp-navy/20 dark:border-ustp-gold/20'
                                                    : isExpired
                                                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                            }`}
                                        >
                                            {rental.status}
                                        </span>

                                        {isOverdue && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                                <AlertCircle className="w-3 h-3" />
                                                OVERDUE
                                            </span>
                                        )}

                                        {isPending && remainingMins !== null && (
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                    remainingMins <= 5
                                                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                                                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                }`}
                                            >
                                                <Clock className="w-3 h-3" />
                                                {remainingMins > 0
                                                    ? `Pickup at Desk within ${remainingMins} mins`
                                                    : 'Pickup window expired'}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                        {rental.item_snapshot?.name || rental.item?.name || 'Equipment'}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Due Return:</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                {new Date(rental.schedule?.due_time).toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Rental Fee:</span>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
                                                {formatPHP(rental.financials?.total_fee ?? 30)}
                                            </span>
                                            {(rental.financials?.overdue_fee ?? 0) > 0 && (
                                                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold block text-[11px]">
                                                    Overdue Fee: +{formatPHP(rental.financials.overdue_fee)}
                                                </span>
                                            )}
                                            {(rental.financials?.damage_fee ?? 0) > 0 && (
                                                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold block text-[11px]">
                                                    Damage Fee: +{formatPHP(rental.financials.damage_fee)}
                                                </span>
                                            )}
                                            {((rental.financials?.overdue_fee ?? 0) > 0 || (rental.financials?.damage_fee ?? 0) > 0) && (
                                                <span className="font-mono text-slate-900 dark:text-white font-bold block text-[11px]">
                                                    Final Total: {formatPHP(rental.financials.final_total ?? ((rental.financials.total_fee ?? 30) + (rental.financials.overdue_fee ?? 0) + (rental.financials.damage_fee ?? 0)))}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Collateral Held:</span>
                                            <span className="font-mono text-ustp-navy dark:text-ustp-gold font-semibold block">
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
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                                    {(isPending || isActive) && (
                                        <button
                                            type="button"
                                            onClick={() => setPickupPassData({ rental, remainingMins })}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-ustp-navy hover:bg-ustp-navy/90 text-white dark:bg-ustp-gold dark:hover:bg-amber-400 dark:text-ustp-navy shadow-xs transition-all"
                                        >
                                            <QrCode className="w-3.5 h-3.5" />
                                            Show Desk Pickup Pass
                                        </button>
                                    )}

                                    {isPending && (
                                        <button
                                            disabled={cancellingId === (rental.id || rental._id)}
                                            onClick={() => handleCancel(rental.id || rental._id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-all"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {cancellingId === (rental.id || rental._id) ? 'Cancelling...' : 'Cancel Reservation'}
                                        </button>
                                    )}

                                    {isActive && (
                                        <span className="text-xs text-ustp-navy dark:text-ustp-gold bg-ustp-navy/10 dark:bg-ustp-gold/10 border border-ustp-navy/20 dark:border-ustp-gold/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" />
                                            In Your Possession
                                        </span>
                                    )}

                                    {isReturned && (
                                        <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Returned & Closed
                                        </span>
                                    )}

                                    {isExpired && (
                                        <span className="text-xs text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Unclaimed • Expired
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <PickupPassModal
                rental={pickupPassData?.rental}
                user={user}
                remainingMins={pickupPassData?.remainingMins ?? null}
                onClose={() => setPickupPassData(null)}
            />
        </div>
    );
}
