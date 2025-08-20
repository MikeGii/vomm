// src/components/training/TrainingCounter.tsx
import React, { useState, useEffect } from 'react';
import { getTimeUntilReset } from '../../services/TrainingService';
import '../../styles/components/training/TrainingCounter.css';

interface TrainingCounterProps {
    remainingClicks: number;
    maxClicks?: number;
    label?: string;
    lastResetTime?: any;
}

export const TrainingCounter: React.FC<TrainingCounterProps> = ({
                                                                    remainingClicks,
                                                                    maxClicks = 50,
                                                                    label = 'Treeningkordi jäänud',
                                                                    lastResetTime
                                                                }) => {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            if (lastResetTime) {
                // Calculate time until reset based on provided lastResetTime
                setTimeUntilReset(calculateTimeUntilReset(lastResetTime));
            } else {
                // Fallback to original function (for sports)
                setTimeUntilReset(getTimeUntilReset());
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [lastResetTime]);

    // Helper function to calculate time until next reset
    const calculateTimeUntilReset = (lastReset: any): string => {
        const now = new Date();
        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
        const timeDiff = nextHour.getTime() - now.getTime();

        const minutes = Math.floor(timeDiff / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const clicksPercentage = (remainingClicks / maxClicks) * 100;
    const isLow = remainingClicks <= 10;

    return (
        <div className="training-counter">
            <div className="counter-content">
                <div className="counter-main">
                    <span className="counter-label">{label}</span>
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