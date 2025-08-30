// src/pages/RealEstatePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useEstate } from '../contexts/EstateContext';
import { useToast } from '../contexts/ToastContext';
import { BuyEstateTab } from '../components/estate/BuyEstateTab';
import { OwnedEstateTab } from '../components/estate/OwnedEstateTab';
import '../styles/pages/RealEstate.css';

const REAL_ESTATE_TABS = [
    { id: 'owned', label: 'Minu kinnisvara', icon: '🏠' },
    { id: 'garage', label: 'Garaaž', icon: '🚗' },
    { id: 'buy', label: 'Osta kinnisvara', icon: '🏪' }
];

const RealEstatePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading: statsLoading } = usePlayerStats();
    const { playerEstate, loading: estateLoading, hasWorkshop, canUse3DPrinter, canUseLaserCutter } = useEstate();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('owned');

    // Level 60 requirement check
    const canAccessRealEstate = (playerStats?.level || 0) >= 60;
    const isTabDisabled = !canAccessRealEstate;

    // Garage tab availability
    const hasGarageAccess = playerEstate?.currentEstate?.hasGarage || false;

    if (statsLoading || estateLoading) {
        return (
            <div className="real-estate-page">
                <AuthenticatedHeader />
                <main className="real-estate-content">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Laen kinnisvaraandmeid...</p>
                    </div>
                </main>
            </div>
        );
    }

    const availableTabs = REAL_ESTATE_TABS.filter(tab => {
        if (tab.id === 'garage' && !hasGarageAccess) return false;
        return true;
    });

    return (
        <div className="real-estate-page">
            <AuthenticatedHeader />
            <main className="real-estate-content">
                <div className="page-header">
                    <h1 className="page-title">🏠 Kinnisvara</h1>
                    {!canAccessRealEstate && (
                        <div className="level-requirement-notice">
                            <p>📈 Kinnisvara avaldub tasemelt 60</p>
                            <p>Praegune tase: {playerStats?.level || 0}/60</p>
                        </div>
                    )}
                </div>

                <TabNavigation
                    tabs={availableTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="tab-content">
                    <div className="tab-content">
                        {activeTab === 'owned' && <OwnedEstateTab />}
                        {activeTab === 'garage' && <div>Garage Component</div>}
                        {activeTab === 'buy' && <BuyEstateTab />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RealEstatePage;