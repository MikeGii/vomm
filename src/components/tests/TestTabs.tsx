// src/components/tests/TestTabs.tsx
import React from 'react';
import '../../styles/components/tests/TestTabs.css';

type TabType = 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei';

interface TestTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    testCounts: {
        abipolitseinik: number;
        sisekaitseakadeemia: number;
        politsei: number;
    };
}

export const TestTabs: React.FC<TestTabsProps> = ({
                                                      activeTab,
                                                      onTabChange,
                                                      testCounts
                                                  }) => {
    const tabs: Array<{ key: TabType; label: string; emoji: string }> = [
        { key: 'abipolitseinik', label: 'Abipolitseinik', emoji: '🟡' },
        { key: 'sisekaitseakadeemia', label: 'Sisekaitseakadeemia', emoji: '🎓' },
        { key: 'politsei', label: 'Politsei', emoji: '🔵' }
    ];

    return (
        <div className="test-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`test-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.key)}
                >
                    <span className="tab-emoji">{tab.emoji}</span>
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-count">({testCounts[tab.key]})</span>
                </button>
            ))}
        </div>
    );
};