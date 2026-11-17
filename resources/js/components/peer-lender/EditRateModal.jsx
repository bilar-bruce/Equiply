import React from 'react';
import { X } from 'lucide-react';

export default function EditRateModal({
    item,
    editRate,
    setEditRate,
    savingEdit,
    onSubmit,
    onClose,
}) {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                            {item.item_code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            Edit Rental Rate
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Flat Rental Fee (₱)
                        </label>
                        <input
                            type="number"
                            step="1.00"
                            min="5"
                            required
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-mono flat-input"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={savingEdit}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            {savingEdit ? 'Saving...' : 'Save Rate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
