import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatPHP } from '../../utils/currency';

export default function P2pIntakeQueueTab({
    items,
    actionLoading,
    onVerifyIntake,
}) {
    if (items.length === 0) {
        return (
            <div className="p-12 text-center rounded-2xl flat-panel">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No pending P2P gear in intake queue</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All student equipment submissions have been inspected and activated.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.id || item._id}
                    className="p-5 rounded-2xl flat-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                    <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-ustp-navy dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {item.item_code}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Awaiting Physical Verification
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {item.category}
                            </span>
                        </div>

                        <div className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
                            {item.name}
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300">
                            <span>Registered Owner: </span>
                            <span className="font-semibold text-ustp-navy dark:text-ustp-gold">
                                {item.owner?.name || 'Verified Student'}
                            </span>
                            {item.owner?.id_number && (
                                <span className="text-slate-400 ml-1.5 font-mono">
                                    (ID: {item.owner.id_number})
                                </span>
                            )}
                            <span className="ml-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                Rate: {formatPHP(item.rental_rate_flat ?? item.rental_rate_hr ?? 30)} flat
                            </span>
                        </div>
                        {item.specs?.last_damage_note && (
                            <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1.5 mt-1">
                                <span className="font-semibold">Reported Issue:</span> {item.specs.last_damage_note}
                            </div>
                        )}
                        {item.specs?.last_repair_notes && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 mt-1">
                                <span className="font-semibold">Previous Repair:</span> {item.specs.last_repair_notes}
                            </div>
                        )}
                    </div>

                    <div className="self-end lg:self-center">
                        <button
                            disabled={actionLoading}
                            onClick={() => onVerifyIntake(item.id || item._id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-ustp-gold" />
                            <span>Verify & Accept Intake</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
