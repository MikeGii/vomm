// src/components/training/ActivitySelector.tsx - FIXED VERSION
import React, { useState, useEffect} from 'react';
import { TrainingActivity, PlayerStats } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import { CRAFTING_INGREDIENTS } from '../../data/shop/craftingIngredients';
import { getBaseIdFromInventoryId } from '../../utils/inventoryUtils';
import '../../styles/components/training/ActivitySelector.css';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { purchaseItem } from '../../services/ShopService';
import { getAllItemsWithStock } from '../../services/ShopStockService';
import { ALL_SHOP_ITEMS } from '../../data/shop';

interface ActivitySelectorProps {
    activities: TrainingActivity[];
    selectedActivity: string;
    onActivitySelect: (activityId: string) => void;
    onTrain: () => void;
    onTrain5x?: () => void;
    onTrainCustom?: (amount: number) => void;
    onRefreshStats?: () => Promise<void>;
    isTraining: boolean;
    playerStats: PlayerStats | null;
    trainingType?: 'sports' | 'kitchen-lab' | 'handicraft';
}

export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
                                                                      activities,
                                                                      selectedActivity,
                                                                      onActivitySelect,
                                                                      onTrain,
                                                                      onTrain5x,
                                                                      onTrainCustom,
                                                                      onRefreshStats,
                                                                      isTraining,
                                                                      playerStats,
                                                                      trainingType = 'sports'
                                                                  }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);
    const equipmentBonuses = playerStats?.equipment ? calculateEquipmentBonuses(playerStats.equipment) : null;

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const playerLevel = playerStats?.level || 1;
    const { canUse3DPrinter, canUseLaserCutter } = useEstate();

    const [customAmount, setCustomAmount] = useState<string>('');
    // eslint-disable-next-line
    const [customAmountError, setCustomAmountError] = useState<string>('');

    const [purchasingItems, setPurchasingItems] = useState<Record<string, boolean>>({});
    const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, number>>({});

    const [stockData, setStockData] = useState<Map<string, number>>(new Map());

    // Check stock for required items when activity changes
    useEffect(() => {
        if (selectedActivityData?.requiredItems) {
            const loadStockData = async () => {
                try {
                    const itemsWithStock = await getAllItemsWithStock();
                    const stockMap = new Map<string, number>();

                    itemsWithStock.forEach(({ item, currentStock, hasUnlimitedStock }) => {
                        stockMap.set(item.id, hasUnlimitedStock ? 999999 : currentStock);
                    });

                    setStockData(stockMap);
                } catch (error) {
                    console.error('Error loading stock data:', error);
                }
            };

            void loadStockData();
        }
    }, [selectedActivityData?.requiredItems]);

    const getItemStockAmount = (itemId: string): number => {
        return stockData.get(itemId) ?? -1;
    };

    const handlePurchaseMaterial = async (itemId: string, quantity: number) => {
        if (!currentUser || !playerStats) return;

        // ADDED: Validate quantity before making purchase
        if (quantity < 1) {
            showToast('Kogus peab olema vähemalt 1', 'error');
            return;
        }

        if (quantity > 9999) {
            showToast('Maksimaalne kogus on 9999 tükki', 'error');
            return;
        }

        setPurchasingItems(prev => ({ ...prev, [itemId]: true }));

        try {
            const result = await purchaseItem(currentUser.uid, itemId, quantity);
            if (result.success) {
                showToast(`Ostetud ${quantity}x ${getItemName(itemId)}`, 'success');
                // Update local stock data
                setStockData(prev => {
                    const newMap = new Map(prev);
                    const currentStock = newMap.get(itemId) || 0;
                    if (currentStock !== 999999) { // Don't update unlimited stock items
                        newMap.set(itemId, Math.max(0, currentStock - quantity));
                    }
                    return newMap;
                });
                // Trigger parent refresh if available
                if (onRefreshStats) {
                    await onRefreshStats();
                }
            } else {
                // ENHANCED: Show more specific error messages
                showToast(result.message || 'Ostmine ebaõnnestus', 'error');
            }
        } catch (error: any) {
            // ENHANCED: Better error handling
            console.error('Purchase error:', error);
            showToast(error.message || 'Viga ostmisel', 'error');
        } finally {
            setPurchasingItems(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const getItemPrice = (itemId: string): number => {
        const craftingItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);
        return craftingItem?.basePrice || 0;
    };

    const updatePurchaseQuantity = (itemId: string, quantity: number) => {
        const itemStock = getItemStockAmount(itemId);
        // UPDATED: Change max limit from 999 to 9999
        const maxAllowed = itemStock > 0 ? Math.min(9999, itemStock) : 9999;
        setPurchaseQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, Math.min(maxAllowed, quantity))
        }));
    };

    const getPurchaseQuantity = (itemId: string): number => {
        return purchaseQuantities[itemId] || 1;
    };

    const remainingClicks = trainingType === 'sports'
        ? (playerStats?.trainingData?.remainingClicks || 0)
        : trainingType === 'kitchen-lab'
            ? (playerStats?.kitchenLabTrainingData?.remainingClicks || 0)
            : (playerStats?.handicraftTrainingData?.remainingClicks || 0);

    const hasWorkshopEquipment = (type: 'printing' | 'lasercutting'): boolean => {
        if (type === 'printing') {
            return canUse3DPrinter();
        } else if (type === 'lasercutting') {
            return canUseLaserCutter();
        }
        return false;
    };

    const canTrainActivity = (activity: TrainingActivity): boolean => {
        if (!playerStats) return false;

        // Check level requirement
        if (playerLevel < activity.requiredLevel) return false;

        // Check workshop equipment requirements for handicraft activities
        if (trainingType === 'handicraft') {
            // Check if activity requires 3D printing but printer not equipped
            if (activity.rewards.printing && !hasWorkshopEquipment('printing')) {
                return false;
            }

            // Check if activity requires laser cutting but cutter not equipped
            if (activity.rewards.lasercutting && !hasWorkshopEquipment('lasercutting')) {
                return false;
            }
        }

        return true;
    };

    // Check if player has required materials
    const hasRequiredMaterials = (activity: TrainingActivity): { hasAll: boolean; missing: string[] } => {
        if ((trainingType !== 'kitchen-lab' && trainingType !== 'handicraft') || !activity.requiredItems || !playerStats?.inventory) {
            return { hasAll: true, missing: [] };
        }

        const missing: string[] = [];

        for (const required of activity.requiredItems) {
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
                    {activity.rewards.printing && (
                        <li>
                            {hasWorkshopEquipment('printing') ? (
                                <>🖨️ 3D Printimine: +{activity.rewards.printing}</>
                            ) : (
                                <>🔒 3D Printimine - Paigalda 3D printer töökodas</>
                            )}
                        </li>
                    )}
                    {activity.rewards.lasercutting && (
                        <li>
                            {hasWorkshopEquipment('lasercutting') ? (
                                <>🔧 Laserilõikus: +{activity.rewards.lasercutting}</>
                            ) : (
                                <>🔒 Laserilõikus - Paigalda laser cutter töökodas</>
                            )}
                        </li>
                    )}
                </>
            );
        }
    };

    const getItemName = (itemId: string): string => {
        const craftingItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);
        if (craftingItem) return craftingItem.name;

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
                    <div className="materials-compact-list">
                        {activity.requiredItems.map((item, index) => {
                            const currentQuantity = playerStats?.inventory
                                ? playerStats.inventory
                                    .filter(invItem => {
                                        const baseId = getBaseIdFromInventoryId(invItem.id);
                                        return baseId === item.id && invItem.category === 'crafting';
                                    })
                                    .reduce((sum, invItem) => sum + invItem.quantity, 0)
                                : 0;

                            const hasEnough = currentQuantity >= item.quantity;
                            const missing = Math.max(0, item.quantity - currentQuantity);
                            const itemPrice = getItemPrice(item.id);
                            const purchaseQty = getPurchaseQuantity(item.id);
                            const totalCost = itemPrice * purchaseQty;
                            const canAfford = (playerStats?.money || 0) >= totalCost;
                            const isPurchasing = purchasingItems[item.id] || false;

                            const itemStock = getItemStockAmount(item.id);
                            const isCheckingItemStock = stockData.size === 0 && selectedActivityData?.requiredItems;
                            const isOutOfStock = itemStock === 0;
                            const hasStockForPurchase = itemStock >= purchaseQty || itemStock === -1;

                            return (
                                <div key={index} className={`material-compact ${hasEnough ? 'sufficient' : 'insufficient'}`}>
                                    <div className="material-main">
                                    <span className="material-icon">
                                        {hasEnough ? '✅' : '⚠️'}
                                    </span>
                                        <div className="material-details">
                                            <span className="material-name">{getItemName(item.id)}</span>
                                            <span className={`material-status ${hasEnough ? 'sufficient' : 'insufficient'}`}>
                                            {currentQuantity}/{item.quantity}
                                        </span>
                                        </div>

                                        {!hasEnough && itemPrice > 0 && (
                                            <div className="purchase-compact">
                                                {isCheckingItemStock ? (
                                                    <span className="stock-loading">⏳</span>
                                                ) : isOutOfStock ? (
                                                    <span className="stock-out">❌</span>
                                                ) : (
                                                    <>
                                                        <div className="qty-controls">
                                                            <button
                                                                className="qty-btn-sm"
                                                                onClick={() => updatePurchaseQuantity(item.id, purchaseQty - 1)}
                                                                disabled={purchaseQty <= 1 || isPurchasing}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="qty-display">{purchaseQty}</span>
                                                            <button
                                                                className="qty-btn-sm"
                                                                onClick={() => updatePurchaseQuantity(item.id, purchaseQty + 1)}
                                                                disabled={isPurchasing || (itemStock !== 999999 && purchaseQty >= Math.min(9999, itemStock))}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <button
                                                            className={`buy-btn-compact ${!canAfford ? 'no-funds' : !hasStockForPurchase ? 'no-stock' : ''}`}
                                                            onClick={() => handlePurchaseMaterial(item.id, purchaseQty)}
                                                            disabled={!canAfford || isPurchasing || !hasStockForPurchase}
                                                            title={
                                                                !canAfford ? `Pole raha (${totalCost}€)` :
                                                                    !hasStockForPurchase ? `Laos ${itemStock}` :
                                                                        `Osta ${purchaseQty}x (${totalCost}€)`
                                                            }
                                                        >
                                                            {isPurchasing ? '⏳' : `${totalCost}€`}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!hasEnough && (
                                        <div className="material-info-compact">
                                            <span className="missing-info">Puudub: {missing}</span>
                                            {itemStock !== -1 && (
                                                <span className="stock-info-compact">
                                                Laos: {itemStock === 999999 ? '∞' : itemStock}
                                            </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="produced-items">
                    <h4>Toodetakse:</h4>
                    <div className="produced-compact-list">
                        {activity.producedItems.map((item, index) => (
                            <span key={index} className="produced-compact">
                            🏭 {getItemName(item.id)} x{item.quantity}
                        </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const groupedActivities = activities.reduce((groups, activity) => {
        const level = activity.requiredLevel;
        if (!groups[level]) {
            groups[level] = [];
        }
        groups[level].push(activity);
        return groups;
    }, {} as Record<number, TrainingActivity[]>);

    const getFilteredLevels = () => {
        const allLevels = Object.keys(groupedActivities).map(Number).sort((a, b) => a - b);

        if (trainingType !== 'sports') {
            return allLevels;
        }

        const unlockedLevels = allLevels.filter(level => level <= playerLevel);

        if (unlockedLevels.length <= 1) {
            return unlockedLevels;
        }

        return unlockedLevels.slice(-1);
    };

    const sortedLevels = getFilteredLevels();

    const canTrain5x = (): { canTrain: boolean; reason?: string } => {
        if (!selectedActivityData) return { canTrain: false, reason: 'Vali tegevus' };

        // Check if we have at least 5 clicks
        if (remainingClicks < 5) {
            return { canTrain: false, reason: `Vajad vähemalt 5 treeningut (sul on ${remainingClicks})` };
        }

        // Check level requirement
        if (!canTrainActivity(selectedActivityData)) {
            return { canTrain: false, reason: 'Nõuded pole täidetud' };
        }

        // Check materials for kitchen/lab and handicraft (need 5x the materials)
        if ((trainingType === 'kitchen-lab' || trainingType === 'handicraft') && selectedActivityData.requiredItems) {
            for (const required of selectedActivityData.requiredItems) {
                const needed5x = required.quantity * 5;

                const currentQuantity = playerStats?.inventory
                    ? playerStats.inventory
                        .filter(invItem => {
                            const baseId = getBaseIdFromInventoryId(invItem.id);
                            return baseId === required.id && invItem.category === 'crafting';
                        })
                        .reduce((sum, invItem) => sum + invItem.quantity, 0)
                    : 0;

                if (currentQuantity < needed5x) {
                    const itemName = getItemName(required.id);
                    return { canTrain: false, reason: `${itemName}: vajad ${needed5x}, sul on ${currentQuantity}` };
                }
            }
        }

        return { canTrain: true };
    };

    const validateCustomAmount = (amount: number): { isValid: boolean; error: string } => {
        if (!selectedActivityData) return { isValid: false, error: 'Vali tegevus' };

        if (amount < 1) return { isValid: false, error: 'Miinimum 1 treening' };
        if (amount > 999) return { isValid: false, error: 'Maksimum 999 treeningut' };
        if (amount > remainingClicks) {
            return { isValid: false, error: `Pole piisavalt klikke (${remainingClicks} saadaval)` };
        }

        // Check level requirement
        if (!canTrainActivity(selectedActivityData)) {
            return { isValid: false, error: 'Nõuded pole täidetud' };
        }

        // Check materials for kitchen/lab and handicraft
        if ((trainingType === 'kitchen-lab' || trainingType === 'handicraft') && selectedActivityData.requiredItems) {
            for (const required of selectedActivityData.requiredItems) {
                const neededCustom = required.quantity * amount;

                const currentQuantity = playerStats?.inventory
                    ? playerStats.inventory
                        .filter(invItem => {
                            const baseId = getBaseIdFromInventoryId(invItem.id);
                            return baseId === required.id && invItem.category === 'crafting';
                        })
                        .reduce((sum, invItem) => sum + invItem.quantity, 0)
                    : 0;

                if (currentQuantity < neededCustom) {
                    const itemName = getItemName(required.id);
                    return { isValid: false, error: `${itemName}: vajad ${neededCustom}, sul on ${currentQuantity}` };
                }
            }
        }

        return { isValid: true, error: '' };
    };

    const handleCustomAmountChange = (value: string) => {
        // Allow empty string and any number input
        setCustomAmount(value);
        // Clear any existing errors when user types
        setCustomAmountError('');
    };

    const canTrainCustom = (): { canTrain: boolean; reason?: string } => {
        if (!selectedActivityData) return { canTrain: false, reason: 'Vali tegevus' };

        // Parse customAmount to number at the beginning
        const amount = parseInt(customAmount) || 0;

        if (customAmount === '' || amount < 1) return { canTrain: false, reason: 'Sisesta treeningute arv' };
        if (amount > remainingClicks) {
            return { canTrain: false, reason: `Pole piisavalt klikke (${remainingClicks})` };
        }

        // Check level requirement
        if (!canTrainActivity(selectedActivityData)) {
            return { canTrain: false, reason: 'Nõuded pole täidetud' };
        }

        // Check materials for kitchen/lab and handicraft (need amount x materials)
        if ((trainingType === 'kitchen-lab' || trainingType === 'handicraft') && selectedActivityData.requiredItems) {
            for (const required of selectedActivityData.requiredItems) {
                const neededCustom = required.quantity * amount;  // Now using 'amount' which is a number

                const currentQuantity = playerStats?.inventory
                    ? playerStats.inventory
                        .filter(invItem => {
                            const baseId = getBaseIdFromInventoryId(invItem.id);
                            return baseId === required.id && invItem.category === 'crafting';
                        })
                        .reduce((sum, invItem) => sum + invItem.quantity, 0)
                    : 0;

                if (currentQuantity < neededCustom) {
                    const itemName = getItemName(required.id);
                    return { canTrain: false, reason: `${itemName}: vajad ${neededCustom}, sul on ${currentQuantity}` };
                }
            }
        }

        return { canTrain: true };
    };

    const getButtonState = () => {
        if (!selectedActivityData) return { disabled: true, text: 'Vali tegevus' };

        if (isTraining) return { disabled: true, text: 'Treenid...' };

        if (!canTrainActivity(selectedActivityData)) {
            // Check specific reason for inability to train
            if (playerLevel < selectedActivityData.requiredLevel) {
                return { disabled: true, text: `Nõutav tase ${selectedActivityData.requiredLevel}` };
            }

            // Check workshop equipment for handicraft
            if (trainingType === 'handicraft') {
                if (selectedActivityData.rewards.printing && !hasWorkshopEquipment('printing')) {
                    return { disabled: true, text: '3D printer puudub' };
                }
                if (selectedActivityData.rewards.lasercutting && !hasWorkshopEquipment('lasercutting')) {
                    return { disabled: true, text: 'Laser cutter puudub' };
                }
            }
        }

        if (remainingClicks === 0) {
            return { disabled: true, text: 'Treeningud otsas' };
        }

        // Check materials for kitchen/lab and handicraft
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
                                <strong>Tegevust ei saa sooritada</strong>
                                {playerLevel < selectedActivityData.requiredLevel && (
                                    <>
                                        <p>Nõutav tase: {selectedActivityData.requiredLevel}</p>
                                        <p>Sinu tase: {playerLevel}</p>
                                    </>
                                )}
                                {trainingType === 'handicraft' && (
                                    <>
                                        {selectedActivityData.rewards.printing && !hasWorkshopEquipment('printing') && (
                                            <p>🖨️ Vajad paigaldatud 3D printerit töökodas</p>
                                        )}
                                        {selectedActivityData.rewards.lasercutting && !hasWorkshopEquipment('lasercutting') && (
                                            <p>🔧 Vajad paigaldatud laser cutterit töökodas</p>
                                        )}
                                    </>
                                )}
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

                    <div className="training-buttons">
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

                        <button
                            className={`train-button train-5x ${!canTrain5x().canTrain ? 'disabled' : ''}`}
                            onClick={() => onTrain5x?.()}
                            disabled={!canTrain5x().canTrain || isTraining}
                            title={!canTrain5x().canTrain ? canTrain5x().reason : undefined}
                        >
                            <span className="button-text">
                                {isTraining ? 'Treenid...' :
                                    trainingType === 'sports' ? 'Treeni 5x' : 'Valmista 5x'}
                            </span>
                            {canTrain5x().canTrain && !isTraining && (
                                <span className="clicks-badge">{remainingClicks}</span>
                            )}
                        </button>

                        <div className="vip-training-section">
                            <div className="vip-header">
                                <div className="vip-badge">
                                    <span className="crown-icon">👑</span>
                                    <span className="vip-text">VIP Treening</span>
                                </div>
                                {!playerStats?.isVip && (
                                    <div className="vip-unlock-hint">
                                        Vali suvaline arv treeninguid
                                    </div>
                                )}
                            </div>

                            <div className={`vip-controls ${!playerStats?.isVip ? 'locked' : ''}`}>
                                <div className="amount-input-container">
                                    <label className="input-label">Kogus:</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="number"
                                            min="1"
                                            max="999"
                                            value={customAmount}
                                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                                            className="vip-amount-input"
                                            disabled={!playerStats?.isVip || isTraining}
                                            placeholder={playerStats?.isVip ? "Sisesta" : "VIP"}
                                        />
                                        <div className="input-suffix">x</div>
                                    </div>
                                    {/* Error will be shown as toast on button click */}
                                </div>

                                <button
                                    className={`vip-train-button ${
                                        !playerStats?.isVip ? 'vip-locked' :
                                            (!selectedActivityData || isTraining || remainingClicks === 0) ? 'disabled' : ''
                                    }`}
                                    onClick={() => {
                                        if (!playerStats?.isVip) return;

                                        // Parse the amount
                                        const amount = parseInt(customAmount) || 0;

                                        // Check if empty or invalid
                                        if (customAmount === '' || amount < 1) {
                                            showToast('Sisesta treeningute arv', 'error');
                                            return;
                                        }

                                        // Validate when button is clicked
                                        const validation = validateCustomAmount(amount);
                                        if (!validation.isValid) {
                                            setCustomAmountError(validation.error);
                                            showToast(validation.error, 'error');
                                            return;
                                        }

                                        // Clear error and proceed with training
                                        setCustomAmountError('');
                                        onTrainCustom?.(amount);
                                    }}
                                    disabled={!playerStats?.isVip || !selectedActivityData || isTraining || remainingClicks === 0}
                                    title={
                                        !playerStats?.isVip ? 'VIP funktsioon - Vali suvaline arv treeninguid' :
                                            !canTrainCustom().canTrain ? canTrainCustom().reason :
                                                `Treeni ${customAmount} korda`
                                    }
                                >
                                    <div className="button-content">
                                        <span className="button-text">
                                            {!playerStats?.isVip ? 'Ava VIP-ga' :
                                                isTraining ? 'Treenid...' :
                                                    !canTrainCustom().canTrain ? 'Pole võimalik' :
                                                        trainingType === 'sports' ? 'Treeni' : 'Valmista'}
                                        </span>
                                        {playerStats?.isVip && canTrainCustom().canTrain && !isTraining && (
                                            <span className="clicks-remaining">{remainingClicks} klikki</span>
                                        )}
                                    </div>
                                    {!playerStats?.isVip && (
                                        <div className="vip-overlay">
                                            <span className="lock-icon">🔒</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};