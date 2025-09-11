// src/components/dragrace/TrainingOptions.tsx
import React from 'react';
import { PlayerStats } from '../../types';
import { FuelSystem, TrainingType, TRAINING_OPTIONS } from '../../types/dragRace';
import { DragRaceService } from '../../services/DragRaceService';

interface TrainingOptionsProps {
    playerStats: PlayerStats;
    fuelSystem: FuelSystem | null;
    isTraining: boolean;
    onTraining: (trainingType: TrainingType) => void;
}

export const TrainingOptions: React.FC<TrainingOptionsProps> = ({
                                                                    playerStats,
                                                                    fuelSystem,
                                                                    isTraining,
                                                                    onTraining
                                                                }) => {
    const canTrain = fuelSystem && fuelSystem.currentFuel > 0 && !isTraining;

    const getAttributeLevel = (attributeName: string): number => {
        return (playerStats.attributes as any)?.[attributeName]?.level || 0;
    };

    const getAttributeExperience = (attributeName: string): { current: number; needed: number } => {
        const attr = (playerStats.attributes as any)?.[attributeName];
        if (!attr) return { current: 0, needed: 100 };

        return {
            current: attr.experience,
            needed: attr.experienceForNextLevel
        };
    };

    return (
        <div className="dr-training-options">
            <div className="dr-training-header">
                <h2 className="dr-training-title">Treeningu valikud</h2>
                <p className="dr-training-description">
                    Vali treeningu tüüp oma oskuste parandamiseks
                </p>
            </div>

            <div className="dr-training-grid">
                {TRAINING_OPTIONS.map((option) => {
                    const currentLevel = getAttributeLevel(option.id);
                    const experience = getAttributeExperience(option.id);
                    const sourceAttributeLevel = getAttributeLevel(option.sourceAttribute);
                    const xpGain = DragRaceService.calculateTrainingXP(option.id, playerStats);
                    const progressPercentage = (experience.current / experience.needed) * 100;

                    return (
                        <div key={option.id} className="dr-training-option">
                            <div className="dr-option-header">
                                <span className="dr-option-icon">{option.icon}</span>
                                <h3 className="dr-option-name">{option.name}</h3>
                            </div>

                            <p className="dr-option-description">{option.description}</p>

                            <div className="dr-option-stats">
                                <div className="dr-current-level">
                                    <span className="dr-level-label">Praegune tase:</span>
                                    <span className="dr-level-value">{currentLevel}</span>
                                </div>

                                <div className="dr-experience-bar">
                                    <div className="dr-exp-info">
                                        <span className="dr-exp-current">{experience.current}</span>
                                        <span className="dr-exp-separator">/</span>
                                        <span className="dr-exp-needed">{experience.needed}</span>
                                        <span className="dr-exp-label">XP</span>
                                    </div>
                                    <div className="dr-exp-bar">
                                        <div
                                            className="dr-exp-progress"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="dr-xp-gain">
                                    <span className="dr-xp-label">XP katse kohta:</span>
                                    <span className="dr-xp-value">+{xpGain}</span>
                                    <span className="dr-xp-source">
                                        (baasil {option.sourceAttribute} tase {sourceAttributeLevel})
                                    </span>
                                </div>
                            </div>

                            <button
                                className={`dr-training-button ${!canTrain ? 'dr-disabled' : ''} ${isTraining ? 'dr-loading' : ''}`}
                                onClick={() => onTraining(option.id)}
                                disabled={!canTrain}
                            >
                                {isTraining ? (
                                    <>
                                        <span className="dr-loading-spinner"></span>
                                        Treenin...
                                    </>
                                ) : (
                                    <>
                                        {option.icon} Treeni
                                        {canTrain && fuelSystem && (
                                            <span className="dr-fuel-cost">(-1 kütus)</span>
                                        )}
                                    </>
                                )}
                            </button>

                            {!canTrain && fuelSystem?.currentFuel === 0 && (
                                <div className="dr-no-fuel-warning">
                                    <span className="dr-warning-icon">⚠️</span>
                                    <span>Kütus on otsas</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};