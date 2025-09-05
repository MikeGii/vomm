import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import NewCarsTab from '../components/carMarketplace/NewCarsTab';
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
                return (
                    <div className="tab-placeholder">
                        <h2>Kasutatud autod</h2>
                        <p>Siin saad osta kasutatud autosid teistelt mängijatelt.</p>
                    </div>
                );
            case 'new':
                return <NewCarsTab />;
            case 'parts':
                return (
                    <div className="tab-placeholder">
                        <h2>Varuosad</h2>
                        <p>Osta ja müü autovaruosi.</p>
                    </div>
                );
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