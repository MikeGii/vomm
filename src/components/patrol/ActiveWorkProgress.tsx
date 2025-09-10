// src/components/patrol/ActiveWorkProgress.tsx
import React, { useState } from 'react';
import { ActiveWork } from '../../types';
import { getWorkActivityById } from '../../data/workActivities';
import { formatCountdownTime } from '../../utils/timeFormatter';
import '../../styles/components/patrol/ActiveWorkProgress.css';

interface ActiveWorkProgressProps {
    activeWork: ActiveWork;
    remainingTime: number;
    onCancelWork?: () => void;
    isCancelling?: boolean;
}

export const ActiveWorkProgress: React.FC<ActiveWorkProgressProps> = ({
                                                                          activeWork,
                                                                          remainingTime,
                                                                          onCancelWork,
                                                                          isCancelling = false
                                                                      }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const workActivity = getWorkActivityById(activeWork.workId);

    const remainingTimeInSeconds = Math.floor(remainingTime / 1000);
    const totalSeconds = activeWork.totalHours * 3600;
    const progressPercentage = ((totalSeconds - remainingTime) / totalSeconds) * 100;

    // Calculate worked time and estimated current reward
    const timeWorkedMs = Date.now() - (activeWork.startedAt as any).toMillis();
    const hoursWorked = Math.max(0.1, timeWorkedMs / (1000 * 3600));
    const estimatedCurrentExp = Math.floor((activeWork.expectedExp / activeWork.totalHours) * hoursWorked * 0.5);

    const handleCancelClick = () => {
        setShowConfirmDialog(true);
    };

    const handleConfirmCancel = () => {
        setShowConfirmDialog(false);
        if (onCancelWork) {
            onCancelWork();
        }
    };

    const handleCancelDialog = () => {
        setShowConfirmDialog(false);
    };

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
                <div className="info-item">
                    <span className="info-label">Töötatud:</span>
                    <span className="info-value">{hoursWorked.toFixed(1)}h</span>
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

            <div className="work-actions">
                <button
                    className="cancel-work-button"
                    onClick={handleCancelClick}
                    disabled={isCancelling}
                >
                    {isCancelling ? 'Katkestan...' : 'Katkesta töö'}
                </button>
                <div className="cancel-warning">
                    ⚠️ Katkestamisel saad ainult 50% töötatud aja tasust (~{estimatedCurrentExp} XP)
                </div>
            </div>

            <p className="work-warning">
                ⚠️ Töö ajal ei saa võtta koolitusi ja treeninguid on piiratud (10 korda tunnis)
            </p>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="cancel-dialog-overlay">
                    <div className="cancel-dialog">
                        <h4>Kas oled kindel?</h4>
                        <p>
                            Sa katkestid töö pärast <strong>{hoursWorked.toFixed(1)} tundi</strong> töötamist.
                        </p>
                        <p>
                            Saad ainult <strong>50% tasust</strong>: umbes <strong>{estimatedCurrentExp} XP</strong>
                        </p>
                        <div className="dialog-actions">
                            <button
                                className="confirm-cancel-button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                            >
                                Jah, katkesta
                            </button>
                            <button
                                className="keep-working-button"
                                onClick={handleCancelDialog}
                            >
                                Jätka töötamist
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};