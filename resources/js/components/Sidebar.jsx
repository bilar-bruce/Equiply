import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Layers,
    Clock,
    ShieldCheck,
    LogOut,
    LogIn,
    Sun,
    Moon,
    Menu,
    X,
    Package
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAuthModal }) {
    const { user, isAuthenticated, logout, isCustodian } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        setMobileOpen(false);
    };

    // Navigation items: Custodian Desk is strictly restricted to authenticated staff (custodian/admin)
    const navItems = [
        {
            id: 'catalog',
            label: 'Gear Catalog',
            icon: Package,
            badge: null,
            desc: 'Campus & P2P Gear',
        },
        {
            id: 'my-rentals',
            label: 'My Borrowings',
            icon: Clock,
            badge: null,
            desc: 'Active loans & history',
        },
        ...(isAuthenticated && isCustodian
            ? [
                  {
                      id: 'custodian',
                      label: 'Custodian Desk',
                      icon: ShieldCheck,
                      badge: 'STAFF',
                      desc: 'Check-in & returns',
                  },
              ]
            : []),
    ];

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return 'GU';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const sidebarContent = (
        <div className="h-full flex flex-col justify-between p-4 sm:p-5">
            {/* Top Brand & Navigation Section */}
            <div className="space-y-6">
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleNavClick('catalog')}
                    >
                        {/* USTP Navy & Amber Brand Icon */}
                        <div className="w-10 h-10 rounded-xl bg-ustp-navy dark:bg-ustp-navy-deep border border-ustp-navy/30 dark:border-ustp-gold/30 flex items-center justify-center shadow-sm">
                            <Layers className="w-5 h-5 text-ustp-gold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xl tracking-tight text-ustp-navy dark:text-white font-['Outfit']">
                                    Equip<span className="text-ustp-gold">ly</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-ustp-gold border border-amber-500/20">
                                    USTP
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                Campus Equipment Nexus
                            </p>
                        </div>
                    </div>

                    {/* Mobile Drawer Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* System Status Flat Pill */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Atlas ACID Engine</span>
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ONLINE
                    </span>
                </div>

                {/* Navigation Links */}
                <div>
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Main Navigation
                    </p>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-ustp-navy text-white shadow-sm dark:bg-ustp-navy dark:border dark:border-ustp-gold/30'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-ustp-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <IconComponent
                                            className={`w-4 h-4 shrink-0 ${
                                                isActive
                                                    ? 'text-ustp-gold'
                                                    : 'text-slate-400 dark:text-slate-400 group-hover:text-ustp-navy'
                                            }`}
                                        />
                                        <div className="text-left">
                                            <div>{item.label}</div>
                                            <div
                                                className={`text-[10px] font-normal ${
                                                    isActive
                                                        ? 'text-slate-300'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                }`}
                                            >
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>

                                    {item.badge && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                isActive
                                                    ? 'bg-ustp-gold text-ustp-navy'
                                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-ustp-gold border border-amber-300 dark:border-amber-700/50'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Bottom Controls: Dark Mode Toggle & Account Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* Dark Mode Flat Toggle */}
                <div className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
                    <button
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            !isDark
                                ? 'bg-white text-ustp-navy shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                        aria-pressed={!isDark}
                    >
                        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-ustp-gold' : ''}`} />
                        <span>Light</span>
                    </button>
                    <button
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isDark
                                ? 'bg-ustp-navy text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                        aria-pressed={isDark}
                    >
                        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-ustp-gold' : ''}`} />
                        <span>Dark</span>
                    </button>
                </div>

                {/* User Account Summary & Logout */}
                {isAuthenticated ? (
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-ustp-navy text-ustp-gold font-bold text-xs flex items-center justify-center shrink-0 border border-ustp-navy-light dark:border-ustp-gold/30">
                                {getInitials(user?.name)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {user?.name}
                                    </p>
                                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                                        {user?.role}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                                    {user?.id_number || user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={logout}
                            title="Sign out of Equiply"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
                            aria-label="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                                Guest Visitor
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                Sign in to borrow and reserve equipment
                            </span>
                        </div>
                        <button
                            onClick={onOpenAuthModal}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ustp-navy hover:bg-ustp-navy-hover text-white text-xs font-bold shadow-xs transition-colors"
                        >
                            <LogIn className="w-4 h-4 text-ustp-gold" />
                            Sign In / Register
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Top Bar for Mobile & Tablet (< lg) */}
            <header className="lg:hidden sticky top-0 z-30 w-full bg-white dark:bg-[#120E2E] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5" onClick={() => handleNavClick('catalog')}>
                    <div className="w-8 h-8 rounded-lg bg-ustp-navy flex items-center justify-center shadow-xs">
                        <Layers className="w-4 h-4 text-ustp-gold" />
                    </div>
                    <div>
                        <span className="font-extrabold text-lg tracking-tight text-ustp-navy dark:text-white font-['Outfit']">
                            Equip<span className="text-ustp-gold">ly</span>
                        </span>
                        <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-ustp-gold border border-amber-500/20">
                            USTP
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Quick Dark Mode Toggle on Mobile */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? <Sun className="w-4 h-4 text-ustp-gold" /> : <Moon className="w-4 h-4 text-ustp-navy" />}
                    </button>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Mobile Slide-Over Drawer Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Drawer Content */}
                    <aside className="relative z-50 w-72 max-w-[80vw] h-full bg-white dark:bg-[#120E2E] shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Desktop Left-Hand Persistent Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-white dark:bg-[#120E2E] border-r border-slate-200 dark:border-slate-800/80 shrink-0 z-20">
                {sidebarContent}
            </aside>
        </>
    );
}
