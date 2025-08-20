// src/components/training/ActivitySelector.tsx - UUENDUS
import React from 'react';
import { TrainingActivity, PlayerStats, InventoryItem } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
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
    trainingType?: 'sports' | 'kitchen-lab';
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
                                                                      activities,
                                                                      selectedActivity,
                                                                      onActivitySelect,
                                                                      onTrain,
                                                                      isTraining,
                                                                      canTrain,
                                                                      playerStats,
                                                                      trainingType = 'sports'
                                                                  }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);
    const equipmentBonuses = playerStats?.equipment ? calculateEquipmentBonuses(playerStats.equipment) : null;
    const playerLevel = playerStats?.level || 1;

    const remainingClicks = trainingType === 'sports'
        ? (playerStats?.trainingData?.remainingClicks || 0)
        : (playerStats?.kitchenLabTrainingData?.remainingClicks || 0);

    const canTrainActivity = (activity: TrainingActivity): boolean => {
        if (!playerStats) return false;
        return playerLevel >= activity.requiredLevel;
    };

    // NEW: Check if player has required materials
    const hasRequiredMaterials = (activity: TrainingActivity): { hasAll: boolean; missing: string[] } => {
        if (trainingType !== 'kitchen-lab' || !activity.requiredItems || !playerStats?.inventory) {
            return { hasAll: true, missing: [] };
        }

        const missing: string[] = [];

        for (const required of activity.requiredItems) {
            const inventoryItem = playerStats.inventory.find(item => item.id === required.id);
            const currentQuantity = inventoryItem?.quantity || 0;

            if (currentQuantity < required.quantity) {
                const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === required.id);
                const itemName = shopItem?.name || required.id;
                missing.push(`${itemName} (${currentQuantity}/${required.quantity})`);
            }
        }

        return {
            hasAll: missing.length === 0,
            missing
        };
    };

    const getSelectorTitle = (): string => {
        return trainingType === 'sports' ? 'Vali treening' : 'Vali köök/labor tegevus';
    };

    const renderRewards = (activity: TrainingActivity) => {
        if (trainingType === 'sports') {
            return (
                <>
                    {activity.rewards.strength && (<li>💪 Jõud: +{activity.rewards.strength}</li>)}
                    {activity.rewards.agility && (<li>🏃 Kiirus: +{activity.rewards.agility}</li>)}
                    {activity.rewards.dexterity && (<li>🎯 Osavus: +{activity.rewards.dexterity}</li>)}
                    {activity.rewards.intelligence && (<li>🧠 Intelligentsus: +{activity.rewards.intelligence}</li>)}
                    {activity.rewards.endurance && (<li>🏋️ Vastupidavus: +{activity.rewards.endurance}</li>)}
                </>
            );
        } else {
            return (
                <>
                    {activity.rewards.cooking && (<li>🍳 Toidu valmistamine: +{activity.rewards.cooking}</li>)}
                    {activity.rewards.brewing && (<li>🥤 Joogi valmistamine: +{activity.rewards.brewing}</li>)}
                    {activity.rewards.chemistry && (<li>🧪 Keemia valmistamine: +{activity.rewards.chemistry}</li>)}
                </>
            );
        }
    };

    const getItemName = (itemId: string): string => {
        const shopItem = ALL_SHOP_ITEMS.find(item => item.id === itemId);
        return shopItem?.name || itemId;
    };

    const renderCraftingInfo = (activity: TrainingActivity) => {
        if (trainingType !== 'kitchen-lab' || !activity.requiredItems || !activity.producedItems) {
            return null;
        }

        return (
            <div className="crafting-info">
                <div className="required-items">
                    <h4>Vajalikud materjalid:</h4>
                    <ul>
                        {activity.requiredItems.map((item, index) => {
                            const inventoryItem = playerStats?.inventory?.find(inv => inv.id === item.id);
                            const currentQuantity = inventoryItem?.quantity || 0;
                            const hasEnough = currentQuantity >= item.quantity;

                            return (
                                <li key={index} className={`material-item ${hasEnough ? 'available' : 'missing'}`}>
                                <span className="material-status-icon">
                                    {hasEnough ? '✅' : '❌'}
                                </span>
                                    <span className="material-details">
                                    {item.quantity}x {getItemName(item.id)}
                                        <span className="material-count">
                                        ({currentQuantity}/{item.quantity})
                                    </span>
                                </span>
                                </li>
                            );
                        })}
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

    // Rest of component remains the same...
    const groupedActivities = activities.reduce((groups, activity) => {
        const level = activity.requiredLevel;
        if (!groups[level]) {
            groups[level] = [];
        }
        groups[level].push(activity);
        return groups;
    }, {} as Record<number, TrainingActivity[]>);

    const sortedLevels = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b);

    // NEW: Enhanced button logic
    const getButtonState = () => {
        if (!selectedActivityData) return { disabled: true, text: 'Vali tegevus' };

        if (isTraining) return { disabled: true, text: 'Treenid...' };

        if (!canTrainActivity(selectedActivityData)) {
            return { disabled: true, text: `Nõutav tase ${selectedActivityData.requiredLevel}` };
        }

        if (remainingClicks === 0) {
            return { disabled: true, text: 'Treeningud otsas' };
        }

        // NEW: Check materials for kitchen/lab
        if (trainingType === 'kitchen-lab') {
            const materialCheck = hasRequiredMaterials(selectedActivityData);
            if (!materialCheck.hasAll) {
                return { disabled: true, text: 'Materjalid puuduvad' };
            }
        }

        return {
            disabled: false,
            text: trainingType === 'sports' ? 'Treeni' : 'Valmista'
        };
    };

    const buttonState = getButtonState();

    return (
        <div className="activity-selector">
            <h3 className="selector-title">{getSelectorTitle()}</h3>

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
                    {!canTrainActivity(selectedActivityData) && (
                        <div className="requirement-warning">
                            <span className="warning-icon">⚠️</span>
                            <div className="warning-content">
                                <strong>Treeningut ei saa sooritada</strong>
                                <p>Nõutav tase: {selectedActivityData.requiredLevel}</p>
                                <p>Sinu tase: {playerLevel}</p>
                            </div>
                        </div>
                    )}

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

                    {renderCraftingInfo(selectedActivityData)}

                    <div className="activity-rewards">
                        <h4>Tasu:</h4>
                        <ul>
                            {renderRewards(selectedActivityData)}
                            <li className="exp-reward">⭐ Kogemus: +{selectedActivityData.rewards.playerExp}</li>
                        </ul>
                    </div>

                    <button
                        className={`train-button ${buttonState.disabled ? 'disabled' : ''} ${remainingClicks === 0 ? 'no-clicks' : ''}`}
                        onClick={onTrain}
                        disabled={buttonState.disabled}
                    >
                        <span className="button-text">{buttonState.text}</span>
                        {!buttonState.disabled && (
                            <span className="clicks-badge">{remainingClicks}</span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};