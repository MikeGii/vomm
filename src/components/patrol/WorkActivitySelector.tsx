// src/components/patrol/WorkActivitySelector.tsx
import React from 'react';
import {PlayerStats, WorkActivity} from '../../types';
import { CrimeImpactIndicator } from './CrimeImpactIndicator';
import {calculateSalaryForOfficer, calculateWorkRewards} from '../../data/workActivities';
import '../../styles/components/patrol/WorkActivitySelector.css';

interface WorkActivitySelectorProps {
    activities: WorkActivity[];
    selectedActivity: string;
    selectedHours: number;
    onActivitySelect: (activityId: string) => void;
    onHoursSelect: (hours: number) => void;
    onStartWork: () => void;
    isStarting: boolean;
    isTutorial?: boolean;
    isKadett?: boolean;
    playerRank?: string | null;
    playerStats: PlayerStats;
}

export const WorkActivitySelector: React.FC<WorkActivitySelectorProps> = ({
                                                                              activities,
                                                                              selectedActivity,
                                                                              selectedHours,
                                                                              onActivitySelect,
                                                                              onHoursSelect,
                                                                              onStartWork,
                                                                              isStarting,
                                                                              isTutorial = false,
                                                                              isKadett = false,
                                                                              playerRank = null,
                                                                              playerStats
                                                                          }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);
    const expectedRewards = selectedActivityData
        ? calculateWorkRewards(selectedActivityData, selectedHours, playerRank)
        : { experience: 0, money: 0 };

    // Check if player is a police officer (has rank)
    const isPoliceOfficer = playerRank !== null;

    return (
        <div className="work-activity-selector">
            <h3>Vali tööülesanne</h3>

            <div className="activity-selection">
                <label>Tegevus:</label>
                <select
                    className="activity-dropdown"
                    value={selectedActivity}
                    onChange={(e) => onActivitySelect(e.target.value)}
                    disabled={isStarting}
                >
                    <option value="">-- Vali tegevus --</option>
                    {activities.map(activity => (
                        <option key={activity.id} value={activity.id}>
                            {activity.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedActivityData && (
                <div className="activity-details">
                    <p className="activity-description">{selectedActivityData.description}</p>

                    <div className="activity-requirements">
                        <h4>Nõuded:</h4>
                        <ul>
                            <li>Minimaalne tase: {selectedActivityData.minLevel}</li>
                            {selectedActivityData.requiredCourses && (
                                <li>Vajalikud koolitused läbitud</li>
                            )}
                        </ul>
                    </div>

                    <div className="hours-selection">
                        <label>Tundide arv:</label>
                        {isTutorial ? (
                            <div className="tutorial-hours">
                                <p>1 tund (õpetuse kiirversioon - 20 sekundit)</p>
                            </div>
                        ) : (
                            <div className="hours-slider-container">
                                <input
                                    type="range"
                                    min="1"
                                    max={selectedActivityData.maxHours}
                                    value={selectedHours}
                                    onChange={(e) => onHoursSelect(Number(e.target.value))}
                                    disabled={isStarting}
                                    className="hours-slider"
                                />
                                <span className="hours-display">{selectedHours} tundi</span>
                            </div>
                        )}
                    </div>

                    {/* ADD CRIME IMPACT INDICATOR */}
                    {selectedActivityData && selectedHours > 0 && (
                        <CrimeImpactIndicator
                            playerStats={playerStats}
                            selectedHours={selectedHours}
                        />
                    )}

                    <div className="rewards-preview">
                        <h4>Oodatav tasu:</h4>
                        <div className="reward-item">
                            <span className="reward-label">Kogemus:</span>
                            <span className="reward-value">+{expectedRewards.experience} XP</span>
                        </div>
                        {isPoliceOfficer && expectedRewards.money > 0 && (
                            <div className="reward-item">
                                <span className="reward-label">Palk:</span>
                                <span className="reward-value">+{expectedRewards.money}€</span>
                            </div>
                        )}
                        {isPoliceOfficer && (
                            <div className="salary-info">
                                <p className="salary-rate">
                                    Tunnitasu: {calculateSalaryForOfficer(playerRank, 1)}€/tund ({playerRank})
                                </p>
                            </div>
                        )}
                        {!isTutorial && (
                            <p className="reward-note">
                                Iga järgnev tund annab {(selectedActivityData.expGrowthRate * 100)}% rohkem kogemust
                            </p>
                        )}
                    </div>

                    <button
                        className="start-work-button"
                        onClick={onStartWork}
                        disabled={isStarting || !selectedActivity}
                    >
                        {isStarting ? 'Alustan...' : isKadett ? 'Alusta tööampsu' : 'Alusta tööd'}
                    </button>
                </div>
            )}
        </div>
    );
};