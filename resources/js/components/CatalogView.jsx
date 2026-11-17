import React, { useState, useEffect, useRef, useId } from 'react';
import { itemsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPHP } from '../utils/currency';
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
    Tag,
    Building2,
    Users,
    Clock,
    RotateCcw
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

// Optional WebP Photo Banner (only rendered when an item has an image URL that loads)
function EquipmentPhotoBanner({ item, IconComponent }) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const imageUrl = item.image_url || item.image || null;

    if (!imageUrl || imgError) {
        return null;
    }

    return (
        <div className="relative w-full aspect-[16/7] bg-slate-100 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800 overflow-hidden">
            {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-ustp-navy/40 dark:text-ustp-gold/40">
                    <IconComponent className="w-8 h-8 stroke-[1.5]" aria-hidden="true" />
                </div>
            )}
            <img
                src={imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width="400"
                height="175"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`block w-full h-full object-cover transition-opacity duration-300 ${
                    imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
            />
        </div>
    );
}

// Standardized Status Badge
function StatusBadge({ status }) {
    if (status === 'available') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                Available
            </span>
        );
    }
    if (status === 'reserved') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                Reserved
            </span>
        );
    }
    if (status === 'rented') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                In Use
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true"></span>
            Maintenance
        </span>
    );
}

export default function CatalogView({ onSelectSpecs, onOpenReserve, refreshKey }) {
    const { user, isAuthenticated, isCustodian, isAdmin } = useAuth();
    const isStaff = isCustodian || isAdmin;
    const [items, setItems] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [categoryMeta, setCategoryMeta] = useState({ total_all: 0, total_available: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAvailability, setSelectedAvailability] = useState('all');
    const [selectedOwnerType, setSelectedOwnerType] = useState('all');
    const searchInputRef = useRef(null);
    const searchId = useId();
    const availabilityId = useId();
    const ownershipId = useId();

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

    const fetchCatalog = () => {
        fetchCategories();
        fetchItems(true);
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

    const getUnavailableState = (status) => {
        if (status === 'rented') return { label: 'In Use', Icon: Clock };
        if (status === 'reserved') return { label: 'Reserved', Icon: Clock };
        return { label: 'Maintenance', Icon: Wrench };
    };

    return (
        <div className="space-y-5">
            {/* Compact Filter Bar / Controls */}
            <section aria-label="Catalog filters" className="p-4 sm:p-5 rounded-2xl flat-panel relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-ustp-navy dark:text-white tracking-tight font-['Outfit']">
                            Campus Gear & Peer-to-Peer Inventory
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-ustp-gold border border-amber-500/25 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                            >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                Reset
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={fetchCatalog}
                            aria-label="Sync equipment catalog"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                            Live Sync
                        </button>
                    </div>
                </div>

                {/* Search & Select Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6 relative">
                        <label htmlFor={searchId} className="sr-only">
                            Search equipment by name, serial code, or tag
                        </label>
                        <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                        <input
                            id={searchId}
                            ref={searchInputRef}
                            type="search"
                            placeholder="Search gear name, serial code, or tags (e.g. 'Lab Coat', 'fx-991CW')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-12 py-2 rounded-xl text-xs flat-input"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    aria-label="Clear search query"
                                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                >
                                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xs">
                                    /
                                </kbd>
                            )}
                        </div>
                    </div>

                    {/* Availability Filter */}
                    <div className="sm:col-span-3">
                        <label htmlFor={availabilityId} className="sr-only">
                            Filter by availability state
                        </label>
                        <select
                            id={availabilityId}
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input font-medium"
                        >
                            <option value="all">All Availability States</option>
                            <option value="available">Available Only</option>
                            <option value="reserved">Reserved</option>
                            <option value="rented">In Use / Rented</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>

                    {/* Ownership Filter */}
                    <div className="sm:col-span-3">
                        <label htmlFor={ownershipId} className="sr-only">
                            Filter by ownership type
                        </label>
                        <select
                            id={ownershipId}
                            value={selectedOwnerType}
                            onChange={(e) => setSelectedOwnerType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs flat-input font-medium"
                        >
                            <option value="all">All Ownership Types</option>
                            <option value="facility">Campus Facility Only</option>
                            <option value="student">Student P2P Only</option>
                        </select>
                    </div>
                </div>

                {/* Category Pill Filters */}
                <div
                    role="group"
                    aria-label="Equipment categories"
                    className="flex flex-wrap items-center gap-2 pt-3"
                >
                    {categoriesList.map((cat) => {
                        const stat = cat.id === 'all'
                            ? { available_items: categoryMeta.total_available, total_items: categoryMeta.total_all }
                            : categoryStats.find((s) => s.name === cat.id);
                        const isSelected = selectedCategory === cat.id;
                        const CategoryIcon = cat.icon;

                        return (
                            <button
                                type="button"
                                key={cat.id}
                                aria-pressed={isSelected}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold ${
                                    isSelected
                                        ? 'bg-ustp-navy text-white dark:bg-ustp-gold dark:text-ustp-navy-deep border border-ustp-navy dark:border-ustp-gold'
                                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <CategoryIcon
                                    className={`w-3.5 h-3.5 ${
                                        isSelected
                                            ? 'text-ustp-gold dark:text-ustp-navy-deep'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                    aria-hidden="true"
                                />
                                <span>{cat.label}</span>
                                {stat && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-ustp-gold text-ustp-navy-deep dark:bg-ustp-navy-deep dark:text-ustp-gold'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                        }`}
                                    >
                                        {stat.available_items}/{stat.total_items}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Equipment Grid */}
            {loading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="rounded-2xl flat-card overflow-hidden animate-pulse p-4 space-y-3 flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                            </div>
                            <div className="flex items-start gap-3 pt-1">
                                <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-xl mt-2"></div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="p-10 text-center rounded-2xl flat-panel">
                    <Layers className="w-10 h-10 text-slate-500 dark:text-slate-400 mx-auto mb-3" aria-hidden="true" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                        No equipment matches your filters
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
                        Try modifying search keywords, selecting a different category, or resetting your filter criteria.
                    </p>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-ustp-navy hover:bg-ustp-navy-hover dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover text-white dark:text-ustp-navy-deep shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : (
                <section aria-label="Equipment inventory" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4">
                    {items.map((item) => {
                        const isAvailable = item.availability_stat === 'available';
                        const isOwner =
                            isAuthenticated &&
                            user &&
                            item.owner_type === 'student' &&
                            String(item.owner_user_id) === String(user._id || user.id);
                        const IconComponent = getItemVectorIcon(item);
                        const unavailableState = getUnavailableState(item.availability_stat);
                        const UnavailableIcon = unavailableState.Icon;

                        return (
                            <article
                                key={item.id || item._id}
                                className="rounded-2xl flat-card overflow-hidden flex flex-col justify-between relative group hover:border-ustp-navy/35 dark:hover:border-ustp-gold/45 transition-all"
                            >
                                {/* Top Accent & Optional Photo Banner */}
                                <div>
                                    <div
                                        className={`h-1 w-full transition-colors duration-200 ${
                                            isAvailable
                                                ? 'bg-emerald-500/70 group-hover:bg-ustp-gold'
                                                : 'bg-slate-200 dark:bg-slate-700/80 group-hover:bg-ustp-gold/70'
                                        }`}
                                    ></div>

                                    <EquipmentPhotoBanner item={item} IconComponent={IconComponent} />

                                    {/* Metadata Top Strip */}
                                    <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-[#120e2e]/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-ustp-navy dark:text-ustp-gold border border-slate-200 dark:border-slate-700 shrink-0">
                                                {item.item_code}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                                {item.category}
                                            </span>
                                        </div>

                                        <StatusBadge status={item.availability_stat} />
                                    </div>
                                </div>

                                {/* Compact Card Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between gap-3.5">
                                    <div className="space-y-3">
                                        {/* Icon Emblem + Title */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-ustp-navy dark:text-ustp-gold shrink-0 group-hover:border-ustp-navy/30 dark:group-hover:border-ustp-gold/40 transition-colors">
                                                <IconComponent className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="font-bold text-base leading-snug text-slate-900 dark:text-white group-hover:text-ustp-navy dark:group-hover:text-ustp-gold transition-colors line-clamp-2 font-['Outfit']">
                                                    {item.name}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Polymorphic Specifications Preview Chips */}
                                        {item.specs && Object.keys(item.specs).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(item.specs)
                                                    .slice(0, 3)
                                                    .map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/90 max-w-full truncate"
                                                        >
                                                            <span className="text-slate-500 dark:text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                                {String(v)}
                                                            </span>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ownership, Rate & Actions Footer */}
                                    <footer className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-xs mb-3 gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {item.owner_type === 'facility' ? (
                                                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-1 truncate">
                                                        <Building2 className="w-3.5 h-3.5 text-ustp-navy dark:text-ustp-gold shrink-0" aria-hidden="true" />
                                                        Campus Facility
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-amber-800 dark:text-ustp-gold font-medium truncate inline-flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5 text-amber-700 dark:text-ustp-gold shrink-0" aria-hidden="true" />
                                                        P2P: {item.owner?.name || 'Student'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-bold font-mono shrink-0">
                                                <span className="text-emerald-700 dark:text-emerald-400">
                                                    {formatPHP(item.rental_rate_flat ?? item.rental_rate_hr ?? 30)}
                                                </span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-0.5">flat</span>
                                            </div>
                                        </div>

                                        {/* Card Actions */}
                                        {isStaff ? (
                                            <button
                                                type="button"
                                                onClick={() => onSelectSpecs(item)}
                                                aria-label={`View Specs & Details for ${item.name}`}
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                            >
                                                <Info className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                                                View Specs & Details
                                            </button>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectSpecs(item)}
                                                    aria-label={`Specs for ${item.name}`}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                                                >
                                                    <Info className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                                                    Specs
                                                </button>

                                                {isOwner ? (
                                                    <div
                                                        title="You own this equipment listing"
                                                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-ustp-gold border border-amber-500/30 select-none text-center"
                                                    >
                                                        <Tag className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-ustp-gold" aria-hidden="true" />
                                                        <span className="truncate">Your Listing</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={!isAvailable}
                                                        onClick={() => onOpenReserve(item)}
                                                        aria-label={isAvailable ? `Reserve ${item.name}` : `${item.name} is ${unavailableState.label}`}
                                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold ${
                                                            isAvailable
                                                                ? 'bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep shadow-ustp-navy/20'
                                                                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700/80'
                                                        }`}
                                                    >
                                                        {isAvailable ? (
                                                            <>
                                                                <CalendarCheck className="w-3.5 h-3.5 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                                                                Reserve
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UnavailableIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                                                {unavailableState.label}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </footer>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
