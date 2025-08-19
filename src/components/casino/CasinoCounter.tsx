// src/components/casino/CasinoCounter.tsx
import React, { useState, useEffect } from 'react';
import { getTimeUntilCasinoReset } from '../../services/CasinoService';
import '../../styles/components/casino/CasinoCounter.css';

interface CasinoCounterProps {
    remainingPlays: number;
    maxPlays?: number;
}

export const CasinoCounter: React.FC<CasinoCounterProps> = ({
                                                                remainingPlays,
                                                                maxPlays = 5
                                                            }) => {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            setTimeUntilReset(getTimeUntilCasinoReset());
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const playsPercentage = (remainingPlays / maxPlays) * 100;
    const isLow = remainingPlays <= 1;
    const isOut = remainingPlays === 0;

    return (
        <div className="casino-counter">
            <div className="counter-content">
                <div className="counter-main">
                    <span className="counter-label">Mänge jäänud tunnis</span>
                    <div className="counter-display">
                        <span className={`counter-value ${isLow ? 'low-plays' : ''} ${isOut ? 'no-plays' : ''}`}>
                            {remainingPlays}
                        </span>
                        <span className="counter-divider">/</span>
                        <span className="counter-max">{maxPlays}</span>
                    </div>
                    <div className="counter-progress">
                        <div
                            className="counter-progress-bar"
                            style={{ width: `${playsPercentage}%` }}
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