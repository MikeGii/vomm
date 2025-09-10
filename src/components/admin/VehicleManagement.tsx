// src/components/admin/VehicleManagement.tsx
import React, { useState } from 'react';
import { TabNavigation } from '../ui/TabNavigation';
import { BrandsModelsTab } from './vehicle-management/BrandsModelsTab';
import { EnginesTab } from './vehicle-management/EnginesTab';
import '../../styles/components/admin/VehicleManagement.css';

export const VehicleManagement: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<string>('brands');

    const subTabs = [
        { id: 'brands', label: 'Margid & Mudelid' },
        { id: 'engines', label: 'Mootorid' }
    ];

    return (
        <div className="vehicle-management">
            <div className="vehicle-management-header">
                <h2>Sõidukite Haldus</h2>
                <p>Halda autode margid, mudeleid ja mootoreid</p>
            </div>

            <TabNavigation
                tabs={subTabs}
                activeTab={activeSubTab}
                onTabChange={setActiveSubTab}
            />

            <div className="vehicle-management-content">
                {activeSubTab === 'brands' && <BrandsModelsTab />}
                {activeSubTab === 'engines' && <EnginesTab />}
            </div>
        </div>
    );
};