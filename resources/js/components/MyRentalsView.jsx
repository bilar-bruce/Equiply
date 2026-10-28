import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../api/client';
import {
    Clock,
    CalendarCheck,
    CheckCircle2,
    AlertCircle,
    XCircle,
    FileText,
    RefreshCw,
    Shield
} from 'lucide-react';

export default function MyRentalsView({ onRefreshTrigger }) {
    const { user } = useAuth();
    const [myRentals, setMyRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    const fetchMyRentals = async () => {
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
        fetchMyRentals();
    }, [user]);

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this pending reservation?')) return;
        setCancellingId(id);
        try {
            await reservationsApi.cancel(id);
            await fetchMyRentals();
            if (onRefreshTrigger) onRefreshTrigger();
        } catch (err) {
            alert(err.response?.data?.message || 'Cancellation failed.');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-3xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-['Outfit']">My Campus Borrowings</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Active reservations, ongoing loans, and collateral receipts for{' '}
                        <span className="font-semibold text-indigo-300">{user?.name}</span> ({user?.id_number}).
                    </p>
                </div>

                <button
                    onClick={fetchMyRentals}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all self-start sm:self-auto"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading your borrowing records...</div>
            ) : myRentals.length === 0 ? (
                <div className="p-12 text-center rounded-3xl glass-panel">
                    <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
                    <h3 className="text-sm font-bold text-white">No active borrowings found</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Visit the Gear Catalog to reserve lab attire, calculators, or electronics.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {myRentals.map((rental) => {
                        const isPending = rental.status === 'pending' || rental.status === 'reserved';
                        const isActive = rental.status === 'active';
                        const isReturned = rental.status === 'returned';

                        return (
                            <div
                                key={rental.id || rental._id}
                                className="p-5 rounded-2xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                                            {rental.rental_code}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                isPending
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : isActive
                                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}
                                        >
                                            {rental.status}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-base text-white">
                                        {rental.item_snapshot?.name || rental.item?.name || 'Equipment'}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                        <div>
                                            <span className="text-slate-400 text-[11px] block">Due Return:</span>
                                            <span className="font-semibold text-slate-200">
                                                {new Date(rental.schedule?.due_time).toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-slate-400 text-[11px] block">Collateral Held:</span>
                                            <span className="font-mono text-indigo-300 font-semibold">
                                                {rental.financials?.collateral_held || 'ID Declared'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {isPending && (
                                        <button
                                            disabled={cancellingId === (rental.id || rental._id)}
                                            onClick={() => handleCancel(rental.id || rental._id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {cancellingId === (rental.id || rental._id) ? 'Cancelling...' : 'Cancel Reservation'}
                                        </button>
                                    )}

                                    {isActive && (
                                        <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" />
                                            In Your Possession
                                        </span>
                                    )}

                                    {isReturned && (
                                        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Returned & Closed
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
