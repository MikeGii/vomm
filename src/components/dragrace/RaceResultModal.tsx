// src/components/dragrace/RaceResultModal.tsx
import React from 'react';
import { DragRaceResult } from '../../types/dragRace';
import { DragRacePhysics } from '../../utils/dragRacePhysics';
import '../../styles/components/dragrace/RaceResultModal.css'

interface RaceResultModalProps {
    isOpen: boolean;
    result: DragRaceResult | null;
    trackName: string;
    onClose: () => void;
    onRaceAgain: () => void;
    carAcceleration?: number; // Add car's 0-100 time
}

export const RaceResultModal: React.FC<RaceResultModalProps> = ({
                                                                    isOpen, result, trackName, onClose, onRaceAgain, carAcceleration
                                                                }) => {
    if (!isOpen || !result) return null;

    const formatTime = (time: number) => `${time.toFixed(3)}s`;

    // Calculate percentage impacts
    const calculatePercentageImpact = (value: number, total: number) => {
        const percentage = Math.abs((value / total) * 100);
        return percentage.toFixed(1);
    };

    return (
        <div className="dr-modal-overlay">
            <div className="dr-modal dr-result-modal">
                <div className="dr-modal-header">
                    <h2 className="dr-modal-title">
                        <span className="dr-modal-icon">🏁</span>
                        Võidusõidu tulemus
                    </h2>
                    <button className="dr-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="dr-modal-content">
                    <div className="dr-result-main">
                        <div className="dr-final-time">
                            <span className="dr-time-label">Lõplik aeg - {trackName}</span>
                            <span className="dr-time-value">{formatTime(result.time)}</span>
                        </div>

                        {result.isPersonalBest && (
                            <div className="dr-personal-best">
                                🏆 Uus isiklik rekord!
                            </div>
                        )}

                        {result.previousBest && !result.isPersonalBest && (
                            <div className="dr-previous-best">
                                Sinu parim: {formatTime(result.previousBest)}
                                <span className="dr-time-diff">
                                    ({DragRacePhysics.getTimeDifference(result.time, result.previousBest)})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="dr-breakdown">
                        <h3>Tulemust mõjutavad tegurid</h3>
                        <div className="dr-breakdown-grid">
                            {carAcceleration && (
                                <div className="dr-breakdown-item dr-car-stat">
                                    <span className="dr-breakdown-label">🚗 Auto 0-100 km/h</span>
                                    <span className="dr-breakdown-value">{carAcceleration.toFixed(1)}s</span>
                                </div>
                            )}

                            <div className="dr-breakdown-item dr-skills">
                                <span className="dr-breakdown-label">
                                    🎯 Sõiduoskuste mõju
                                </span>
                                <span className="dr-breakdown-value">
                                    {result.breakdown.drivingSkills > 0 ? '+' : ''}{calculatePercentageImpact(result.breakdown.drivingSkills, result.time)}%
                                </span>
                            </div>

                            <div className="dr-breakdown-item dr-luck">
                                <span className="dr-breakdown-label">
                                    🎲 Õnne faktor
                                </span>
                                <span className="dr-breakdown-value">
                                    {result.breakdown.luck > 0 ? '+' : ''}{calculatePercentageImpact(result.breakdown.luck, result.time)}%
                                </span>
                            </div>
                        </div>

                        <div className="dr-breakdown-tips">
                            <h4>💡 Nõuanded paremate tulemuste saamiseks:</h4>
                            <ul>
                                <li>Treeni oskusi (käsitsemine, reaktsioon, käiguvahetus) parema aja nimel</li>
                                <li>Tuuni oma autot maksimaalse võimsuse saamiseks</li>
                                <li>Mida kiirem 0-100 aeg, seda parem drag racing tulemus</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="dr-modal-footer">
                    <button className="dr-modal-button dr-secondary" onClick={onClose}>
                        Sulge
                    </button>
                </div>
            </div>
        </div>
    );
};