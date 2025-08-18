// src/components/training/TrainingCounter.tsx
import React, { useState, useEffect } from 'react';
import { getTimeUntilReset } from '../../services/TrainingService';
import '../../styles/components/training/TrainingCounter.css';

interface TrainingCounterProps {
    remainingClicks: number;
    maxClicks?: number;
}

export const TrainingCounter: React.FC<TrainingCounterProps> = ({
                                                                    remainingClicks,
                                                                    maxClicks = 50
                                                                }) => {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            setTimeUntilReset(getTimeUntilReset());
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const clicksPercentage = (remainingClicks / maxClicks) * 100;
    const isLow = remainingClicks <= 10;

    return (
        <div className="training-counter">
            <div className="counter-content">
                <div className="counter-main">
                    <span className="counter-label">Treeningkordi jäänud</span>
                    <div className="counter-display">
                        <span className={`counter-value ${isLow ? 'low-clicks' : ''}`}>
                            {remainingClicks}
                        </span>
                        <span className="counter-divider">/</span>
                        <span className="counter-max">{maxClicks}</span>
                    </div>
                    <div className="counter-progress">
                        <div
                            className="counter-progress-bar"
                            style={{ width: `${clicksPercentage}%` }}
                        />
                    </div>
                </div>
                <div className="counter-timer">
                    <span className="timer-icon">⏰</span>
                    <div className="timer-content">
                        <span className="timer-label">Taastub</span>
                        <span className="timer-value">{timeUntilReset}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};