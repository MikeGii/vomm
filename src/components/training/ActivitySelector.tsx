// src/components/training/ActivitySelector.tsx
import React from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import '../../styles/components/training/ActivitySelector.css';
import { ALL_SHOP_ITEMS } from '../../data/shop';

interface ActivitySelectorProps {
    activities: TrainingActivity[];
    selectedActivity: string;
    onActivitySelect: (activityId: string) => void;
    onTrain: () => void;
    isTraining: boolean;
    canTrain: boolean;
    playerStats: PlayerStats | null;
    trainingType?: 'sports' | 'kitchen-lab'; // NEW: Specify training type
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
                                                                      activities,
                                                                      selectedActivity,
                                                                      onActivitySelect,
                                                                      onTrain,
                                                                      isTraining,
                                                                      canTrain,
                                                                      playerStats,
                                                                      trainingType = 'sports' // NEW: Default to sports
                                                                  }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);

    // Calculate equipment bonuses and effective attributes
    const equipmentBonuses = playerStats?.equipment ? calculateEquipmentBonuses(playerStats.equipment) : null;

    // Get player's actual level (not attribute levels)
    const playerLevel = playerStats?.level || 1;

    // Get remaining training clicks based on training type
    const remainingClicks = trainingType === 'sports'
        ? (playerStats?.trainingData?.remainingClicks || 0)
        : (playerStats?.kitchenLabTrainingData?.remainingClicks || 0);

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

    // Get title based on training type
    const getSelectorTitle = (): string => {
        return trainingType === 'sports' ? 'Vali treening' : 'Vali köök/labor tegevus';
    };

    // Render rewards based on training type
    const renderRewards = (activity: TrainingActivity) => {
        if (trainingType === 'sports') {
            return (
                <>
                    {activity.rewards.strength && (
                        <li>💪 Jõud: +{activity.rewards.strength}</li>
                    )}
                    {activity.rewards.agility && (
                        <li>🏃 Kiirus: +{activity.rewards.agility}</li>
                    )}
                    {activity.rewards.dexterity && (
                        <li>🎯 Osavus: +{activity.rewards.dexterity}</li>
                    )}
                    {activity.rewards.intelligence && (
                        <li>🧠 Intelligentsus: +{activity.rewards.intelligence}</li>
                    )}
                    {activity.rewards.endurance && (
                        <li>🏋️ Vastupidavus: +{activity.rewards.endurance}</li>
                    )}
                </>
            );
        } else {
            return (
                <>
                    {activity.rewards.cooking && (
                        <li>🍳 Toidu valmistamine: +{activity.rewards.cooking}</li>
                    )}
                    {activity.rewards.brewing && (
                        <li>🥤 Joogi valmistamine: +{activity.rewards.brewing}</li>
                    )}
                    {activity.rewards.chemistry && (
                        <li>🧪 Keemia valmistamine: +{activity.rewards.chemistry}</li>
                    )}
                </>
            );
        }
    };

    const getItemName = (itemId: string): string => {
        const shopItem = ALL_SHOP_ITEMS.find(item => item.id === itemId);
        return shopItem?.name || itemId;
    };


    // Render required/produced items for kitchen/lab activities
    const renderCraftingInfo = (activity: TrainingActivity) => {
        if (trainingType !== 'kitchen-lab' || !activity.requiredItems || !activity.producedItems) {
            return null;
        }

        return (
            <div className="crafting-info">
                <div className="required-items">
                    <h4>Vajalikud materjalid:</h4>
                    <ul>
                        {activity.requiredItems.map((item, index) => (
                            <li key={index}>
                                {item.quantity}x {getItemName(item.id)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="produced-items">
                    <h4>Toodeti:</h4>
                    <ul>
                        {activity.producedItems.map((item, index) => (
                            <li key={index}>
                                {item.quantity}x {getItemName(item.id)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="activity-selector">
            <h3 className="selector-title">{getSelectorTitle()}</h3>

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

                    {/* Show active equipment bonuses for attributes (only for sports) */}
                    {trainingType === 'sports' && equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0) && (
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

                    {/* Show crafting info for kitchen/lab activities */}
                    {renderCraftingInfo(selectedActivityData)}

                    <div className="activity-rewards">
                        <h4>Tasu:</h4>
                        <ul>
                            {renderRewards(selectedActivityData)}
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
                                        <span className="button-text">
                                            {trainingType === 'sports' ? 'Treeni' : 'Valmista'}
                                        </span>
                                        <span className="clicks-badge">{remainingClicks}</span>
                                    </>
                        }
                    </button>
                </div>
            )}
        </div>
    );
};