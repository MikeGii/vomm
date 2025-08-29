// src/components/tests/TestTimer.tsx
import React from 'react';
import '../../styles/components/tests/TestTimer.css';

interface TestTimerProps {
    timeRemaining: number; // in seconds
    totalTime: number; // in seconds
}

export const TestTimer: React.FC<TestTimerProps> = ({
                                                        timeRemaining,
                                                        totalTime
                                                    }) => {
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerClass = (): string => {
        const percentage = (timeRemaining / totalTime) * 100;
        if (percentage <= 10) return 'critical';
        if (percentage <= 25) return 'warning';
        return 'normal';
    };

    const progressPercentage = Math.max(0, (timeRemaining / totalTime) * 100);

    return (
        <div className={`test-timer ${getTimerClass()}`}>
            <div className="timer-icon">⏱️</div>
            <div className="timer-content">
                <div className="timer-text">
                    <span className="time-remaining">{formatTime(timeRemaining)}</span>
                    <span className="time-label">aega jäänud</span>
                </div>
                <div className="timer-bar">
                    <div
                        className="timer-progress"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};