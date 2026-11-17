import React from 'react';
import { AlertTriangle, CheckCircle2, Wrench, X } from 'lucide-react';
import { formatPHP } from '../../utils/currency';

export default function CheckinModal({
    rental,
    conditionIn,
    setConditionIn,
    markMaintenance,
    setMarkMaintenance,
    collateralStatus,
    setCollateralStatus,
    damageFee,
    setDamageFee,
    actionLoading,
    onSubmit,
    onClose,
}) {
    if (!rental) return null;

    const baseFee = Number(rental.financials?.total_fee ?? 30);
    const isModalOverdue =
        rental.schedule?.due_time &&
        Date.now() > new Date(rental.schedule.due_time).getTime();
    const overdueHours = isModalOverdue
        ? Math.max(
              1,
              Math.ceil(
                  (Date.now() - new Date(rental.schedule.due_time).getTime()) /
                      3600000
              )
          )
        : 0;
    const overdueFee = overdueHours * 15;
    const parsedDamageFee = Number(damageFee) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {rental.rental_code}
                            </span>
                            {isModalOverdue && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                    <AlertTriangle className="w-3 h-3" />
                                    OVERDUE
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            Process Return Check-in
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Gear Item</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {rental.item_snapshot?.name || 'Equipment'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-2">
                            Return Collateral to Student:
                        </span>
                        <span className="font-mono text-ustp-navy dark:text-ustp-gold font-bold">
                            {rental.financials?.collateral_held}
                        </span>
                    </div>

                    {(isModalOverdue || parsedDamageFee > 0) && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Overdue & Damage Settlement</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                                <span>Base Rental Fee:</span>
                                <span className="font-mono font-semibold">{formatPHP(baseFee)}</span>
                            </div>
                            {isModalOverdue && (
                                <div className="flex justify-between text-rose-700 dark:text-rose-300">
                                    <span>Overdue Surcharge ({overdueHours} hr × {formatPHP(15)}/hr):</span>
                                    <span className="font-mono font-bold">+{formatPHP(overdueFee)}</span>
                                </div>
                            )}
                            {parsedDamageFee > 0 && (
                                <div className="flex justify-between text-amber-700 dark:text-amber-300">
                                    <span>Damage / Repair Fee:</span>
                                    <span className="font-mono font-bold">+{formatPHP(parsedDamageFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-1.5 border-t border-rose-200 dark:border-rose-800/60 font-bold text-slate-900 dark:text-white">
                                <span>Final Total Due:</span>
                                <span className="font-mono text-rose-700 dark:text-rose-300">{formatPHP(baseFee + overdueFee + parsedDamageFee)}</span>
                            </div>
                        </div>
                    )}

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
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setMarkMaintenance(checked);
                                if (checked && collateralStatus === 'released') {
                                    setCollateralStatus('withheld_damage');
                                }
                            }}
                            className="w-4 h-4 rounded text-ustp-navy focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        />
                        <label htmlFor="markMaint" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-500" />
                            Flag for Maintenance / Service (Damages found)
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Collateral Disposition
                        </label>
                        <select
                            value={collateralStatus}
                            onChange={(e) => setCollateralStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                        >
                            <option value="released">Release Collateral in Full (No Deductions)</option>
                            <option value="withheld_damage">Flag Damage / Deduct from Deposit</option>
                            <option value="clearance_hold_flagged">Flag Academic Clearance Hold</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Damage / Repair Fee (₱)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1.00"
                            value={damageFee}
                            onChange={(e) => setDamageFee(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input font-mono"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
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
                            {actionLoading ? 'Processing Return...' : 'Complete Return Check-in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
