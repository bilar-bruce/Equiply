import React, { useState, useEffect } from 'react';
import { peerLenderApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPHP } from '../utils/currency';
import {
    Sparkles,
    Package,
    Clock,
    Banknote,
    CheckCircle2,
    AlertCircle,
    Info,
    Plus,
    RefreshCw,
    X,
    Lock,
    Unlock,
    Tag,
    Edit3,
    Archive,
    RotateCcw,
    Layers,
    Shield
} from 'lucide-react';

export default function MyListingsView() {
    const { user } = useAuth();

    const [items, setItems] = useState([]);
    const [metrics, setMetrics] = useState({
        total_listed: 0,
        active_loans: 0,
        completed_loans: 0,
        total_earnings: 0.0,
        unclaimed_earnings: 0.0,
        settled_earnings: 0.0,
        pending_intake: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Modal state for registering new gear
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [rentalRate, setRentalRate] = useState('10.00');
    const [depositRequired, setDepositRequired] = useState(true);
    const [specNotes, setSpecNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Rate edit modal state
    const [editItem, setEditItem] = useState(null);
    const [editRate, setEditRate] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const showToast = (msg, isError = false) => {
        setToastMessage({ text: msg, isError });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchListings = async () => {
        setLoading(true);
        try {
            const res = await peerLenderApi.getListings();
            setItems(res.items || []);
            if (res.metrics) {
                setMetrics(res.metrics);
            }
        } catch (err) {
            console.error('Failed to load peer listings:', err);
            showToast(err.response?.data?.message || 'Failed to load your equipment listings.', true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    // Register a new gear listing for intake
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const parsedRate = parseFloat(rentalRate) || 0.0;
            const payload = {
                name: itemName.trim(),
                category,
                rental_rate_flat: parsedRate,
                rental_rate_hr: parsedRate,
                deposit_required: depositRequired,
                specs: specNotes.trim() ? { notes: specNotes.trim() } : {},
                tags: ['p2p', 'student-owned', category.toLowerCase()],
            };

            const res = await peerLenderApi.createListing(payload);
            showToast(res.message || 'Equipment registered! Please bring it to the Facility Desk.');
            setRegisterModalOpen(false);
            setItemName('');
            setSpecNotes('');
            setRentalRate('10.00');
            await fetchListings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to register equipment listing.', true);
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle recall / withdrawal
    const handleToggleRecall = async (item) => {
        const itemId = item.id || item._id;
        const isWithdrawn = item.availability_stat === 'withdrawn';
        const actionPrompt = isWithdrawn
            ? `Re-submit [${item.item_code}] to the facility desk intake queue?`
            : `Recall [${item.item_code}] from campus catalog circulation?`;

        if (!window.confirm(actionPrompt)) return;

        setActionLoadingId(itemId);
        try {
            const res = await peerLenderApi.toggleRecall(itemId);
            showToast(res.message || 'Status updated.');
            await fetchListings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to change listing status.', true);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Update rental rate
    const handleEditRateSubmit = async (e) => {
        e.preventDefault();
        if (!editItem) return;
        setSavingEdit(true);

        const itemId = editItem.id || editItem._id;
        try {
            const parsedRate = parseFloat(editRate) || 0.0;
            await peerLenderApi.updateListing(itemId, {
                rental_rate_flat: parsedRate,
                rental_rate_hr: parsedRate,
            });
            showToast(`Rental rate updated for [${editItem.item_code}].`);
            setEditItem(null);
            await fetchListings();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update rate.', true);
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Feedback */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 ${
                        toastMessage.isError
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                    {toastMessage.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header Banner */}
            <div className="p-6 rounded-2xl flat-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-ustp-gold border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-ustp-navy dark:text-white font-['Outfit']">
                                    Peer Lender Portal
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-ustp-gold border border-amber-300 dark:border-amber-700/50">
                                    VERIFIED LENDER
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Manage your personal equipment listings, track campus earnings, and review facility custody status.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={fetchListings}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                            title="Refresh your listings"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <button
                            onClick={() => setRegisterModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            <Plus className="w-4 h-4 text-ustp-gold" />
                            <span>+ List Equipment with Facility</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Total Listed Gear
                        </span>
                        <div className="text-2xl font-extrabold text-ustp-navy dark:text-white mt-0.5 font-mono">
                            {metrics.total_listed}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Registered items</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Active Loans
                        </span>
                        <div className="text-2xl font-extrabold text-amber-600 dark:text-ustp-gold mt-0.5 font-mono">
                            {metrics.active_loans}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Currently borrowed</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                            Unclaimed Balance (₱)
                        </span>
                        <div className="text-2xl font-extrabold text-amber-600 dark:text-ustp-gold mt-0.5 font-mono">
                            {formatPHP(metrics.unclaimed_earnings ?? 0)}
                        </div>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Ready to collect at desk</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 block">
                            Settled Payouts (₱)
                        </span>
                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                            {formatPHP(metrics.settled_earnings ?? 0)}
                        </div>
                        <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">Disbursed at desk</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                            Accrued Earnings
                        </span>
                        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                            {formatPHP(metrics.total_earnings ?? 0)}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{metrics.completed_loans} completed borrows</span>
                    </div>
                </div>
            </div>

            {/* Facility Intake Guidance Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-5 h-5 text-ustp-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                        Facility Operations Intake Protocol:
                    </p>
                    <p className="leading-relaxed text-slate-600 dark:text-amber-200/90">
                        Equipment submitted through this portal must be presented to the{' '}
                        <span className="font-semibold text-ustp-navy dark:text-ustp-gold">Campus Facility Operations Desk</span>{' '}
                        for physical verification, serial number assignment, and secure vault intake before becoming available in the student catalog.
                    </p>
                </div>
            </div>

            {/* Inventory Management Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151136] overflow-hidden shadow-xs">
                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-ustp-gold" />
                        Loading personal equipment inventory...
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        <Package className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No equipment listed yet</h3>
                        <p className="mt-1">
                            Click "+ List Equipment with Facility" above to register your first item for intake.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">Equipment Item</th>
                                    <th className="py-3 px-4">Item Code</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Rental Rate</th>
                                    <th className="py-3 px-4">Vault Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {items.map((item) => {
                                    const itemId = item.id || item._id;
                                    const isLocked = item.availability_stat === 'reserved' || item.availability_stat === 'rented';
                                    const isPendingIntake = item.availability_stat === 'pending_intake';
                                    const isWithdrawn = item.availability_stat === 'withdrawn';
                                    const isAvailable = item.availability_stat === 'available';

                                    return (
                                        <tr
                                            key={itemId}
                                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors ${
                                                isWithdrawn ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20' : ''
                                            }`}
                                        >
                                            {/* Name & Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-ustp-gold border border-amber-500/20 flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-white block">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                                            {item.deposit_required ? 'Deposit Required' : 'Zero Deposit'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Item Code */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                                    {item.item_code}
                                                </span>
                                            </td>

                                            {/* Category */}
                                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                                                {item.category}
                                            </td>

                                            {/* Rate */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatPHP(item.rental_rate_flat ?? item.rental_rate_hr ?? 30)}{' '}
                                                <span className="text-[10px] text-slate-400 font-normal">flat</span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4">
                                                {isPendingIntake && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Pending Desk Intake
                                                    </span>
                                                )}
                                                {isAvailable && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Active in Catalog
                                                    </span>
                                                )}
                                                {item.availability_stat === 'reserved' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Reserved
                                                    </span>
                                                )}
                                                {item.availability_stat === 'rented' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        In Use (Loaned)
                                                    </span>
                                                )}
                                                {isWithdrawn && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                        Withdrawn / Archived
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions with Lockout Safeguards */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isLocked ? (
                                                        <div
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                                            title="Safeguard Active: Cannot edit or recall while item is reserved or on active loan."
                                                        >
                                                            <Lock className="w-3 h-3" />
                                                            <span>Loan Active</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditItem(item);
                                                                    setEditRate(String(item.rental_rate_flat ?? item.rental_rate_hr ?? 30));
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                title="Edit rental rate"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>

                                                            <button
                                                                disabled={actionLoadingId === itemId}
                                                                onClick={() => handleToggleRecall(item)}
                                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                                                    isWithdrawn
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                                                                }`}
                                                                title={isWithdrawn ? 'Re-queue for desk intake' : 'Recall equipment from catalog'}
                                                            >
                                                                {isWithdrawn ? 'Re-activate' : 'Recall Gear'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Register Gear for Desk Intake */}
            {registerModalOpen && (
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
                                onClick={() => setRegisterModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                                    onClick={() => setRegisterModalOpen(false)}
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
            )}

            {/* Modal: Edit Rental Rate */}
            {editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#151136] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                    {editItem.item_code}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                    Edit Rental Rate
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditItem(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleEditRateSubmit} className="space-y-4">
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
                                    onClick={() => setEditItem(null)}
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
            )}
        </div>
    );
}

