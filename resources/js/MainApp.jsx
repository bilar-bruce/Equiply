import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CatalogView from './components/CatalogView';
import CustodianDashboard from './components/CustodianDashboard';
import MyRentalsView from './components/MyRentalsView';
import SpecsModal from './components/SpecsModal';
import ReservationModal from './components/ReservationModal';
import AuthModal from './components/AuthModal';
import { CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';

function MainLayout() {
    const { user, isCustodian } = useAuth();
    const [activeTab, setActiveTab] = useState('catalog');
    const [specsItem, setSpecsItem] = useState(null);
    const [reserveItem, setReserveItem] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleReservationSuccess = (rental) => {
        setRefreshKey((prev) => prev + 1);
        showToast(`Reservation [${rental.rental_code}] created with ACID transaction lock!`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
            {/* Navbar */}
            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenAuthModal={() => setAuthModalOpen(true)}
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl text-xs font-semibold text-emerald-300 animate-in slide-in-from-bottom-5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'catalog' && (
                    <CatalogView
                        refreshKey={refreshKey}
                        onSelectSpecs={(item) => setSpecsItem(item)}
                        onOpenReserve={(item) => setReserveItem(item)}
                    />
                )}

                {activeTab === 'my-rentals' && (
                    <MyRentalsView
                        onRefreshTrigger={() => setRefreshKey((prev) => prev + 1)}
                    />
                )}

                {activeTab === 'custodian' && (
                    <CustodianDashboard
                        onRefreshTrigger={() => setRefreshKey((prev) => prev + 1)}
                    />
                )}
            </main>

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

            {/* Footer */}
            <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500 glass-panel mt-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-slate-300">Equiply Engine</span>
                        <span>• Laravel 12 + MongoDB Atlas Replica Set</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Sanctum Token Auth • ACID Multi-Document Transactions • Verified P2P Lending
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function MainApp() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}
