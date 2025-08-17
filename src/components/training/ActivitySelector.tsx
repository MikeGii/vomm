// src/components/training/ActivitySelector.tsx
import React from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import { calculateEquipmentBonuses, getEffectiveAttributes } from '../../services/EquipmentBonusService';
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

    // Calculate equipment bonuses and effective attributes
    const equipmentBonuses = playerStats?.equipment ? calculateEquipmentBonuses(playerStats.equipment) : null;
    const effectiveAttributes = playerStats?.attributes && playerStats?.equipment ?
        getEffectiveAttributes(playerStats.attributes, playerStats.equipment) : null;

// Check if player can train this activity (for future use with level requirements)
    const canTrainActivity = (activity: TrainingActivity): boolean => {
        if (!playerStats || !playerStats.attributes) return false;

        // Use the minimum effective attribute level as the player's training level
        const minAttributeLevel = effectiveAttributes ?
            Math.min(...Object.values(effectiveAttributes)) :
            Math.min(...Object.values(playerStats.attributes).map(a => a.level));

        return minAttributeLevel >= activity.requiredLevel;
    };

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
                {activities.map(activity => {
                    const canDo = canTrainActivity(activity);
                    const minLevel = playerStats?.attributes ?
                        Math.min(...Object.values(playerStats.attributes).map(a => a.level)) : 0;
                    const effectiveMinLevel = effectiveAttributes ?
                        Math.min(...Object.values(effectiveAttributes)) : minLevel;

                    return (
                        <option
                            key={activity.id}
                            value={activity.id}
                            disabled={!canDo}
                        >
                            {activity.name}
                            {!canDo && ` (Nõutav: ${activity.requiredLevel}, Sul: ${minLevel}${effectiveMinLevel > minLevel ? `+${effectiveMinLevel - minLevel}` : ''})`}
                        </option>
                    );
                })}
            </select>

            {selectedActivityData && (
                <div className="activity-details">
                    {/* Show if equipment helps meet requirements */}
                    {!canTrainActivity(selectedActivityData) && (
                        <div className="requirement-warning">
                            ⚠️ Nõutav tase: {selectedActivityData.requiredLevel}
                            {playerStats?.attributes && (
                                <span>
                        {' '}(Sul: {Math.min(...Object.values(playerStats.attributes).map(a => a.level))}
                                    {effectiveAttributes && Math.min(...Object.values(effectiveAttributes)) > Math.min(...Object.values(playerStats.attributes).map(a => a.level)) &&
                                        `+${Math.min(...Object.values(effectiveAttributes)) - Math.min(...Object.values(playerStats.attributes).map(a => a.level))}`
                                    })
                    </span>
                            )}
                        </div>
                    )}

                    {/* Show active equipment bonuses */}
                    {equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0) && (
                        <div className="equipment-bonus-info">
                            <span className="bonus-label">📦 Varustuse boonused aktiivsed</span>
                        </div>
                    )}

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
                disabled={!selectedActivity || isTraining || !canTrain || (selectedActivityData && !canTrainActivity(selectedActivityData))}
            >
                {isTraining ? 'Trenni...' :
                    selectedActivityData && !canTrainActivity(selectedActivityData) ? 'Nõuded täitmata' : 'Treeni'}
            </button>
        </div>
    );
};