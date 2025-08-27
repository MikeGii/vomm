// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { AccountDeletion } from '../components/settings/AccountDeletion';
import '../styles/pages/SettingsPage.css';

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Üldised seaded' },
        { id: 'deletion', label: 'Konto kustutamine' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'deletion':
                return <AccountDeletion />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="settings-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="settings-title">Kasutaja seaded</h1>

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

export default SettingsPage;