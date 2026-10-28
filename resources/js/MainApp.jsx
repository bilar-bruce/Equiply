import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import CatalogView from './components/CatalogView';
import CustodianDashboard from './components/CustodianDashboard';
import MyRentalsView from './components/MyRentalsView';
import SpecsModal from './components/SpecsModal';
import ReservationModal from './components/ReservationModal';
import AuthModal from './components/AuthModal';
import { CheckCircle2, Layers } from 'lucide-react';

function MainLayout() {
    const { user, isAuthenticated, isCustodian } = useAuth();
    const [activeTab, setActiveTab] = useState('catalog');
    const [specsItem, setSpecsItem] = useState(null);
    const [reserveItem, setReserveItem] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    // Guard Custodian Desk tab strictly to authenticated custodians
    useEffect(() => {
        if (activeTab === 'custodian' && (!isAuthenticated || !isCustodian)) {
            setActiveTab('catalog');
            showToast('Access restricted: Custodian credentials required.');
        }
    }, [activeTab, isAuthenticated, isCustodian]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleOpenReserve = (item) => {
        if (!isAuthenticated) {
            setAuthModalOpen(true);
            showToast('Please sign in with your USTP ID to reserve equipment.');
            return;
        }
        setReserveItem(item);
    };

    const handleReservationSuccess = (rental) => {
        setRefreshKey((prev) => prev + 1);
        showToast(`Reservation [${rental.rental_code}] created with ACID transaction lock!`);
    };

    return (
        <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-['Inter',sans-serif]">
            {/* Left-Hand Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenAuthModal={() => setAuthModalOpen(true)}
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

                {/* Primary Route Views - Persistent Views with CSS Display for 0ms Tab Switching */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className={activeTab === 'catalog' ? 'block' : 'hidden'}>
                        <CatalogView
                            refreshKey={refreshKey}
                            onSelectSpecs={(item) => setSpecsItem(item)}
                            onOpenReserve={handleOpenReserve}
                            onOpenAuthModal={() => setAuthModalOpen(true)}
                        />
                    </div>

                    <div className={activeTab === 'my-rentals' ? 'block' : 'hidden'}>
                        <MyRentalsView
                            refreshKey={refreshKey}
                            onRefreshTrigger={() => setRefreshKey((prev) => prev + 1)}
                            onOpenAuthModal={() => setAuthModalOpen(true)}
                        />
                    </div>

                    {isAuthenticated && isCustodian && (
                        <div className={activeTab === 'custodian' ? 'block' : 'hidden'}>
                            <CustodianDashboard
                                refreshKey={refreshKey}
                                onRefreshTrigger={() => setRefreshKey((prev) => prev + 1)}
                            />
                        </div>
                    )}
                </main>

                {/* Flat Clean Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800/80 py-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#120E2E]/60 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-ustp-gold" />
                            <span className="font-bold text-ustp-navy dark:text-slate-200">Equiply USTP Nexus</span>
                            <span className="text-slate-400">• Laravel 12 + MongoDB Atlas Replica Set</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Sanctum Token Auth • ACID Multi-Document Transactions • P2P Campus Lending
                        </div>
                    </div>
                </footer>
            </div>

            {/* Modals */}
            {specsItem && (
                <SpecsModal
                    item={specsItem}
                    onClose={() => setSpecsItem(null)}
                    onReserve={(item) => setReserveItem(item)}
                />
            )}

            {reserveItem && (
                <ReservationModal
                    item={reserveItem}
                    onClose={() => setReserveItem(null)}
                    onSuccess={handleReservationSuccess}
                />
            )}

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
            />
        </div>
    );
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
            <ThemeProvider>
                <AuthProvider>
                    <MainLayout />
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
