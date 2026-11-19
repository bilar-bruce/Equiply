import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FeedbackProvider, useFeedback } from './context/FeedbackContext';
import { useEquiplyRealtime } from './hooks/useEquiplyRealtime';
import Sidebar from './components/Sidebar';
import CatalogView from './components/CatalogView';
import MyRentalsView from './components/MyRentalsView';
const CustodianDashboard = lazy(() => import('./components/CustodianDashboard'));
const AdminUsersView = lazy(() => import('./components/AdminUsersView'));
const MyListingsView = lazy(() => import('./components/MyListingsView'));
const CustodianHistoryView = lazy(() => import('./components/CustodianHistoryView'));
import SpecsModal from './components/SpecsModal';
import ReservationModal from './components/ReservationModal';
import GuestPromptModal from './components/GuestPromptModal';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import ProfileModal from './components/ProfileModal';
import LoginPage from './components/LoginPage';
import { CheckCircle2, Layers } from 'lucide-react';

function MainLayout({ onNavigateToLogin }) {
    const { user, token, isAuthenticated, isCustodian, isAdmin } = useAuth();
    const { showToast: pushFeedbackToast } = useFeedback();
    const [activeTab, setActiveTab] = useState('catalog');
    const [visitedTabs, setVisitedTabs] = useState(() => new Set(['catalog']));
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [specsItem, setSpecsItem] = useState(null);
    const [reserveItem, setReserveItem] = useState(null);
    const [guestPromptItem, setGuestPromptItem] = useState(null);
    const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
    const [catalogEvent, setCatalogEvent] = useState(null);
    const [rentalsRefreshKey, setRentalsRefreshKey] = useState(0);
    const [listingsRefreshKey, setListingsRefreshKey] = useState(0);
    const [custodianRefreshKey, setCustodianRefreshKey] = useState(0);
    const [custodianHistoryRefreshKey, setCustodianHistoryRefreshKey] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    const handleTabChange = useCallback((nextTab) => {
        setActiveTab(nextTab);
        setVisitedTabs((prev) => {
            if (prev.has(nextTab)) return prev;
            const next = new Set(prev);
            next.add(nextTab);
            return next;
        });
    }, []);

    const triggerAllViewsRefresh = useCallback(() => {
        setCatalogRefreshKey((prev) => prev + 1);
        setRentalsRefreshKey((prev) => prev + 1);
        setListingsRefreshKey((prev) => prev + 1);
        setCustodianRefreshKey((prev) => prev + 1);
        setCustodianHistoryRefreshKey((prev) => prev + 1);
    }, []);

    useEquiplyRealtime({
        user,
        token,
        isAuthenticated,
        isCustodian,
        isAdmin,
        onCatalogUpdate: useCallback((payload) => {
            setCatalogEvent({ ...(payload || {}), _ts: Date.now() });
        }, []),
        onCustodianUpdate: useCallback((payload) => {
            setCustodianHistoryRefreshKey((prev) => prev + 1);
            if (payload?.actor_id && user?.id && String(payload.actor_id) === String(user.id)) {
                return;
            }
            setCustodianRefreshKey((prev) => prev + 1);
            if (payload?.message) {
                pushFeedbackToast({
                    type: 'info',
                    title: payload.title || 'Facility Desk Update',
                    message: payload.message,
                });
            }
        }, [pushFeedbackToast, user?.id]),
        onUserUpdate: useCallback((payload) => {
            if (payload?.scope === 'rentals' || payload?.scope === 'both') {
                setRentalsRefreshKey((prev) => prev + 1);
            }
            if (payload?.scope === 'listings' || payload?.scope === 'both') {
                setListingsRefreshKey((prev) => prev + 1);
            }
            if (payload?.message) {
                pushFeedbackToast({
                    type: payload.tone || 'info',
                    title: payload.title || 'Equiply Live Update',
                    message: payload.message,
                });
            }
        }, [pushFeedbackToast]),
    });

    // Guard My Borrowings tab strictly to guests and student borrowers (staff do not borrow)
    useEffect(() => {
        if (activeTab === 'my-rentals' && isAuthenticated && user?.role !== 'student') {
            setActiveTab('catalog');
            showToast('Staff accounts do not borrow inventory. Viewing catalog.');
        }
    }, [activeTab, isAuthenticated, user]);

    // Guard Custodian Desk tab strictly to authenticated custodians
    useEffect(() => {
        if (activeTab === 'custodian' && (!isAuthenticated || !isCustodian)) {
            setActiveTab('catalog');
            showToast('Access restricted: Custodian credentials required.');
        }
    }, [activeTab, isAuthenticated, isCustodian]);

    // Guard Custodian Loan History tab strictly to authenticated custodians
    useEffect(() => {
        if (activeTab === 'custodian-history' && (!isAuthenticated || !isCustodian)) {
            setActiveTab('catalog');
            showToast('Access restricted: Custodian credentials required.');
        }
    }, [activeTab, isAuthenticated, isCustodian]);

    // Guard Account Management tab strictly to authenticated admins
    useEffect(() => {
        if (activeTab === 'admin-users' && (!isAuthenticated || !isAdmin)) {
            setActiveTab('catalog');
            showToast('Access restricted: Administrator credentials required.');
        }
    }, [activeTab, isAuthenticated, isAdmin]);

    // Guard Peer Lender My Listings tab strictly to authenticated peer lenders
    useEffect(() => {
        if (activeTab === 'my-listings' && (!isAuthenticated || !user?.is_peer_lender)) {
            setActiveTab('catalog');
            showToast('Access restricted: Peer lending privileges required.');
        }
    }, [activeTab, isAuthenticated, user]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleOpenReserve = (item) => {
        if (!isAuthenticated) {
            setGuestPromptItem(item);
            return;
        }
        setReserveItem(item);
    };

    const handleReservationSuccess = (rental) => {
        if (rental?.item_id) {
            setCatalogEvent({
                action: 'reserved',
                item_id: String(rental.item_id),
                availability_stat: 'reserved',
                _ts: Date.now(),
            });
        } else {
            setCatalogRefreshKey((prev) => prev + 1);
        }
        setRentalsRefreshKey((prev) => prev + 1);
        showToast(`Reservation [${rental.rental_code}] confirmed successfully!`);
    };

    return (
        <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-['Inter',sans-serif]">
            {/* Left-Hand Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onNavigateToLogin={onNavigateToLogin}
                onOpenProfile={() => setProfileModalOpen(true)}
            />

            {/* Main Content Area Container */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-in slide-in-from-bottom-5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Primary Route Views - Lazy-Mounted on First Visit, Persistent Thereafter */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className={activeTab === 'catalog' ? 'block' : 'hidden'}>
                        <CatalogView
                            refreshKey={catalogRefreshKey}
                            catalogEvent={catalogEvent}
                            isActive={activeTab === 'catalog'}
                            onSelectSpecs={(item) => setSpecsItem(item)}
                            onOpenReserve={handleOpenReserve}
                            onOpenAuthModal={onNavigateToLogin}
                        />
                    </div>

                    {visitedTabs.has('my-rentals') && (
                        <div className={activeTab === 'my-rentals' ? 'block' : 'hidden'}>
                            <MyRentalsView
                                refreshKey={rentalsRefreshKey}
                                isActive={activeTab === 'my-rentals'}
                                onRefreshTrigger={triggerAllViewsRefresh}
                                onNavigateToLogin={onNavigateToLogin}
                            />
                        </div>
                    )}

                    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">Loading view...</div>}>
                        {isAuthenticated && user?.is_peer_lender && visitedTabs.has('my-listings') && (
                            <div className={activeTab === 'my-listings' ? 'block' : 'hidden'}>
                                <MyListingsView
                                    refreshKey={listingsRefreshKey}
                                    isActive={activeTab === 'my-listings'}
                                />
                            </div>
                        )}

                        {isAuthenticated && isCustodian && visitedTabs.has('custodian') && (
                            <div className={activeTab === 'custodian' ? 'block' : 'hidden'}>
                                <CustodianDashboard
                                    refreshKey={custodianRefreshKey}
                                    isActive={activeTab === 'custodian'}
                                    onRefreshTrigger={triggerAllViewsRefresh}
                                />
                            </div>
                        )}

                        {isAuthenticated && isCustodian && visitedTabs.has('custodian-history') && (
                            <div className={activeTab === 'custodian-history' ? 'block' : 'hidden'}>
                                <CustodianHistoryView
                                    refreshKey={custodianHistoryRefreshKey}
                                    isActive={activeTab === 'custodian-history'}
                                />
                            </div>
                        )}

                        {isAuthenticated && isAdmin && visitedTabs.has('admin-users') && (
                            <div className={activeTab === 'admin-users' ? 'block' : 'hidden'}>
                                <AdminUsersView />
                            </div>
                        )}
                    </Suspense>
                </main>

                {/* Flat Clean University Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-[#120E2E]/60 mt-auto">
                    <div className="max-w-7xl mx-auto px-4">
                        © 2026 University of Science and Technology of Southern Philippines (USTP). All rights reserved.
                    </div>
                </footer>
            </div>

            {/* Modals */}
            {specsItem && (
                <SpecsModal
                    item={specsItem}
                    onClose={() => setSpecsItem(null)}
                    onReserve={(item) => handleOpenReserve(item)}
                />
            )}

            {reserveItem && (
                <ReservationModal
                    item={reserveItem}
                    onClose={() => setReserveItem(null)}
                    onSuccess={handleReservationSuccess}
                />
            )}

            {/* Guest Action Prompt Modal */}
            <GuestPromptModal
                isOpen={!!guestPromptItem}
                itemName={guestPromptItem?.name}
                onClose={() => setGuestPromptItem(null)}
                onNavigateToLogin={() => {
                    setGuestPromptItem(null);
                    onNavigateToLogin();
                }}
            />

            {/* First-Login Password Change Gate Modal */}
            {isAuthenticated && user?.must_change_password === true && (
                <ForcePasswordChangeModal
                    onSuccess={(msg) => showToast(msg)}
                />
            )}

            {/* Account Profile Modal */}
            <ProfileModal
                open={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
            />
        </div>
    );
}

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();
    const [isGuestMode, setIsGuestMode] = useState(false);

    // When authenticated, exit guest mode
    useEffect(() => {
        if (isAuthenticated) {
            setIsGuestMode(false);
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-canvas-light dark:bg-[#120E2E] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 font-['Inter',sans-serif]">
                <div className="w-12 h-12 rounded-2xl bg-ustp-navy dark:bg-ustp-navy-deep border border-ustp-gold/30 flex items-center justify-center shadow-lg animate-pulse mb-3">
                    <Layers className="w-6 h-6 text-ustp-gold" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Loading Equiply Campus Portal...
                </span>
            </div>
        );
    }

    // Unauthenticated visitor lands on split-screen LoginPage unless they chose Guest Mode
    if (!isAuthenticated && !isGuestMode) {
        return <LoginPage onContinueAsGuest={() => setIsGuestMode(true)} />;
    }

    return <MainLayout onNavigateToLogin={() => setIsGuestMode(false)} />;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Equiply UI Boundary Exception:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-[#120E2E] flex items-center justify-center p-6 text-slate-800 dark:text-slate-100 font-['Inter',sans-serif]">
                    <div className="max-w-md w-full p-8 bg-white dark:bg-[#1B1642] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Interface Notice</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {this.state.error?.message || 'An interface render exception occurred.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-5 py-2.5 rounded-xl bg-ustp-navy dark:bg-ustp-gold text-white dark:text-slate-950 text-xs font-bold shadow-md transition-all"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function MainApp() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <FeedbackProvider>
                        <AppContent />
                    </FeedbackProvider>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
