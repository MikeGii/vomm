// src/pages/RealEstatePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useEstate } from '../contexts/EstateContext';
import { BuyEstateTab } from '../components/estate/BuyEstateTab';
import { OwnedEstateTab } from '../components/estate/OwnedEstateTab';
import { GarageTab } from '../components/estate/GarageTab';
import '../styles/pages/RealEstate.css';

const REAL_ESTATE_TABS = [
    { id: 'owned', label: 'Minu kinnisvara', icon: '🏠' },
    { id: 'garage', label: 'Garaaž', icon: '🚗' },
    { id: 'buy', label: 'Osta kinnisvara', icon: '🏪' }
];

const RealEstatePage: React.FC = () => {
    const navigate = useNavigate();
    const { playerStats, loading: statsLoading } = usePlayerStats();
    const { loading: estateLoading } = useEstate();

    const [activeTab, setActiveTab] = useState('owned');

    // Level 60 requirement check
    const canAccessRealEstate = (playerStats?.level || 0) >= 60;

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

    const availableTabs = REAL_ESTATE_TABS;

    return (
        <div className="real-estate-page">
            <AuthenticatedHeader />
            <main className="real-estate-content">

                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>
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
                    {activeTab === 'owned' && <OwnedEstateTab />}
                    {activeTab === 'garage' && <GarageTab />}
                    {activeTab === 'buy' && <BuyEstateTab />}
                </div>
            </main>
        </div>
    );
};

export default RealEstatePage;