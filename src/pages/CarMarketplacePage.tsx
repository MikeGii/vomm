// src/pages/CarMarketplacePage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import NewCarsTab from '../components/carMarketplace/NewCarsTab';
import UsedCarsTab from '../components/carMarketplace/UsedCarsTab';
import SparePartsTab from '../components/carMarketplace/SparePartsTab';
import '../styles/pages/CarMarketplace.css';

const CarMarketplacePage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('used');

    const tabs = [
        { id: 'used', label: 'Kasutatud autod' },
        { id: 'new', label: 'Uued autod' },
        { id: 'parts', label: 'Varuosad' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'used':
                return <UsedCarsTab />;
            case 'new':
                return <NewCarsTab />;
            case 'parts':
                return <SparePartsTab />;
            default:
                return null;
        }
    };

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="car-marketplace-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="car-marketplace-title">Autode turg</h1>

                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="tab-content">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default CarMarketplacePage;