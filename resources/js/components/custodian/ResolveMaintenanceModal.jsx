import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { formatPHP } from '../../utils/currency';

export default function ResolveMaintenanceModal({
    item,
    repairNotes,
    setRepairNotes,
    actionLoading,
    onSubmit,
    onClose,
}) {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                {item.item_code}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            Resolve Maintenance & Restore to Catalog
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
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Equipment Item</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-2">
                            Rental Rate:
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatPHP(item.rental_rate_flat ?? item.rental_rate_hr ?? 30)} flat
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Repair & Verification Notes
                        </label>
                        <textarea
                            rows={3}
                            value={repairNotes}
                            onChange={(e) => setRepairNotes(e.target.value)}
                            placeholder="Describe repair work and functional verification..."
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
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
                            {actionLoading ? 'Restoring...' : 'Confirm Repaired & Restore'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
