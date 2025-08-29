// src/components/tests/TestsList.tsx
import React from 'react';
import { TestCard } from './TestCard';
import { Test, PlayerStats } from '../../types';
import '../../styles/components/tests/TestsList.css';

interface TestsListProps {
    tests: Test[];
    playerStats: PlayerStats;
    onStartTest: (testId: string) => void;
    isStartingTest: boolean;
}

export const TestsList: React.FC<TestsListProps> = ({
                                                        tests,
                                                        playerStats,
                                                        onStartTest,
                                                        isStartingTest
                                                    }) => {
    if (tests.length === 0) {
        return (
            <div className="tests-list-empty">
                <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <h3>Teste pole saadaval</h3>
                    <p>Lõpeta koolitusi, et avada teste sellesse kategooriasse.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tests-list">
            <div className="tests-grid">
                {tests.map(test => (
                    <TestCard
                        key={test.id}
                        test={test}
                        playerStats={playerStats}
                        onStartTest={onStartTest}
                        isStartingTest={isStartingTest}
                    />
                ))}
            </div>
        </div>
    );
};