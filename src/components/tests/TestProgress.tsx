// src/components/tests/TestProgress.tsx
import React from 'react';
import '../../styles/components/tests/TestProgress.css';

interface TestProgressProps {
    current: number;
    total: number;
    answered: number;
    percentage: number;
}

export const TestProgress: React.FC<TestProgressProps> = ({
                                                              current,
                                                              total,
                                                              answered,
                                                              percentage
                                                          }) => {
    return (
        <div className="test-progress">
            <div className="progress-info">
                <div className="progress-text">
                    <span className="current-question">Küsimus {current}</span>
                    <span className="total-questions">/ {total}</span>
                </div>
                <div className="answered-info">
                    <span className="answered-count">{answered}</span>
                    <span className="answered-label">vastatud</span>
                </div>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <div className="progress-percentage">
                {percentage}% lõpetatud
            </div>
        </div>
    );
};