import React, { useState, useEffect } from 'react';
import { itemsApi } from '../api/client';
import {
    Search,
    Filter,
    RefreshCw,
    SlidersHorizontal,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    CalendarCheck,
    Tag,
    Layers,
    Sparkles,
    UserCheck
} from 'lucide-react';

export default function CatalogView({ onSelectSpecs, onOpenReserve, refreshKey }) {
    const [items, setItems] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAvailability, setSelectedAvailability] = useState('all');
    const [selectedOwnerType, setSelectedOwnerType] = useState('all');

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (selectedAvailability !== 'all') params.availability = selectedAvailability;
            if (selectedOwnerType !== 'all') params.owner_type = selectedOwnerType;

            const [itemsData, catData] = await Promise.all([
                itemsApi.list(params),
                itemsApi.categories(),
            ]);

            setItems(itemsData.data || []);
            setCategoryStats(catData.categories || []);
        } catch (err) {
            console.error('Failed to load catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCatalog();
        }, 200);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory, selectedAvailability, selectedOwnerType, refreshKey]);

    const categoriesList = [
        { id: 'all', label: 'All Equipment' },
        { id: 'Laboratory Attire', label: 'Laboratory Attire' },
        { id: 'Computation', label: 'Computation' },
        { id: 'Electronics', label: 'Electronics' },
        { id: 'General', label: 'General' },
    ];

    return (
        <div className="space-y-6">
            {/* Hero / Filter Bar */}
            <div className="p-6 rounded-3xl glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
                            Campus Gear & P2P Inventory
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Browse verified university lab equipment and student-to-student peer rentals.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchCatalog}
                            title="Refresh Catalog"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/5 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Live Sync
                        </button>
                    </div>
                </div>

                {/* Search & Select Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Search Input */}
                    <div className="sm:col-span-6 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by gear name, serial code, tags (e.g. 'Lab Coat', 'fx-991CW', 'Multimeter')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs glass-input"
                        />
                    </div>

                    {/* Availability Filter */}
                    <div className="sm:col-span-3">
                        <select
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs glass-input font-medium"
                        >
                            <option value="all">All Availability States</option>
                            <option value="available">🟢 Available Only</option>
                            <option value="reserved">🟡 Reserved</option>
                            <option value="rented">🔵 Currently Rented</option>
                            <option value="maintenance">🔴 Maintenance</option>
                        </select>
                    </div>

                    {/* Ownership Filter */}
                    <div className="sm:col-span-3">
                        <select
                            value={selectedOwnerType}
                            onChange={(e) => setSelectedOwnerType(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs glass-input font-medium"
                        >
                            <option value="all">All Ownership Types</option>
                            <option value="facility">🏫 Campus Facility Only</option>
                            <option value="student">🎒 Student P2P Only</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 no-scrollbar">
                    {categoriesList.map((cat) => {
                        const stat = categoryStats.find((s) => s.name === cat.id);
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                                }`}
                            >
                                <span>{cat.label}</span>
                                {stat && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        {stat.available_items}/{stat.total_items}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Gear Items Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="h-64 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse p-6 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                                <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                            </div>
                            <div className="h-10 bg-slate-800 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="p-12 text-center rounded-3xl glass-panel">
                    <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">No equipment matches your filters</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Try clearing search keywords or choosing a different category.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedAvailability('all');
                            setSelectedOwnerType('all');
                        }}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => {
                        const isAvailable = item.availability_stat === 'available';

                        return (
                            <div
                                key={item.id || item._id}
                                className="rounded-2xl glass-card p-5 flex flex-col justify-between relative group"
                            >
                                {/* Card Header */}
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                {item.item_code}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {item.category}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                item.availability_stat === 'available'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : item.availability_stat === 'reserved'
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : item.availability_stat === 'rented'
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    item.availability_stat === 'available'
                                                        ? 'bg-emerald-400 animate-pulse'
                                                        : item.availability_stat === 'reserved'
                                                        ? 'bg-amber-400'
                                                        : item.availability_stat === 'rented'
                                                        ? 'bg-blue-400'
                                                        : 'bg-rose-400'
                                                }`}
                                            ></span>
                                            {item.availability_stat}
                                        </span>
                                    </div>

                                    {/* Item Title */}
                                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-2 font-['Outfit']">
                                        {item.name}
                                    </h3>

                                    {/* Polymorphic Specs Preview */}
                                    {item.specs && Object.keys(item.specs).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {Object.entries(item.specs)
                                                .slice(0, 3)
                                                .map(([k, v]) => (
                                                    <span
                                                        key={k}
                                                        className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900/80 text-slate-300 border border-white/5"
                                                    >
                                                        <span className="text-slate-500 capitalize">{k}:</span>{' '}
                                                        <span className="font-semibold text-slate-200">
                                                            {String(v)}
                                                        </span>
                                                    </span>
                                                ))}
                                        </div>
                                    )}

                                    {/* Ownership & Rate row */}
                                    <div className="flex items-center justify-between text-xs py-2 border-t border-white/5 my-2">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            {item.owner_type === 'facility' ? (
                                                <span className="text-[11px] text-slate-400">🏛️ Campus Facility</span>
                                            ) : (
                                                <span className="text-[11px] text-indigo-300 font-medium">
                                                    🎒 P2P: {item.owner?.name || 'Student'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold font-mono">
                                            {item.rental_rate_hr > 0 ? (
                                                <span className="text-emerald-400">
                                                    ${item.rental_rate_hr.toFixed(2)}/hr
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">
                                                    FREE LOAN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => onSelectSpecs(item)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 transition-all"
                                    >
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                        Specs
                                    </button>

                                    <button
                                        disabled={!isAvailable}
                                        onClick={() => onOpenReserve(item)}
                                        className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                                            isAvailable
                                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30'
                                                : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5'
                                        }`}
                                    >
                                        <CalendarCheck className="w-3.5 h-3.5" />
                                        {isAvailable ? 'Reserve' : 'Locked'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
