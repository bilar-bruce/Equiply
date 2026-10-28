import React from 'react';
import { X, Cpu, ShieldCheck, Tag, QrCode, DollarSign, CalendarCheck } from 'lucide-react';

export default function SpecsModal({ item, onClose, onReserve }) {
    if (!item) return null;

    const isAvailable = item.availability_stat === 'available';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                {/* Header Flat Accent */}
                <div className="h-1.5 w-full bg-ustp-navy dark:bg-ustp-gold"></div>

                <div className="p-6">
                    {/* Title and Close */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                    {item.item_code}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {item.category}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                        item.availability_stat === 'available'
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                            : item.availability_stat === 'reserved'
                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                            : item.availability_stat === 'rented'
                                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                    }`}
                                >
                                    {item.availability_stat}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">{item.name}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Owner & Rates Information */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Ownership</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                {item.owner_type === 'facility' ? '🏫 Campus Facility' : '🎒 Student P2P'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Rental Rate</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                {item.rental_rate_hr > 0 ? `$${item.rental_rate_hr.toFixed(2)}/hr` : 'FREE (Facility)'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Collateral Required</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.deposit_required ? '⚠️ ID or Cash Deposit' : '✅ Standard Student ID'}
                            </span>
                        </div>
                    </div>

                    {/* Polymorphic Specifications Table */}
                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Cpu className="w-4 h-4 text-ustp-gold" />
                            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Technical Specifications (Subdocument)
                            </h3>
                        </div>

                        {item.specs && Object.keys(item.specs).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(item.specs).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between"
                                    >
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                                            {typeof value === 'boolean'
                                                ? value
                                                    ? 'Yes / Certified'
                                                    : 'No'
                                                : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800">
                                No polymorphic specifications declared for this item.
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <Tag className="w-3.5 h-3.5 text-ustp-gold" />
                                <span>Indexed Discovery Tags</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {item.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Close
                        </button>

                        <button
                            disabled={!isAvailable}
                            onClick={() => {
                                onClose();
                                onReserve(item);
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                isAvailable
                                    ? 'bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-ustp-navy/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <CalendarCheck className="w-4 h-4 text-ustp-gold" />
                            {isAvailable ? 'Proceed to Reservation' : 'Unavailable for Checkout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
