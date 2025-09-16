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
}

export const RaceResultModal: React.FC<RaceResultModalProps> = ({
                                                                    isOpen, result, trackName, onClose, onRaceAgain
                                                                }) => {
    if (!isOpen || !result) return null;

    const formatTime = (time: number) => `${time.toFixed(3)}s`;
    const formatBreakdown = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(3)}s`;

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
                            <span className="dr-time-label">Lõplik aeg</span>
                            <span className="dr-time-value">{formatTime(result.time)}</span>
                        </div>

                        {result.isPersonalBest && (
                            <div className="dr-personal-best">
                                🎉 Uus isiklik rekord!
                            </div>
                        )}

                        {result.previousBest && !result.isPersonalBest && (
                            <div className="dr-previous-best">
                                Eelmine parim: {formatTime(result.previousBest)}
                                <span className="dr-time-diff">
                                    ({DragRacePhysics.getTimeDifference(result.time, result.previousBest)})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="dr-breakdown">
                        <h3>Tulemuse koostis</h3>
                        <div className="dr-breakdown-grid">
                            <div className="dr-breakdown-item dr-base">
                                <span className="dr-breakdown-label">Baasaeg ({trackName})</span>
                            </div>

                            <div className="dr-breakdown-item dr-car">
                                <span className="dr-breakdown-label">Auto mõju (70%)</span>
                                <span className="dr-breakdown-value">{formatBreakdown(-result.breakdown.carPerformance)}</span>
                            </div>

                            <div className="dr-breakdown-item dr-skills">
                                <span className="dr-breakdown-label">Sõiduoskused (20%)</span>
                                <span className="dr-breakdown-value">{formatBreakdown(-result.breakdown.drivingSkills)}</span>
                            </div>

                            <div className="dr-breakdown-item dr-luck">
                                <span className="dr-breakdown-label">Õnn/juhus (10%)</span>
                                <span className="dr-breakdown-value">{formatBreakdown(-result.breakdown.luck)}</span>
                            </div>
                        </div>

                        <div className="dr-breakdown-explanation">
                            <p>Väiksem aeg = parem tulemus. Positiivsed väärtused aeglustavad, negatiivsed kiirendavad.</p>
                        </div>
                    </div>
                </div>

                <div className="dr-modal-footer">
                    <button className="dr-modal-button dr-secondary" onClick={onClose}>
                        Sulge
                    </button>
                    <button className="dr-modal-button dr-primary" onClick={onRaceAgain}>
                        Sõida uuesti
                    </button>
                </div>
            </div>
        </div>
    );
};