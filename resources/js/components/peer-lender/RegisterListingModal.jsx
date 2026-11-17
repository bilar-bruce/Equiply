import React from 'react';
import { Plus, X } from 'lucide-react';

export default function RegisterListingModal({
    open,
    itemName,
    setItemName,
    category,
    setCategory,
    rentalRate,
    setRentalRate,
    depositRequired,
    setDepositRequired,
    specNotes,
    setSpecNotes,
    submitting,
    onSubmit,
    onClose,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                            Register Equipment for Facility Intake
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Submit your gear details. You will present the item to the facility desk for intake.
                        </p>
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
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Equipment Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Raspberry Pi 4 Model B (4GB RAM) with Sensor Kit"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs flat-input"
                            >
                                <option value="Electronics">Electronics</option>
                                <option value="Computation">Computation</option>
                                <option value="Laboratory Attire">Laboratory Attire</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Flat Rental Fee (₱) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="1.00"
                                min="5"
                                required
                                placeholder="30.00"
                                value={rentalRate}
                                onChange={(e) => setRentalRate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-xs font-mono flat-input"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <input
                            type="checkbox"
                            id="peerDepositReq"
                            checked={depositRequired}
                            onChange={(e) => setDepositRequired(e.target.checked)}
                            className="w-4 h-4 rounded text-ustp-navy focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        />
                        <label htmlFor="peerDepositReq" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                            <span className="font-semibold block">Require Refundable Cash Deposit</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Borrowers must provide a cash deposit at the desk in addition to an academic clearance hold.
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Specifications / Notes for Custodian
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Include accessories, condition details, or power specifications..."
                            value={specNotes}
                            onChange={(e) => setSpecNotes(e.target.value)}
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
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            <Plus className="w-4 h-4 text-ustp-gold" />
                            <span>{submitting ? 'Registering...' : 'Register for Desk Intake'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
