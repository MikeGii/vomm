// src/components/training/ActivitySelector.tsx
import React from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import '../../styles/components/training/ActivitySelector.css';
import { getTrainingBonusForAttribute } from "../../data/abilities";

interface ActivitySelectorProps {
    activities: TrainingActivity[];
    selectedActivity: string;
    onActivitySelect: (activityId: string) => void;
    onTrain: () => void;
    isTraining: boolean;
    canTrain: boolean;
    playerStats: PlayerStats | null;
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
                                                                      activities,
                                                                      selectedActivity,
                                                                      onActivitySelect,
                                                                      onTrain,
                                                                      isTraining,
                                                                      canTrain,
                                                                      playerStats
                                                                  }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);

    return (
        <div className="activity-selector">
            <h3 className="selector-title">Vali treening</h3>

            <select
                className="activity-dropdown"
                value={selectedActivity}
                onChange={(e) => onActivitySelect(e.target.value)}
                disabled={isTraining}
            >
                <option value="">-- Vali tegevus --</option>
                {activities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                        {activity.name}
                    </option>
                ))}
            </select>

            {selectedActivityData && (
                <div className="activity-details">
                    <p className="activity-description">{selectedActivityData.description}</p>
                    <div className="activity-rewards">
                        <h4>Tasu:</h4>
                        <ul>
                            {selectedActivityData.rewards.strength && (
                                <li>
                                    💪 Jõud: +{selectedActivityData.rewards.strength} XP
                                    {playerStats && getTrainingBonusForAttribute(playerStats.completedCourses || [], 'strength') > 0 && (
                                        <span className="bonus-indicator">
                                            {' '}(+{(getTrainingBonusForAttribute(playerStats.completedCourses || [], 'strength') * 100).toFixed(0)}% boonus)
                                        </span>
                                    )}
                                </li>
                            )}
                            {selectedActivityData.rewards.agility && (
                                <li>
                                    🏃 Kiirus: +{selectedActivityData.rewards.agility} XP
                                    {playerStats && getTrainingBonusForAttribute(playerStats.completedCourses || [], 'agility') > 0 && (
                                        <span className="bonus-indicator">
                                            {' '}(+{(getTrainingBonusForAttribute(playerStats.completedCourses || [], 'agility') * 100).toFixed(0)}% boonus)
                                        </span>
                                    )}
                                </li>
                            )}
                            {selectedActivityData.rewards.dexterity && (
                                <li>
                                    🎯 Osavus: +{selectedActivityData.rewards.dexterity} XP
                                    {playerStats && getTrainingBonusForAttribute(playerStats.completedCourses || [], 'dexterity') > 0 && (
                                        <span className="bonus-indicator">
                                            {' '}(+{(getTrainingBonusForAttribute(playerStats.completedCourses || [], 'dexterity') * 100).toFixed(0)}% boonus)
                                        </span>
                                    )}
                                </li>
                            )}
                            {selectedActivityData.rewards.intelligence && (
                                <li>
                                    🧠 Intelligentsus: +{selectedActivityData.rewards.intelligence} XP
                                    {playerStats && getTrainingBonusForAttribute(playerStats.completedCourses || [], 'intelligence') > 0 && (
                                        <span className="bonus-indicator">
                                            {' '}(+{(getTrainingBonusForAttribute(playerStats.completedCourses || [], 'intelligence') * 100).toFixed(0)}% boonus)
                                        </span>
                                    )}
                                </li>
                            )}
                            {selectedActivityData.rewards.endurance && (
                                <li>
                                    ❤️ Vastupidavus: +{selectedActivityData.rewards.endurance} XP
                                    {playerStats && getTrainingBonusForAttribute(playerStats.completedCourses || [], 'endurance') > 0 && (
                                        <span className="bonus-indicator">
                                            {' '}(+{(getTrainingBonusForAttribute(playerStats.completedCourses || [], 'endurance') * 100).toFixed(0)}% boonus)
                                        </span>
                                    )}
                                </li>
                            )}
                            <li>⭐ Kogemus: +{selectedActivityData.rewards.playerExp} XP</li>
                        </ul>
                    </div>
                </div>
            )}

            <button
                className="train-button"
                onClick={onTrain}
                disabled={!selectedActivity || isTraining || !canTrain}
            >
                {isTraining ? 'Trenni...' : 'Treeni'}
            </button>
        </div>
    );
};