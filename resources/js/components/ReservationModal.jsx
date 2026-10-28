import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../api/client';
import {
    X,
    CalendarCheck,
    Clock,
    Shield,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Lock
} from 'lucide-react';

export default function ReservationModal({ item, onClose, onSuccess }) {
    const { user } = useAuth();

    // Default due time: 3 hours from now
    const getDefaultDue = (hours = 3) => {
        const d = new Date(Date.now() + hours * 60 * 60 * 1000);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const [dueTime, setDueTime] = useState(getDefaultDue(3));
    const [collateralType, setCollateralType] = useState('School ID');
    const [collateralRef, setCollateralRef] = useState(user?.id_number || '');
    const [conditionOut, setConditionOut] = useState('Good condition, verified complete');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!item) return null;

    // Quick presets for due time
    const applyPreset = (hours) => {
        setDueTime(getDefaultDue(hours));
    };

    // Calculate estimated duration & fees
    const getCalculatedFees = () => {
        const start = Date.now();
        const end = new Date(dueTime).getTime();
        const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
        const rate = Number(item.rental_rate_hr) || 0;
        const total = (rate * diffHours).toFixed(2);
        return { diffHours, total };
    };

    const { diffHours, total } = getCalculatedFees();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const collateralHeldString = `${collateralType}: ${collateralRef}`;

        try {
            const res = await reservationsApi.create({
                item_id: item.id || item._id,
                due_time: new Date(dueTime).toISOString(),
                collateral_held: collateralHeldString,
                condition_out: conditionOut,
            });

            onSuccess(res.data);
            onClose();
        } catch (err) {
            console.error('Reservation failed:', err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Reservation failed. The item may have already been reserved.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-400"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {item.item_code}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    ACID Transaction Lock
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-white font-['Outfit']">
                                Reserve: {item.name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                            <div>
                                <span className="font-bold">Transaction Aborted:</span> {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Borrower Credentials Preview */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-[11px] text-slate-400 block">Borrower Account</span>
                                <span className="font-semibold text-white">{user?.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-slate-400 block">Campus ID</span>
                                <span className="font-mono text-indigo-300 font-semibold">{user?.id_number}</span>
                            </div>
                        </div>

                        {/* Due Time Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Scheduled Return Due Time <span className="text-rose-400">*</span>
                            </label>

                            {/* Quick Presets */}
                            <div className="grid grid-cols-4 gap-1.5 mb-2">
                                {[2, 4, 8, 24].map((hours) => (
                                    <button
                                        type="button"
                                        key={hours}
                                        onClick={() => applyPreset(hours)}
                                        className="py-1 px-2 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
                                    >
                                        +{hours}h
                                    </button>
                                ))}
                            </div>

                            <input
                                type="datetime-local"
                                required
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs font-mono glass-input"
                            />
                        </div>

                        {/* Collateral Declaration */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Collateral Declaration <span className="text-rose-400">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {['School ID', 'Cash Deposit', "Driver's License"].map((type) => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setCollateralType(type)}
                                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                                            collateralType === type
                                                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                                                : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="Identification reference / serial / deposit amount..."
                                value={collateralRef}
                                onChange={(e) => setCollateralRef(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                            />
                        </div>

                        {/* Outgoing Condition */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Outgoing Condition Verification Note
                            </label>
                            <input
                                type="text"
                                value={conditionOut}
                                onChange={(e) => setConditionOut(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs glass-input"
                            />
                        </div>

                        {/* Fee Breakdown & Transaction Notice */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-indigo-500/20 text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-300">
                                <span>Estimated Duration:</span>
                                <span className="font-semibold text-white font-mono">{diffHours} Hour(s)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                                <span>Hourly Rate:</span>
                                <span className="font-mono text-emerald-400">
                                    {item.rental_rate_hr > 0 ? `$${item.rental_rate_hr}/hr` : 'Free Facility Loan'}
                                </span>
                            </div>
                            <div className="border-t border-white/5 pt-1.5 flex justify-between items-center font-bold text-sm">
                                <span className="text-white">Estimated Total:</span>
                                <span className="font-mono text-emerald-400">${total}</span>
                            </div>
                            <div className="pt-2 flex items-center gap-1.5 text-[10px] text-indigo-300/80">
                                <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span>Protected by MongoDB Replica Set multi-document ACID transaction.</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                            >
                                <CalendarCheck className="w-4 h-4" />
                                {submitting ? 'Locking Reservation...' : 'Confirm Atomic Reservation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
