import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../api/client';
import { formatPHP } from '../utils/currency';
import {
    X,
    CalendarCheck,
    Clock,
    Shield,
    ShieldCheck,
    Banknote,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

export default function ReservationModal({ item, onClose, onSuccess }) {
    const { user } = useAuth();

    // Default due time: 3 hours from now
    const getDefaultDue = (hours = 3) => {
        const d = new Date(Date.now() + hours * 60 * 60 * 1000);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const flatRate = Number(item?.rental_rate_flat ?? item?.rental_rate_hr ?? 30);

    const [dueTime, setDueTime] = useState(getDefaultDue(3));
    const [collateralType, setCollateralType] = useState('Academic Clearance Hold');
    const [cashAmount, setCashAmount] = useState('100.00');
    const [conditionOut, setConditionOut] = useState('Good condition, verified complete');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!item) return null;

    // Quick presets for due time
    const applyPreset = (hours) => {
        setDueTime(getDefaultDue(hours));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const collateralHeldString =
            collateralType === 'Academic Clearance Hold'
                ? `Academic Clearance Hold: Student ID ${user?.id_number || 'Enrolled'}`
                : `Refundable Cash Deposit: ₱${Number(cashAmount).toFixed(2)}`;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-ustp-navy dark:bg-ustp-gold"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                    {item.item_code}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    Guaranteed Campus Allocation
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                                Reserve: {item.name}
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <div>
                                <span className="font-bold">Reservation Unsuccessful:</span> {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Borrower Credentials Preview */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Borrower Account</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Campus ID</span>
                                <span className="font-mono text-ustp-navy dark:text-ustp-gold font-semibold">{user?.id_number}</span>
                            </div>
                        </div>

                        {/* Due Time Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Scheduled Return Due Time <span className="text-rose-500">*</span>
                            </label>

                            {/* Quick Presets */}
                            <div className="grid grid-cols-4 gap-1.5 mb-2">
                                {[2, 4, 8, 24].map((hours) => (
                                    <button
                                        type="button"
                                        key={hours}
                                        onClick={() => applyPreset(hours)}
                                        className="py-1 px-2 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
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
                                className="w-full px-3 py-2 rounded-xl text-xs font-mono flat-input"
                            />
                        </div>

                        {/* Collateral Selection (Authorized University Policies Only) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Collateral Declaration <span className="text-rose-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setCollateralType('Academic Clearance Hold')}
                                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left flex items-center gap-2 ${
                                        collateralType === 'Academic Clearance Hold'
                                            ? 'bg-ustp-navy text-white border-ustp-navy dark:border-ustp-gold/50 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    <ShieldCheck className="w-4 h-4 shrink-0 text-ustp-gold" />
                                    <div>
                                        <div className="font-bold text-[11px]">Academic Clearance Hold</div>
                                        <div className="text-[10px] opacity-80">Institutional Guarantee</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCollateralType('Refundable Cash Deposit')}
                                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left flex items-center gap-2 ${
                                        collateralType === 'Refundable Cash Deposit'
                                            ? 'bg-ustp-navy text-white border-ustp-navy dark:border-ustp-gold/50 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    <Banknote className="w-4 h-4 shrink-0 text-emerald-500" />
                                    <div>
                                        <div className="font-bold text-[11px]">Refundable Cash Deposit</div>
                                        <div className="text-[10px] opacity-80">Returned at desk</div>
                                    </div>
                                </button>
                            </div>

                            {collateralType === 'Academic Clearance Hold' ? (
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                    <span className="font-bold">Digital Undertaking:</span> By confirming, you pledge your verified campus standing (ID: <span className="font-mono font-bold">{user?.id_number}</span>). Failure to return or damage to equipment initiates an official property clearance hold on your academic records until settled.
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                        Cash Bond Amount (₱)
                                    </label>
                                    <input
                                        type="number"
                                        min="10"
                                        step="10"
                                        required
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-xs font-mono flat-input"
                                        placeholder="Deposit amount in Peso..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Outgoing Condition */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Outgoing Condition Verification Note
                            </label>
                            <input
                                type="text"
                                value={conditionOut}
                                onChange={(e) => setConditionOut(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                            />
                        </div>

                        {/* Fee Breakdown & Transaction Notice */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                <span>Pricing Model:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">Flat Rental Fee (Per Checkout)</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                <span>Rental Rate:</span>
                                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatPHP(flatRate)}
                                </span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-bold text-sm">
                                <span className="text-slate-900 dark:text-white">Total Rental Due:</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                                    {formatPHP(flatRate)}
                                </span>
                            </div>
                            <div className="pt-2 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-ustp-gold shrink-0" />
                                <span>Authorized USTP Campus Equipment Custody Protocol.</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors disabled:opacity-50"
                            >
                                <CalendarCheck className="w-4 h-4 text-ustp-gold" />
                                {submitting ? 'Confirming Reservation...' : 'Confirm Equipment Reservation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
