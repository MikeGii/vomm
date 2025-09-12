// src/components/admin/EstateManagement.tsx
import React, { useState } from 'react';
import { TabNavigation } from '../ui/TabNavigation';
import { EstatesTab } from './estate-management/EstatesTab';
import { EstateStatisticsTab } from './estate-management/EstateStatisticsTab';
import '../../styles/components/admin/EstateManagement.css';

export const EstateManagement: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<string>('estates');

    const subTabs = [
        { id: 'estates', label: 'Kinnisvarad' },
        { id: 'statistics', label: 'Statistika' }
    ];

    return (
        <div className="estate-mgmt">
            <div className="estate-mgmt__header">
                <h2>Kinnisvarade Haldus</h2>
                <p>Halda kinnisvarasid, hindu ja omadusi</p>
            </div>

            <TabNavigation
                tabs={subTabs}
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
            />

            <div className="estate-mgmt__content">
                {activeSubTab === 'estates' && <EstatesTab />}
                {activeSubTab === 'statistics' && <EstateStatisticsTab />}
            </div>
        </div>
    );
};