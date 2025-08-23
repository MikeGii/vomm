// src/components/training/ActivitySelector.tsx - UUENDUS
import React from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
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
    trainingType?: 'sports' | 'kitchen-lab' | 'handicraft';
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
        : trainingType === 'kitchen-lab'
            ? (playerStats?.kitchenLabTrainingData?.remainingClicks || 0)
            : (playerStats?.handicraftTrainingData?.remainingClicks || 0);

    const canTrainActivity = (activity: TrainingActivity): boolean => {
        if (!playerStats) return false;
        return playerLevel >= activity.requiredLevel;
    };

    // Check if player has required materials
    const hasRequiredMaterials = (activity: TrainingActivity): { hasAll: boolean; missing: string[] } => {
        if ((trainingType !== 'kitchen-lab' && trainingType !== 'handicraft') || !activity.requiredItems || !playerStats?.inventory) {
            return { hasAll: true, missing: [] };
        }

        const missing: string[] = [];

        for (const required of activity.requiredItems) {
            // Sum quantities of all items with matching base ID - FIXED
            const totalQuantity = playerStats.inventory
                .filter(item => {
                    const baseId = getBaseIdFromInventoryId(item.id);
                    return baseId === required.id && item.category === 'crafting';
                })
                .reduce((sum, item) => sum + item.quantity, 0);

            if (totalQuantity < required.quantity) {
                const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === required.id);
                const itemName = shopItem?.name || required.id;
                missing.push(`${itemName} (${totalQuantity}/${required.quantity})`);
            }
        }

        return {
            hasAll: missing.length === 0,
            missing
        };
    };

    const getSelectorTitle = (): string => {
        if (trainingType === 'sports') return 'Vali treening';
        if (trainingType === 'kitchen-lab') return 'Vali köök/labor tegevus';
        return 'Vali käsitöö tegevus';
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
        } else if (trainingType === 'kitchen-lab') {
            return (
                <>
                    {activity.rewards.cooking && (<li>🍳 Toidu valmistamine: +{activity.rewards.cooking}</li>)}
                    {activity.rewards.brewing && (<li>🥤 Joogi valmistamine: +{activity.rewards.brewing}</li>)}
                    {activity.rewards.chemistry && (<li>🧪 Keemia valmistamine: +{activity.rewards.chemistry}</li>)}
                </>
            );
        } else {
            return (
                <>
                    {activity.rewards.sewing && (<li>🪡 Õmblemine: +{activity.rewards.sewing}</li>)}
                    {activity.rewards.medicine && (<li>🏥 Meditsiin: +{activity.rewards.medicine}</li>)}
                </>
            );
        }
    };

    const getItemName = (itemId: string): string => {
        // First try to find in CRAFTING_INGREDIENTS
        const craftingItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);
        if (craftingItem) return craftingItem.name;

        // Fallback to ALL_SHOP_ITEMS
        const shopItem = ALL_SHOP_ITEMS.find(item => item.id === itemId);
        return shopItem?.name || itemId;
    };

    const renderCraftingInfo = (activity: TrainingActivity) => {
        if ((trainingType !== 'kitchen-lab' && trainingType !== 'handicraft') || !activity.requiredItems || !activity.producedItems) {
            return null;
        }

        return (
            <div className="crafting-info">
                <div className="required-items">
                    <h4>Vajalikud materjalid:</h4>
                    <ul>
                        {activity.requiredItems.map((item, index) => {
                            // Sum quantities using base ID extraction - FIXED
                            const currentQuantity = playerStats?.inventory
                                ? playerStats.inventory
                                    .filter(invItem => {
                                        const baseId = getBaseIdFromInventoryId(invItem.id); // FIXED
                                        return baseId === item.id && invItem.category === 'crafting';
                                    })
                                    .reduce((sum, invItem) => sum + invItem.quantity, 0)
                                : 0;

                            const hasEnough = currentQuantity >= item.quantity;

                            return (
                                <li key={index} className={`material-item ${hasEnough ? 'available' : 'missing'}`}>
                                <span className="material-status-icon">
                                    {hasEnough ? '✅' : '❌'}
                                </span>
                                    <span className="material-name">
                                    {getItemName(item.id)}
                                </span>
                                    <span className="material-quantity">
                                    {currentQuantity}/{item.quantity}
                                </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="produced-items">
                    <h4>Toodetakse:</h4>
                    <ul>
                        {activity.producedItems.map((item, index) => (
                            <li key={index} className="produced-item">
                                <span className="produced-icon">🏭</span>
                                <span className="produced-name">
                                {getItemName(item.id)}
                            </span>
                                <span className="produced-quantity">
                                x{item.quantity}
                            </span>
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

    // NEW: Filter for sports - show only last 2 unlocked levels
    const getFilteredLevels = () => {
        const allLevels = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b);

        if (trainingType !== 'sports') {
            // Kitchen/lab shows all levels
            return allLevels;
        }

        // For sports: show only last 2 unlocked levels
        const unlockedLevels = allLevels.filter(level => level <= playerLevel);

        if (unlockedLevels.length <= 2) {
            return unlockedLevels;
        }

        // Take last 2 unlocked levels
        return unlockedLevels.slice(-2);
    };

    const sortedLevels = getFilteredLevels();

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
        if (trainingType === 'kitchen-lab' || trainingType === 'handicraft') {
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
                        label={`Tase ${requiredLevel} ${trainingType === 'sports' ? 'treeningud' : 'tooted'} ${playerLevel < requiredLevel ? '(lukus)' : ''}`}
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