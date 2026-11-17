import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Layers,
    Clock,
    ShieldCheck,
    Users,
    LogOut,
    LogIn,
    Sun,
    Moon,
    Menu,
    X,
    Package,
    Tag,
    History
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onNavigateToLogin, onOpenAuthModal, onOpenProfile }) {
    const { user, isAuthenticated, logout, isCustodian, isAdmin } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLoginClick = onNavigateToLogin || onOpenAuthModal;

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        setMobileOpen(false);
    };

    // Navigation items:
    // - Gear Catalog: visible to all
    // - My Borrowings: visible to unauthenticated guests and verified students only
    // - My Listings: visible to authenticated peer lenders only
    // - Custodian Desk: visible to authenticated custodians only
    // - Loan History: visible to authenticated custodians only
    // - Account Management: visible to authenticated admins only
    const navItems = [
        {
            id: 'catalog',
            label: 'Gear Catalog',
            icon: Package,
            badge: null,
            desc: 'Campus & P2P Gear',
        },
        ...(!isAuthenticated || user?.role === 'student'
            ? [
                  {
                      id: 'my-rentals',
                      label: 'My Borrowings',
                      icon: Clock,
                      badge: null,
                      desc: 'Active loans & history',
                  },
              ]
            : []),
        ...(isAuthenticated && user?.is_peer_lender
            ? [
                  {
                      id: 'my-listings',
                      label: 'My Listings',
                      icon: Tag,
                      badge: 'LENDER',
                      desc: 'Peer gear & earnings',
                  },
              ]
            : []),
        ...(isAuthenticated && isCustodian
            ? [
                  {
                      id: 'custodian',
                      label: 'Custodian Desk',
                      icon: ShieldCheck,
                      badge: 'STAFF',
                      desc: 'Check-in & returns',
                  },
                  {
                      id: 'custodian-history',
                      label: 'Loan History',
                      icon: History,
                      badge: 'RECORDS',
                      desc: 'Archived loans & audit logs',
                  },
              ]
            : []),
        ...(isAuthenticated && isAdmin
            ? [
                  {
                      id: 'admin-users',
                      label: 'Account Management',
                      icon: Users,
                      badge: 'ADMIN',
                      desc: 'Student & staff provisioning',
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
                                Campus Equipment Portal
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

                {/* Navigation Links */}
                <nav aria-label="Main" className="space-y-1">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold ${
                                    isActive
                                        ? 'bg-ustp-navy text-white shadow-sm dark:bg-[#1E184D] dark:border dark:border-ustp-gold/60'
                                        : 'text-slate-700 dark:text-slate-200 hover:text-ustp-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <IconComponent
                                        aria-hidden="true"
                                        className={`w-4 h-4 shrink-0 ${
                                            isActive
                                                ? 'text-ustp-gold'
                                                : 'text-slate-500 dark:text-slate-400 group-hover:text-ustp-navy'
                                        }`}
                                    />
                                    <span className="truncate">{item.label}</span>
                                </div>

                                {item.badge && (
                                    <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                            isActive
                                                ? 'bg-ustp-gold text-ustp-navy-deep'
                                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-ustp-gold border border-amber-300 dark:border-amber-700/50'
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

            {/* Bottom Controls: Dark Mode Toggle & Account Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* Dark Mode Flat Toggle (Authenticated users only) */}
                {isAuthenticated && (
                    <div role="group" aria-label="Color theme" className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center">
                        <button
                            type="button"
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold ${
                                !isDark
                                    ? 'bg-white text-ustp-navy shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            aria-pressed={!isDark}
                        >
                            <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-ustp-gold' : ''}`} aria-hidden="true" />
                            <span>Light</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold ${
                                isDark
                                    ? 'bg-[#1E184D] text-white border border-ustp-gold/40 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                            }`}
                            aria-pressed={isDark}
                        >
                            <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-ustp-gold' : ''}`} aria-hidden="true" />
                            <span>Dark</span>
                        </button>
                    </div>
                )}

                {/* User Account Summary & Logout */}
                {isAuthenticated ? (
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
                        <button
                            type="button"
                            onClick={onOpenProfile}
                            title="View Campus Account Profile"
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-xl p-0.5 hover:opacity-85 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-ustp-navy text-ustp-gold font-bold text-xs flex items-center justify-center shrink-0 border border-ustp-navy-light dark:border-ustp-gold/30" aria-hidden="true">
                                {getInitials(user?.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {user?.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                                        {user?.role}
                                    </span>
                                    <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                                        {user?.id_number || user?.email}
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Sign Out Button */}
                        <button
                            type="button"
                            onClick={logout}
                            title="Sign out of Equiply"
                            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                            aria-label="Sign out"
                        >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                                Guest Visitor
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Sign in to borrow and reserve equipment
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoginClick}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ustp-navy hover:bg-ustp-navy-hover text-white dark:bg-ustp-gold dark:hover:bg-ustp-gold-hover dark:text-ustp-navy-deep text-xs font-bold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                        >
                            <LogIn className="w-4 h-4 text-ustp-gold dark:text-ustp-navy-deep" aria-hidden="true" />
                            Sign In to Portal
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
                    {/* Quick Dark Mode Toggle on Mobile (Authenticated users only) */}
                    {isAuthenticated && (
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ustp-navy dark:focus-visible:outline-ustp-gold"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun className="w-4 h-4 text-ustp-gold" aria-hidden="true" /> : <Moon className="w-4 h-4 text-ustp-navy" aria-hidden="true" />}
                        </button>
                    )}

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
