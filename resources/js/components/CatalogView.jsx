import React, { useState, useEffect, useRef } from 'react';
import { itemsApi } from '../api/client';
import {
    Search,
    RefreshCw,
    Info,
    CalendarCheck,
    Layers,
    FlaskConical,
    Calculator,
    Cpu,
    Zap,
    Glasses,
    Wrench,
    Activity,
    Package,
    X,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

// Maps item characteristics to instantaneous SVG vector representations (0ms network delay)
function getItemVectorIcon(item) {
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
    const combined = `${name} ${cat} ${tags}`;

    if (combined.includes('goggle') || combined.includes('eyewear') || combined.includes('glasses')) {
        return Glasses;
    }
    if (combined.includes('coat') || combined.includes('chemistry') || combined.includes('lab') || cat.includes('laboratory')) {
        return FlaskConical;
    }
    if (combined.includes('calculator') || cat.includes('computation') || combined.includes('math')) {
        return Calculator;
    }
    if (combined.includes('multimeter') || combined.includes('probe') || combined.includes('testing')) {
        return Activity;
    }
    if (combined.includes('solder') || combined.includes('iron') || combined.includes('tool')) {
        return Wrench;
    }
    if (combined.includes('extension') || combined.includes('cord') || combined.includes('power') || combined.includes('surge')) {
        return Zap;
    }
    if (combined.includes('arduino') || combined.includes('chip') || combined.includes('microcontroller') || cat.includes('electronics')) {
        return Cpu;
    }
    return Package;
}

// Dual Visual Renderer: Instantaneous SVG vector representation with optional lazy-loaded WebP preview
function EquipmentVisual({ item }) {
    const IconComponent = getItemVectorIcon(item);
    const [imgLoaded, setImgLoaded] = useState(false);
    const imageUrl = item.image_url || item.image || null;

    return (
        <div className="relative w-full h-36 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            {/* Subtle USTP Geometric Background Grid */}
            <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#1B1642 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                }}
            />

            {/* Instantaneous SVG Vector Presentation (Guaranteed zero waterfall delay) */}
            <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center justify-center text-ustp-navy dark:text-ustp-gold">
                    <IconComponent className="w-7 h-7 stroke-[1.75]" />
                </div>
            </div>

            {/* Optional Lazy-Loaded WebP Preview (Non-critical, loading=lazy, fetchpriority=low) */}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width="400"
                    height="225"
                    onLoad={() => setImgLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-20 ${
                        imgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            )}
        </div>
    );
}

// Standardized Status Badge
function StatusBadge({ status }) {
    if (status === 'available') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Available
            </span>
        );
    }
    if (status === 'reserved') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Reserved
            </span>
        );
    }
    if (status === 'rented') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                In Use
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Maintenance
        </span>
    );
}

export default function CatalogView({ onSelectSpecs, onOpenReserve, refreshKey }) {
    const [items, setItems] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [categoryMeta, setCategoryMeta] = useState({ total_all: 0, total_available: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAvailability, setSelectedAvailability] = useState('all');
    const [selectedOwnerType, setSelectedOwnerType] = useState('all');
    const searchInputRef = useRef(null);

    // Keyboard shortcut '/' to instantly focus the search bar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchCategories = async () => {
        try {
            const catData = await itemsApi.categories();
            setCategoryStats(catData.categories || []);
            setCategoryMeta({
                total_all: catData.total_all || 0,
                total_available: catData.total_available || 0,
            });
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const fetchItems = async (isInitial = false) => {
        if (isInitial || items.length === 0) {
            setLoading(true);
        }
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (selectedAvailability !== 'all') params.availability = selectedAvailability;
            if (selectedOwnerType !== 'all') params.owner_type = selectedOwnerType;

            const itemsData = await itemsApi.list(params);
            setItems(itemsData.data || []);
        } catch (err) {
            console.error('Failed to load catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    // Category metadata only fetches on initial mount and when inventory updates
    useEffect(() => {
        fetchCategories();
    }, [refreshKey]);

    // Debounced items fetch for search/filters
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchItems();
        }, 150);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory, selectedAvailability, selectedOwnerType, refreshKey]);

    const categoriesList = [
        { id: 'all', label: 'All Equipment', icon: Layers },
        { id: 'Laboratory Attire', label: 'Laboratory Attire', icon: FlaskConical },
        { id: 'Computation', label: 'Computation', icon: Calculator },
        { id: 'Electronics', label: 'Electronics', icon: Cpu },
        { id: 'General', label: 'General', icon: Package },
    ];

    const handleClearSearch = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedAvailability !== 'all' || selectedOwnerType !== 'all';

    const handleResetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedAvailability('all');
        setSelectedOwnerType('all');
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar / Controls */}
            <div className="p-6 rounded-2xl flat-panel relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-ustp-navy/10 dark:bg-ustp-gold/15 text-ustp-navy dark:text-ustp-gold uppercase tracking-wider">
                                USTP Official Catalog
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {loading ? 'Syncing...' : `${items.length} items cataloged`}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-ustp-navy dark:text-white tracking-tight font-['Outfit']">
                            Campus Gear & Peer-to-Peer Inventory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Browse verified university laboratory equipment and student-to-student peer rentals.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            onClick={fetchCatalog}
                            title="Refresh Catalog"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Live Sync
                        </button>
                    </div>
                </div>

                {/* Search & Select Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Refactored Search Input with shortcut hint & clear button */}
                    <div className="sm:col-span-6 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by gear name, serial code, tags (e.g. 'Lab Coat', 'fx-991CW', 'Multimeter')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-16 py-2.5 rounded-xl text-xs flat-input"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {searchQuery ? (
                                <button
                                    onClick={handleClearSearch}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
                                    /
                                </kbd>
                            )}
                        </div>
                    </div>

                    {/* Availability Filter */}
                    <div className="sm:col-span-3">
                        <select
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs flat-input font-medium"
                        >
                            <option value="all">All Availability States</option>
                            <option value="available">🟢 Available Only</option>
                            <option value="reserved">🟡 Reserved</option>
                            <option value="rented">🔵 In Use / Rented</option>
                            <option value="maintenance">🔴 Maintenance</option>
                        </select>
                    </div>

                    {/* Ownership Filter */}
                    <div className="sm:col-span-3">
                        <select
                            value={selectedOwnerType}
                            onChange={(e) => setSelectedOwnerType(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-xs flat-input font-medium"
                        >
                            <option value="all">All Ownership Types</option>
                            <option value="facility">🏫 Campus Facility Only</option>
                            <option value="student">🎒 Student P2P Only</option>
                        </select>
                    </div>
                </div>

                {/* Category Pill Filters with Tailored Vector Icons */}
                <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 no-scrollbar">
                    {categoriesList.map((cat) => {
                        const stat = cat.id === 'all'
                            ? { available_items: categoryMeta.total_available, total_items: categoryMeta.total_all }
                            : categoryStats.find((s) => s.name === cat.id);
                        const isSelected = selectedCategory === cat.id;
                        const CategoryIcon = cat.icon;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                                    isSelected
                                        ? 'bg-ustp-navy text-white dark:bg-ustp-navy dark:border dark:border-ustp-gold/50'
                                        : 'bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
                                }`}
                            >
                                <CategoryIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-ustp-gold' : 'text-slate-400'}`} />
                                <span>{cat.label}</span>
                                {stat && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-ustp-gold text-ustp-navy'
                                                : 'bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
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

            {/* Equipment Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="rounded-2xl flat-card overflow-hidden animate-pulse flex flex-col"
                        >
                            <div className="h-36 bg-slate-200 dark:bg-slate-800"></div>
                            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-750 rounded w-1/3"></div>
                                    <div className="h-5 bg-slate-200 dark:bg-slate-750 rounded w-3/4"></div>
                                </div>
                                <div className="h-9 bg-slate-200 dark:bg-slate-750 rounded-xl mt-4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="p-12 text-center rounded-2xl flat-panel">
                    <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                        No equipment matches your filters
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        Try modifying search keywords, selecting a different category, or resetting your filter criteria.
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={handleResetAllFilters}
                            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-xs transition-colors"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((item) => {
                        const isAvailable = item.availability_stat === 'available';

                        return (
                            <div
                                key={item.id || item._id}
                                className="rounded-2xl flat-card overflow-hidden flex flex-col justify-between relative group hover:border-ustp-navy/30 dark:hover:border-ustp-gold/30 transition-all"
                            >
                                {/* Minimalist Geometric Category Header Accent */}
                                <div className="h-1 w-full bg-slate-200 dark:bg-slate-700/80 group-hover:bg-ustp-gold transition-colors duration-200"></div>

                                {/* Category Header Banner */}
                                <div className="px-5 py-3 bg-slate-50/70 dark:bg-[#120e2e]/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700">
                                            {item.item_code}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                            {item.category}
                                        </span>
                                    </div>

                                    {/* Standardized Status Badge */}
                                    <StatusBadge status={item.availability_stat} />
                                </div>

                                {/* Dual Visual Approach: Instantaneous SVG Vector + Optional WebP Preview */}
                                <EquipmentVisual item={item} />

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Item Title */}
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-ustp-navy dark:group-hover:text-ustp-gold transition-colors line-clamp-2 mb-2.5 font-['Outfit']">
                                            {item.name}
                                        </h3>

                                        {/* Polymorphic Specifications Preview Chips */}
                                        {item.specs && Object.keys(item.specs).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-3.5">
                                                {Object.entries(item.specs)
                                                    .slice(0, 3)
                                                    .map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
                                                        >
                                                            <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                                {String(v)}
                                                            </span>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ownership & Rate Row */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-xs mb-3">
                                            <div className="flex items-center gap-1.5">
                                                {item.owner_type === 'facility' ? (
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                        🏛️ Campus Facility
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-amber-700 dark:text-ustp-gold font-medium truncate max-w-[130px]">
                                                        🎒 P2P: {item.owner?.name || 'Student'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-bold font-mono">
                                                {item.rental_rate_hr > 0 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        ${item.rental_rate_hr.toFixed(2)}/hr
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px]">
                                                        FREE LOAN
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => onSelectSpecs(item)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                                            >
                                                <Info className="w-3.5 h-3.5 text-slate-500" />
                                                Specs
                                            </button>

                                            <button
                                                disabled={!isAvailable}
                                                onClick={() => onOpenReserve(item)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                    isAvailable
                                                        ? 'bg-ustp-navy hover:bg-ustp-navy-hover text-white shadow-ustp-navy/20'
                                                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                                                }`}
                                            >
                                                <CalendarCheck className="w-3.5 h-3.5 text-ustp-gold" />
                                                {isAvailable ? 'Reserve' : 'Locked'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
