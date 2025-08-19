// src/components/patrol/ActiveWorkProgress.tsx
import React from 'react';
import { ActiveWork } from '../../types';
import { getWorkActivityById } from '../../data/workActivities';
import { formatCountdownTime } from '../../utils/timeFormatter';
import '../../styles/components/patrol/ActiveWorkProgress.css';

interface ActiveWorkProgressProps {
    activeWork: ActiveWork;
    remainingTime: number;
}

export const ActiveWorkProgress: React.FC<ActiveWorkProgressProps> = ({
                                                                          activeWork,
                                                                          remainingTime
                                                                      }) => {
    const workActivity = getWorkActivityById(activeWork.workId);

    const remainingTimeInSeconds = Math.floor(remainingTime / 1000);

    const totalSeconds = activeWork.totalHours * 3600;
    const progressPercentage = ((totalSeconds - remainingTime) / totalSeconds) * 100;

    return (
        <div className="active-work-banner">
            <h3>Töö käib</h3>
            <p className="active-work-name">{workActivity?.name || 'Tundmatu tegevus'}</p>

            <div className="work-info">
                <div className="info-item">
                    <span className="info-label">Piirkond:</span>
                    <span className="info-value">{activeWork.department}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Kestus:</span>
                    <span className="info-value">{activeWork.totalHours} tundi</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Tasu:</span>
                    <span className="info-value">+{activeWork.expectedExp} XP</span>
                </div>
            </div>

            <div className="progress-container">
                <div className="time-remaining">
                    Aega jäänud: {formatCountdownTime(remainingTimeInSeconds)}
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            <p className="work-warning">
                ⚠️ Töö ajal ei saa võtta koolitusi ja treeninguid on piiratud (10 korda tunnis)
            </p>
        </div>
    );
};