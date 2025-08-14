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

    return (
        <div className="training-counter">
            <div className="counter-main">
                <span className="counter-label">Treeningkordi jäänud:</span>
                <span className="counter-value">{remainingClicks} / {maxClicks}</span>
            </div>
            <div className="counter-reset">
                <span className="reset-label">Taastub:</span>
                <span className="reset-time">{timeUntilReset}</span>
            </div>
        </div>
    );
};