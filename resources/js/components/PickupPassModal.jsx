import React, { useMemo } from 'react';
import { QrCode, X, Clock, Shield, Tag, User } from 'lucide-react';
import { generateQrMatrix } from '../utils/qrSvg';

export default function PickupPassModal({ rental, user, remainingMins, onClose }) {
    const rentalCode = rental?.rental_code || '';
    const matrix = useMemo(() => generateQrMatrix(rentalCode), [rentalCode]);

    if (!rental) return null;

    const size = matrix.length;
    const quietZone = 2;
    const viewBoxSize = size + quietZone * 2;
    const isPending = rental.status === 'pending' || rental.status === 'reserved';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pickup-pass-title"
        >
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 bg-ustp-navy text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-ustp-gold/20 text-ustp-gold flex items-center justify-center">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 id="pickup-pass-title" className="text-sm font-bold font-['Outfit']">
                                Digital Desk Pickup Pass
                            </h3>
                            <p className="text-[10px] text-slate-300">
                                Present at USTP Facility Operations Desk
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close pickup pass"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Scannable SVG QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-ustp-navy/15 shadow-inner">
                        <svg
                            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                            className="w-48 h-48"
                            shapeRendering="crispEdges"
                            role="img"
                            aria-label={`QR Code for ${rentalCode}`}
                        >
                            <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
                            {matrix.map((row, rIdx) =>
                                row.map((cell, cIdx) =>
                                    cell === 1 ? (
                                        <rect
                                            key={`${rIdx}-${cIdx}`}
                                            x={cIdx + quietZone}
                                            y={rIdx + quietZone}
                                            width={1}
                                            height={1}
                                            fill="#1B1642"
                                        />
                                    ) : null
                                )
                            )}
                        </svg>
                        <span className="mt-2.5 font-mono text-sm font-extrabold tracking-wider text-ustp-navy">
                            {rentalCode}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                USTP Student ID
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {user?.id_number || rental.borrower?.id_number || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                Item Code
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {rental.item?.item_code || rental.item_snapshot?.item_code || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                Collateral Mode
                            </span>
                            <span className="font-semibold text-ustp-navy dark:text-ustp-gold text-right">
                                {rental.financials?.collateral_held || 'Academic Clearance Hold'}
                            </span>
                        </div>
                        {isPending && remainingMins !== null && (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Pickup Window
                                </span>
                                <span className={`font-bold ${remainingMins <= 0 ? 'text-rose-600' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {remainingMins > 0 ? `${remainingMins} mins remaining` : 'Expired'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy/90 text-white dark:bg-ustp-gold dark:text-ustp-navy transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
