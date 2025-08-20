// src/components/ui/TabNavigation.tsx
import React from 'react';
import '../../styles/components/ui/TabNavigation.css';

interface Tab {
    id: string;
    label: string;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
                                                                tabs,
                                                                activeTab,
                                                                onTabChange
                                                            }) => {
    return (
        <div className="tab-navigation">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};