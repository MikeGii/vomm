// src/components/training/TrainingCounter.tsx
import React, { useState, useEffect } from 'react';
import { getTimeUntilReset } from '../../services/TrainingService';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { Timestamp } from 'firebase/firestore';
import '../../styles/components/training/TrainingCounter.css';

interface TrainingCounterProps {
    remainingClicks: number;
    maxClicks?: number;
    label?: string;
    lastResetTime?: any;
    trainingType?: 'sports' | 'kitchen' | 'handicraft';
}

export const TrainingCounter: React.FC<TrainingCounterProps> = ({
                                                                    remainingClicks,
                                                                    maxClicks = 50,
                                                                    label = 'Treeningkordi jäänud',
                                                                    lastResetTime,
                                                                    trainingType = 'sports'
                                                                }) => {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');
    const { playerStats } = usePlayerStats();

    // Calculate remaining daily clicks
    const getRemainingDailyClicks = (): { remaining: number; limit: number } => {
        const isVip = playerStats?.isVip || false;
        const dailyLimit = isVip ? 50000 : 10000;

        if (!playerStats?.dailyTrainingClicks) {
            return { remaining: dailyLimit, limit: dailyLimit };
        }

        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));

        const lastReset = playerStats.dailyTrainingClicks.lastResetDate instanceof Timestamp
            ? playerStats.dailyTrainingClicks.lastResetDate.toDate()
            : new Date(playerStats.dailyTrainingClicks.lastResetDate);
        const lastResetDay = new Date(lastReset.setHours(0, 0, 0, 0));

        // If it's a new day, return full limit
        if (today.getTime() > lastResetDay.getTime()) {
            return { remaining: dailyLimit, limit: dailyLimit };
        }

        // Map training type to category
        const clickCategory = trainingType === 'kitchen' ? 'food' :
            trainingType === 'handicraft' ? 'handicraft' : 'sports';

        const used = playerStats.dailyTrainingClicks[clickCategory] || 0;
        return {
            remaining: Math.max(0, dailyLimit - used),
            limit: dailyLimit
        };
    };

    const dailyClickInfo = getRemainingDailyClicks();

    useEffect(() => {
        const updateTimer = () => {
            if (lastResetTime) {
                setTimeUntilReset(calculateTimeUntilReset(lastResetTime));
            } else {
                setTimeUntilReset(getTimeUntilReset());
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [lastResetTime]);

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

                    {/* New daily limit display */}
                    <div className="daily-limit-info">
                        <span className="daily-limit-text">
                            Päevane limiit: {dailyClickInfo.remaining.toLocaleString('et-EE')} / {dailyClickInfo.limit.toLocaleString('et-EE')}
                        </span>
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