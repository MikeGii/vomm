// src/components/department/DepartmentTabs.tsx
import React, { useState } from 'react';
import { PlayerStats } from '../../types';
import { TabNavigation } from '../ui/TabNavigation';
import { PlayerInfoTab } from './tabs/PlayerInfoTab';
import { VacantPositionsTab } from './tabs/VacantPositionsTab';
import { ApplicationsTab } from './tabs/ApplicationsTab';
import { MyApplicationsTab } from './tabs/MyApplicationsTab';
import { isGroupLeader } from '../../utils/playerStatus';
import '../../styles/components/department/DepartmentTabs.css';

interface DepartmentTabsProps {
    currentPlayerStats: PlayerStats;
    onPlayerStatsUpdate?: () => Promise<void>;
}

export const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
                                                                  currentPlayerStats,
                                                                  onPlayerStatsUpdate
                                                              }) => {
    const [activeTab, setActiveTab] = useState<string>('player-info');

    // Define tabs based on player's position
    const getTabs = () => {
        const baseTabs = [
            { id: 'player-info', label: 'Minu andmed' },
            { id: 'vacant-positions', label: 'Vabad ametikohad' },
            { id: 'my-applications', label: 'Minu avaldused' }
        ];

        // Add Applications tab only for group leaders
        if (isGroupLeader(currentPlayerStats)) {
            baseTabs.splice(2, 0, { id: 'applications', label: 'Avaldused' });
        }

        return baseTabs;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'player-info':
                return <PlayerInfoTab playerStats={currentPlayerStats} />;
            case 'vacant-positions':
                return <VacantPositionsTab
                    playerStats={currentPlayerStats}
                    onPlayerStatsUpdate={onPlayerStatsUpdate}
                />;
            case 'applications':
                return isGroupLeader(currentPlayerStats) ?
                    <ApplicationsTab playerStats={currentPlayerStats} /> : null;
            case 'my-applications':
                return <MyApplicationsTab playerStats={currentPlayerStats} />;
            default:
                return <PlayerInfoTab playerStats={currentPlayerStats} />;
        }
    };

    return (
        <div className="department-tabs-container">
            <TabNavigation
                tabs={getTabs()}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};