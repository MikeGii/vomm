// src/components/training/ActivitySelector.tsx
import React from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import '../../styles/components/training/ActivitySelector.css';

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

    // Get player's actual level (not attribute levels)
    const playerLevel = playerStats?.level || 1;

    // Get remaining training clicks
    const remainingClicks = playerStats?.trainingData?.remainingClicks || 0;

    // Check if player can train this activity based on their main level
    const canTrainActivity = (activity: TrainingActivity): boolean => {
        if (!playerStats) return false;
        return playerLevel >= activity.requiredLevel;
    };

    // Group activities by required level
    const groupedActivities = activities.reduce((groups, activity) => {
        const level = activity.requiredLevel;
        if (!groups[level]) {
            groups[level] = [];
        }
        groups[level].push(activity);
        return groups;
    }, {} as Record<number, TrainingActivity[]>);

    // Sort levels
    const sortedLevels = Object.keys(groupedActivities)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <div className="activity-selector">
            <h3 className="selector-title">Vali treening</h3>

            {/* Show player's current level */}
            <div className="player-level-info">
                <span>Sinu tase: </span>
                <strong className="level-display">{playerLevel}</strong>
            </div>

            <select
                className="activity-dropdown"
                value={selectedActivity}
                onChange={(e) => onActivitySelect(e.target.value)}
                disabled={isTraining}
            >
                <option value="">-- Vali tegevus --</option>
                {sortedLevels.map(requiredLevel => (
                    <optgroup
                        key={requiredLevel}
                        label={`Tase ${requiredLevel} treeningud ${playerLevel < requiredLevel ? '(lukus)' : ''}`}
                    >
                        {groupedActivities[requiredLevel].map(activity => {
                            const canDo = canTrainActivity(activity);
                            return (
                                <option
                                    key={activity.id}
                                    value={activity.id}
                                    disabled={!canDo}
                                >
                                    {activity.name}
                                    {!canDo && ` 🔒`}
                                </option>
                            );
                        })}
                    </optgroup>
                ))}
            </select>

            {selectedActivityData && (
                <div className="activity-details">
                    {/* Show clear requirement warning if player can't train */}
                    {!canTrainActivity(selectedActivityData) && (
                        <div className="requirement-warning">
                            <span className="warning-icon">⚠️</span>
                            <div className="warning-content">
                                <strong>Treeningut ei saa sooritada</strong>
                                <p>Nõutav tase: {selectedActivityData.requiredLevel}</p>
                                <p>Sinu tase: {playerLevel}</p>
                                <p className="level-difference">
                                    Puudu: {selectedActivityData.requiredLevel - playerLevel} taset
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Show active equipment bonuses for attributes */}
                    {equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0) && (
                        <div className="equipment-bonus-info">
                            <span className="bonus-label">📦 Varustuse boonused:</span>
                            <div className="bonus-details">
                                {Object.entries(equipmentBonuses).map(([attr, bonus]) =>
                                        bonus > 0 && (
                                            <span key={attr} className="bonus-item">
                                            {attr === 'strength' && '💪'}
                                                {attr === 'agility' && '🏃'}
                                                {attr === 'dexterity' && '🎯'}
                                                {attr === 'intelligence' && '🧠'}
                                                {attr === 'endurance' && '🏋️'}
                                                +{bonus}
                                        </span>
                                        )
                                )}
                            </div>
                        </div>
                    )}

                    <p className="activity-description">{selectedActivityData.description}</p>

                    <div className="activity-rewards">
                        <h4>Tasu:</h4>
                        <ul>
                            {selectedActivityData.rewards.strength && (
                                <li>💪 Jõud: +{selectedActivityData.rewards.strength}</li>
                            )}
                            {selectedActivityData.rewards.agility && (
                                <li>🏃 Kiirus: +{selectedActivityData.rewards.agility}</li>
                            )}
                            {selectedActivityData.rewards.dexterity && (
                                <li>🎯 Osavus: +{selectedActivityData.rewards.dexterity}</li>
                            )}
                            {selectedActivityData.rewards.intelligence && (
                                <li>🧠 Intelligentsus: +{selectedActivityData.rewards.intelligence}</li>
                            )}
                            {selectedActivityData.rewards.endurance && (
                                <li>🏋️ Vastupidavus: +{selectedActivityData.rewards.endurance}</li>
                            )}
                            <li className="exp-reward">⭐ Kogemus: +{selectedActivityData.rewards.playerExp}</li>
                        </ul>
                    </div>

                    <button
                        className={`train-button ${remainingClicks === 0 ? 'no-clicks' : ''}`}
                        onClick={onTrain}
                        disabled={!canTrain || isTraining || !canTrainActivity(selectedActivityData) || remainingClicks === 0}
                    >
                        {isTraining ? 'Treenid...' :
                            !canTrainActivity(selectedActivityData) ? `Nõutav tase ${selectedActivityData.requiredLevel}` :
                                remainingClicks === 0 ? 'Treeningud otsas' :
                                    <>
                                        <span className="button-text">Treeni</span>
                                        <span className="clicks-badge">{remainingClicks}</span>
                                    </>
                        }
                    </button>
                </div>
            )}
        </div>
    );
};