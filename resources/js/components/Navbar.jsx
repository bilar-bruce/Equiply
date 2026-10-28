import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import {
    Layers,
    Clock,
    ShieldCheck,
    UserCheck,
    LogOut,
    LogIn,
    ChevronDown,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuthModal }) {
    const { user, isAuthenticated, logout, switchPersona, isCustodian } = useAuth();
    const [personaOpen, setPersonaOpen] = useState(false);
    const [switching, setSwitching] = useState(false);

    const handleSwitch = async (key) => {
        setSwitching(true);
        try {
            await switchPersona(key);
            setPersonaOpen(false);
        } finally {
            setSwitching(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
                            <div className="w-full h-full bg-slate-950/90 rounded-[11px] flex items-center justify-center">
                                <Layers className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                                    Equip<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">ly</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Atlas ACID Live
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 tracking-wide font-medium hidden sm:block">
                                Campus Inventory & P2P Gear Lending
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'catalog'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            Gear Catalog
                        </button>

                        <button
                            onClick={() => setActiveTab('my-rentals')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'my-rentals'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            My Borrowings
                        </button>

                        <button
                            onClick={() => setActiveTab('custodian')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'custodian'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            } ${isCustodian ? 'border border-indigo-400/30' : ''}`}
                        >
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            Custodian Desk
                            {isCustodian && (
                                <span className="ml-1 px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[10px] rounded font-bold">
                                    STAFF
                                </span>
                            )}
                        </button>
                    </nav>

                    {/* Persona Switcher & Auth */}
                    <div className="flex items-center gap-3">
                        {/* Quick Persona Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setPersonaOpen(!personaOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs font-medium text-slate-200 transition-all shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline text-slate-400">Switch Persona:</span>
                                <span className="font-semibold text-white truncate max-w-[110px] sm:max-w-none">
                                    {user?.name || 'Guest'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {personaOpen && (
                                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                                        <p className="text-xs font-semibold text-slate-300">1-Click Role Switcher</p>
                                        <p className="text-[11px] text-slate-500">Test different user permissions & workflows</p>
                                    </div>
                                    <div className="space-y-1">
                                        {DEMO_PERSONAS.map((p) => {
                                            const isActive = user?.email === p.login;
                                            return (
                                                <button
                                                    key={p.key}
                                                    disabled={switching}
                                                    onClick={() => handleSwitch(p.key)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all ${
                                                        isActive
                                                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-white'
                                                            : 'hover:bg-white/5 text-slate-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-1.5">
                                                            {p.title}
                                                            {isActive && (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {p.badge} • ID: {p.id_number}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                                        {p.role}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {isAuthenticated ? (
                            <button
                                onClick={logout}
                                title="Sign out"
                                className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onOpenAuthModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation Row */}
                <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
                            activeTab === 'catalog' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Catalog
                    </button>
                    <button
                        onClick={() => setActiveTab('my-rentals')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
                            activeTab === 'my-rentals' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        My Gear
                    </button>
                    <button
                        onClick={() => setActiveTab('custodian')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
                            activeTab === 'custodian' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Custodian Desk
                    </button>
                </div>
            </div>
        </header>
    );
}
