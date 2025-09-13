// src/services/TrainingService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
    PlayerStats,
    PlayerAttributes,
    AttributeData,
    TrainingData,
    KitchenLabTrainingData,
    HandicraftTrainingData, TrainingActivity
} from '../types';
import {calculateLevelFromExp, calculatePlayerHealth} from "./PlayerService";
import { getTrainingBonusForAttribute} from "../data/abilities";
import { getKitchenLabActivityById } from '../data/kitchenLabActivities';
import { getHandicraftActivityById } from '../data/handicraftActivities';
import { CRAFTING_INGREDIENTS } from '../data/shop/craftingIngredients';
import { ALL_SHOP_ITEMS } from '../data/shop';
import { InventoryItem } from '../types';
import { getBaseIdFromInventoryId, createTimestampedId } from '../utils/inventoryUtils';
import { updateProgress } from "./TaskService";
import {
    applyKitchenBonus,
    KitchenBonusResult
} from './KitchenBonusService';

// Calculate experience needed for next attribute level
export const calculateExpForNextLevel = (currentLevel: number): number => {
    if (currentLevel === 0) return 100;
    const baseExp = (currentLevel + 1) * 100;
    const bonus = baseExp * 0.15;
    return Math.floor(baseExp + bonus);
};

// Initialize attributes for new players
export const initializeAttributes = (): PlayerAttributes => {
    const createAttribute = (): AttributeData => ({
        level: 0,
        experience: 0,
        experienceForNextLevel: 100
    });

    return {
        strength: createAttribute(),
        agility: createAttribute(),
        dexterity: createAttribute(),
        intelligence: createAttribute(),
        endurance: createAttribute(),
        cooking: createAttribute(),
        brewing: createAttribute(),
        chemistry: createAttribute(),
        sewing: createAttribute(),
        medicine: createAttribute(),
        printing: createAttribute(),
        lasercutting: createAttribute(),
        handling: createAttribute(),
        reactionTime: createAttribute(),
        gearShifting: createAttribute()
    };
};

// Initialize training data
export const initializeTrainingData = (): TrainingData => {
    return {
        remainingClicks: 50,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: 0
    };
};

export const initializeKitchenLabTrainingData = (): KitchenLabTrainingData => {
    return {
        remainingClicks: 50,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: 0
    };
};

export const initializeHandicraftTrainingData = (): HandicraftTrainingData => {
    return {
        remainingClicks: 50,
        lastResetTime: Timestamp.now(),
        totalTrainingsDone: 0
    };
};

// Helper function to check if player has required materials
const hasRequiredMaterials = (
    inventory: InventoryItem[],
    requiredItems: { id: string; quantity: number }[]
): { hasAll: boolean; missing: { id: string; needed: number; has: number }[] } => {
    const missing: { id: string; needed: number; has: number }[] = [];

    for (const required of requiredItems) {
        // SECURITY: Validate input to prevent negative quantities
        if (required.quantity < 0) {
            throw new Error('Invalid required quantity');
        }

        // Sum quantities of all items with matching base ID
        const totalQuantity = inventory
            .filter(item => {
                const baseId = getBaseIdFromInventoryId(item.id);
                return baseId === required.id && item.category === 'crafting' && item.quantity > 0;
            })
            .reduce((sum, item) => sum + Math.max(0, item.quantity), 0); // Ensure no negative quantities

        if (totalQuantity < required.quantity) {
            missing.push({
                id: required.id,
                needed: required.quantity,
                has: totalQuantity
            });
        }
    }

    return {
        hasAll: missing.length === 0,
        missing
    };
};

// Helper function to create proper InventoryItem from shop data
const createInventoryItemFromId = (itemId: string, quantity: number): InventoryItem => {
    // SECURITY: Validate inputs
    if (!itemId || quantity <= 0) {
        throw new Error('Invalid item creation parameters');
    }

    // First check CRAFTING_INGREDIENTS
    let shopItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);

    // If not found, check ALL_SHOP_ITEMS (for equipment)
    if (!shopItem) {
        shopItem = ALL_SHOP_ITEMS.find(item => item.id === itemId);
    }

    if (!shopItem) {
        throw new Error(`Item ${itemId} not found in shop items`);
    }

    const inventoryItem: InventoryItem = {
        id: createTimestampedId(itemId),
        name: shopItem.name,
        description: shopItem.description,
        category: shopItem.category === 'protection' ? 'equipment' :
            shopItem.category === 'workshop' ? 'equipment' : 'crafting',
        quantity: Math.max(1, Math.floor(quantity)), // Ensure positive integer
        shopPrice: shopItem.basePrice,
        source: 'training',
        obtainedAt: new Date()
    };

    // Copy equipment properties
    if (shopItem.equipmentSlot) {
        inventoryItem.equipmentSlot = shopItem.equipmentSlot;
    }
    if (shopItem.stats) {
        inventoryItem.stats = shopItem.stats;
    }
    if (shopItem.workshopStats) {
        inventoryItem.workshopStats = shopItem.workshopStats;
    }
    if (shopItem.consumableEffect) {
        inventoryItem.consumableEffect = shopItem.consumableEffect;
    }

    return inventoryItem;
};

// Helper function to update inventory after crafting
export const updateInventoryForCrafting = (
    inventory: InventoryItem[],
    requiredItems: { id: string; quantity: number }[],
    producedItems: { id: string; quantity: number }[],
    playerStats?: any, // Lisa köögiboonuse jaoks
    activityName?: string // Lisa toast märguande jaoks
): {
    updatedInventory: InventoryItem[],
    kitchenBonusResult?: KitchenBonusResult & { activityName?: string }
} => {
    let updatedInventory = [...inventory];
    let kitchenBonusResult: (KitchenBonusResult & { activityName?: string }) | undefined;

    // SECURITY: Validate inventory isn't null/undefined
    if (!Array.isArray(updatedInventory)) {
        updatedInventory = [];
    }

    // Remove required materials by base ID (SAMA KUI ENNE)
    requiredItems.forEach(required => {
        // SECURITY: Validate quantities
        if (required.quantity <= 0) return;

        let remainingToRemove = Math.floor(required.quantity); // Ensure integer

        for (let i = updatedInventory.length - 1; i >= 0 && remainingToRemove > 0; i--) {
            const item = updatedInventory[i];
            if (!item || item.quantity <= 0) continue; // Skip invalid items

            const baseId = getBaseIdFromInventoryId(item.id);

            if (baseId === required.id && item.category === 'crafting') {
                if (item.quantity <= remainingToRemove) {
                    remainingToRemove -= item.quantity;
                    updatedInventory.splice(i, 1);
                } else {
                    updatedInventory[i] = {
                        ...item,
                        quantity: Math.max(0, item.quantity - remainingToRemove)
                    };
                    remainingToRemove = 0;
                }
            }
        }
    });

    // Add produced items WITH KITCHEN BONUS (UUS LOOGIKA)
    producedItems.forEach(produced => {
        // SECURITY: Validate produced items
        if (produced.quantity <= 0) return;

        let finalQuantity = Math.max(1, Math.floor(produced.quantity));

        // RAKENDA KÖÖGIBOONUST TOODETUD KOGUSELE
        if (playerStats) {
            const bonusResult = applyKitchenBonus(playerStats, finalQuantity);
            finalQuantity = bonusResult.finalAmount;

            // Salvesta boonuse tulemused toast märguande jaoks (ainult esimest korda)
            if (bonusResult.bonusApplied && !kitchenBonusResult) {
                kitchenBonusResult = {
                    ...bonusResult,
                    activityName: activityName || 'tundmatu tegevus'
                };
            }
        }

        // Check if item already exists by base ID (SAMA KUI ENNE)
        const existingIndex = updatedInventory.findIndex(item => {
            const baseId = getBaseIdFromInventoryId(item.id);
            return baseId === produced.id && !item.equipped && item.quantity > 0;
        });

        if (existingIndex >= 0) {
            // Stack with existing item
            updatedInventory[existingIndex] = {
                ...updatedInventory[existingIndex],
                quantity: updatedInventory[existingIndex].quantity + finalQuantity
            };
        } else {
            // Create new item
            try {
                const newItem = createInventoryItemFromId(produced.id, finalQuantity);
                updatedInventory.push(newItem);
            } catch (error) {
                console.error(`Failed to create item ${produced.id}:`, error);
                // Continue without adding the item rather than failing completely
            }
        }
    });

    return {
        updatedInventory,
        kitchenBonusResult
    };
};

// NEW: Get workshop device success rate from estate
export const getWorkshopSuccessRate = async (
    userId: string,
    activityRewards: { printing?: number; lasercutting?: number }
): Promise<number> => {
    try {
        // SECURITY: Validate user ID
        if (!userId || typeof userId !== 'string') {
            return 100;
        }

        // Import estate service to get player estate
        const { getPlayerEstate } = await import('./EstateService');
        const playerEstate = await getPlayerEstate(userId);

        if (!playerEstate) return 100; // Default success for non-workshop activities

        // Check if activity requires 3D printing
        if (activityRewards.printing && playerEstate.equippedDeviceDetails?.printer) {
            const device = playerEstate.equippedDeviceDetails.printer;

            // Use new workshopStats system only
            if (device.workshopStats?.successRate !== undefined) {
                const rate = device.workshopStats.successRate;
                return Math.max(0, Math.min(100, Math.floor(rate)));
            }

            // No fallback - if no workshopStats, return default low success rate
            console.warn('3D printer device missing workshopStats, using default 50% success rate');
            return 50;
        }

        // Check if activity requires laser cutting
        if (activityRewards.lasercutting && playerEstate.equippedDeviceDetails?.laserCutter) {
            const device = playerEstate.equippedDeviceDetails.laserCutter;

            // Use new workshopStats system only
            if (device.workshopStats?.successRate !== undefined) {
                const rate = device.workshopStats.successRate;
                return Math.max(0, Math.min(100, Math.floor(rate)));
            }

            // No fallback - if no workshopStats, return default low success rate
            console.warn('Laser cutter device missing workshopStats, using default 50% success rate');
            return 50;
        }

        return 100; // Default for non-workshop activities or when no equipment
    } catch (error) {
        console.error('Error getting workshop success rate:', error);
        return 100; // Default to 100% success on error
    }
};

// NEW: Perform workshop crafting with success rate
const performWorkshopCrafting = async (
    userId: string,
    activity: TrainingActivity,
    inventory: InventoryItem[]
): Promise<{ success: boolean; itemsProduced: boolean; updatedInventory: InventoryItem[] }> => {

    // SECURITY: Validate inputs
    if (!userId || !activity || !Array.isArray(inventory)) {
        throw new Error('Invalid workshop crafting parameters');
    }

    // Get success rate for this workshop activity
    const successRate = await getWorkshopSuccessRate(userId, activity.rewards);

    // Always consume materials first (regardless of success)
    let updatedInventory = [...inventory];
    if (activity.requiredItems && activity.requiredItems.length > 0) {
        const result = updateInventoryForCrafting(
            updatedInventory,
            activity.requiredItems,
            [] // Don't add items yet, wait for success check
        );
        updatedInventory = result.updatedInventory;
    }

    // Roll for crafting success with cryptographically secure random if available
    const roll = (typeof crypto !== 'undefined' && crypto.getRandomValues)
        ? crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * 100
        : Math.random() * 100;

    const craftingSuccess = roll < successRate;

    // DEBUG: Log the roll and success rate for testing
    console.log(`Workshop crafting: roll=${roll.toFixed(2)}, successRate=${successRate}, success=${craftingSuccess}`);

    // If successful, add produced items to inventory
    if (craftingSuccess && activity.producedItems && activity.producedItems.length > 0) {
        const result = updateInventoryForCrafting(
            updatedInventory,
            [], // No materials to remove
            activity.producedItems // Add produced items
        );
        updatedInventory = result.updatedInventory;
    }

    return {
        success: true, // Training always succeeds (gives XP)
        itemsProduced: craftingSuccess,
        updatedInventory
    };
};

// Check if training clicks should reset (every full hour)
export const checkAndResetTrainingClicks = async (userId: string): Promise<TrainingData> => {
    // SECURITY: Validate user ID
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
    }

    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let trainingData = stats.trainingData || initializeTrainingData();

    // COMPREHENSIVE SAFETY CHECK: Clean all undefined values
    trainingData = {
        remainingClicks: Math.max(0, Math.floor(trainingData.remainingClicks ?? 50)),
        lastResetTime: trainingData.lastResetTime || Timestamp.now(),
        totalTrainingsDone: Math.max(0, Math.floor(trainingData.totalTrainingsDone ?? 0)),
        isWorking: trainingData.isWorking ?? false
    };

    // VIP LOGIC: Determine max clicks based on VIP status and work status
    let maxClicks: number;
    if (stats.isVip) {
        // VIP benefits: 100 clicks when not working, 30 when working
        maxClicks = stats.activeWork ? 30 : 100;
    } else {
        // Regular players: 50 clicks when not working, 10 when working
        maxClicks = stats.activeWork ? 10 : 50;
    }
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    try {
        if (trainingData.lastResetTime instanceof Timestamp) {
            lastReset = trainingData.lastResetTime.toDate();
        } else if (trainingData.lastResetTime && typeof trainingData.lastResetTime === 'object' && 'seconds' in trainingData.lastResetTime) {
            lastReset = new Date(trainingData.lastResetTime.seconds * 1000);
        } else {
            console.warn('Invalid lastResetTime, using current time');
            lastReset = now;
        }
    } catch (error) {
        console.error('Error parsing lastResetTime:', error);
        lastReset = now;
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    if (currentHour.getTime() > lastResetHour.getTime()) {
        trainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: trainingData.totalTrainingsDone ?? 0,
            isWorking: !!stats.activeWork
        };

        // GUARANTEED SAFE UPDATE: Explicitly construct clean object
        const safeUpdateData = {
            trainingData: {
                remainingClicks: Number(trainingData.remainingClicks) || maxClicks,
                lastResetTime: trainingData.lastResetTime,
                totalTrainingsDone: Number(trainingData.totalTrainingsDone) || 0,
                isWorking: Boolean(trainingData.isWorking)
            }
        };

        await updateDoc(statsRef, safeUpdateData);
    }

    return trainingData;
};

export const checkAndResetKitchenLabTrainingClicks = async (userId: string): Promise<KitchenLabTrainingData> => {
    // SECURITY: Validate user ID
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
    }

    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let kitchenLabTrainingData = stats.kitchenLabTrainingData || initializeKitchenLabTrainingData();

    // COMPREHENSIVE SAFETY CHECK: Clean all undefined values
    kitchenLabTrainingData = {
        remainingClicks: Math.max(0, Math.floor(kitchenLabTrainingData.remainingClicks ?? 50)),
        lastResetTime: kitchenLabTrainingData.lastResetTime || Timestamp.now(),
        totalTrainingsDone: Math.max(0, Math.floor(kitchenLabTrainingData.totalTrainingsDone ?? 0))
    };

    // VIP LOGIC: Determine max clicks based on VIP status and work status
    let maxClicks: number;
    if (stats.isVip) {
        maxClicks = stats.activeWork ? 30 : 100;
    } else {
        maxClicks = stats.activeWork ? 10 : 50;
    }

    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    try {
        if (kitchenLabTrainingData.lastResetTime instanceof Timestamp) {
            lastReset = kitchenLabTrainingData.lastResetTime.toDate();
        } else if (kitchenLabTrainingData.lastResetTime && typeof kitchenLabTrainingData.lastResetTime === 'object' && 'seconds' in kitchenLabTrainingData.lastResetTime) {
            lastReset = new Date(kitchenLabTrainingData.lastResetTime.seconds * 1000);
        } else {
            console.warn('Invalid lastResetTime, using current time');
            lastReset = now;
        }
    } catch (error) {
        console.error('Error parsing lastResetTime:', error);
        lastReset = now;
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    if (currentHour.getTime() > lastResetHour.getTime()) {
        kitchenLabTrainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: kitchenLabTrainingData.totalTrainingsDone ?? 0
        };

        const safeUpdateData = {
            kitchenLabTrainingData: {
                remainingClicks: Number(kitchenLabTrainingData.remainingClicks) || maxClicks,
                lastResetTime: kitchenLabTrainingData.lastResetTime,
                totalTrainingsDone: Number(kitchenLabTrainingData.totalTrainingsDone) || 0
            }
        };

        await updateDoc(statsRef, safeUpdateData);
    }

    return kitchenLabTrainingData;
};

export const checkAndResetHandicraftTrainingClicks = async (userId: string): Promise<HandicraftTrainingData> => {
    // SECURITY: Validate user ID
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
    }

    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let handicraftTrainingData = stats.handicraftTrainingData || initializeHandicraftTrainingData();

    // COMPREHENSIVE SAFETY CHECK: Clean all undefined values
    handicraftTrainingData = {
        remainingClicks: Math.max(0, Math.floor(handicraftTrainingData.remainingClicks ?? 50)),
        lastResetTime: handicraftTrainingData.lastResetTime || Timestamp.now(),
        totalTrainingsDone: Math.max(0, Math.floor(handicraftTrainingData.totalTrainingsDone ?? 0))
    };

    // VIP LOGIC: Determine max clicks based on VIP status and work status
    let maxClicks: number;
    if (stats.isVip) {
        maxClicks = stats.activeWork ? 30 : 100;
    } else {
        maxClicks = stats.activeWork ? 10 : 50;
    }

    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    try {
        if (handicraftTrainingData.lastResetTime instanceof Timestamp) {
            lastReset = handicraftTrainingData.lastResetTime.toDate();
        } else if (handicraftTrainingData.lastResetTime && typeof handicraftTrainingData.lastResetTime === 'object' && 'seconds' in handicraftTrainingData.lastResetTime) {
            lastReset = new Date(handicraftTrainingData.lastResetTime.seconds * 1000);
        } else {
            console.warn('Invalid lastResetTime, using current time');
            lastReset = now;
        }
    } catch (error) {
        console.error('Error parsing lastResetTime:', error);
        lastReset = now;
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    if (currentHour.getTime() > lastResetHour.getTime()) {
        handicraftTrainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: handicraftTrainingData.totalTrainingsDone ?? 0
        };

        const safeUpdateData = {
            handicraftTrainingData: {
                remainingClicks: Number(handicraftTrainingData.remainingClicks) || maxClicks,
                lastResetTime: handicraftTrainingData.lastResetTime,
                totalTrainingsDone: Number(handicraftTrainingData.totalTrainingsDone) || 0
            }
        };

        await updateDoc(statsRef, safeUpdateData);
    }

    return handicraftTrainingData;
};

// Main training function with material checking and crafting
export const performTraining = async (
    userId: string,
    activityId: string,
    rewards: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
        cooking?: number;
        brewing?: number;
        chemistry?: number;
        sewing?: number;
        medicine?: number;
        printing?: number;
        lasercutting?: number;
        playerExp: number;
    },
    trainingType: 'sports' | 'kitchen-lab' | 'handicraft' = 'sports'
): Promise<{
    updatedStats: PlayerStats;
    craftingResult?: {
        itemsProduced: boolean;
        isWorkshopActivity: boolean;
        activityName?: string;
    };
    kitchenBonusResult?: KitchenBonusResult & { activityName?: string };
}> => {
    // SECURITY: Validate all inputs
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
    }
    if (!activityId || typeof activityId !== 'string') {
        throw new Error('Invalid activity ID');
    }
    if (!rewards || typeof rewards.playerExp !== 'number' || rewards.playerExp < 0) {
        throw new Error('Invalid rewards data');
    }

    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;

    // Check training clicks
    if (trainingType === 'sports') {
        const trainingData = await checkAndResetTrainingClicks(userId);
        if (trainingData.remainingClicks <= 0) {
            throw new Error('Treeningkordi pole enam järel! Oota järgmist täistundi.');
        }
    } else if (trainingType === 'kitchen-lab') {
        const kitchenLabData = await checkAndResetKitchenLabTrainingClicks(userId);
        if (kitchenLabData.remainingClicks <= 0) {
            throw new Error('Treeningkordi pole enam järel! Oota järgmist täistundi.');
        }

        // Check materials for kitchen/lab activities
        const activity = getKitchenLabActivityById(activityId);
        if (activity && activity.requiredItems) {
            const materialCheck = hasRequiredMaterials(stats.inventory || [], activity.requiredItems);

            if (!materialCheck.hasAll) {
                const missingItems = materialCheck.missing.map(missing => {
                    const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === missing.id);
                    const itemName = shopItem?.name || missing.id;
                    return `${itemName}: vajad ${missing.needed}, sul on ${missing.has}`;
                }).join(', ');

                throw new Error(`Sul puuduvad materjalid: ${missingItems}`);
            }
        }
    } else if (trainingType === 'handicraft') {
        const handicraftData = await checkAndResetHandicraftTrainingClicks(userId);
        if (handicraftData.remainingClicks <= 0) {
            throw new Error('Käsitöö treeningkordi pole enam järel! Oota järgmist täistundi.');
        }

        // Check materials for handicraft activities
        const activity = getHandicraftActivityById(activityId);
        if (activity && activity.requiredItems) {
            const materialCheck = hasRequiredMaterials(stats.inventory || [], activity.requiredItems);

            if (!materialCheck.hasAll) {
                const missingItems = materialCheck.missing.map(missing => {
                    const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === missing.id);
                    const itemName = shopItem?.name || missing.id;
                    return `${itemName}: vajad ${missing.needed}, sul on ${missing.has}`;
                }).join(', ');

                throw new Error(`Sul puuduvad materjalid: ${missingItems}`);
            }
        }
    }

    // Initialize attributes if they don't exist
    const attributes = stats.attributes || initializeAttributes();

    // Update attributes based on rewards
    const updateAttribute = (attr: AttributeData, expGained: number): { updatedAttribute: AttributeData, levelsGained: number } => {
        // SECURITY: Validate experience gain
        const safeExpGained = Math.max(0, Math.floor(expGained));

        let newExp = attr.experience + safeExpGained;
        let newLevel = attr.level;
        let expForNext = attr.experienceForNextLevel;
        let levelsGained = 0;

        while (newExp >= expForNext && levelsGained < 10) { // SECURITY: Prevent infinite loops
            newExp -= expForNext;
            newLevel++;
            levelsGained++;
            expForNext = calculateExpForNextLevel(newLevel);
        }

        return {
            updatedAttribute: {
                level: Math.max(0, newLevel),
                experience: Math.max(0, newExp),
                experienceForNextLevel: Math.max(1, expForNext)
            },
            levelsGained: Math.max(0, levelsGained)
        };
    };

    let totalAttributeLevelsGained = 0;

    const applyBonusToReward = (baseReward: number, attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance'): number => {
        // SECURITY: Validate base reward
        if (baseReward <= 0) return 0;

        const bonus = getTrainingBonusForAttribute(stats.completedCourses || [], attribute);
        // SECURITY: Cap bonus to prevent excessive multipliers
        const cappedBonus = Math.max(0, Math.min(10, bonus)); // Max 10x multiplier
        return Math.floor(baseReward * (1 + cappedBonus));
    };

    // Process all attribute rewards with validation
    if (rewards.strength && rewards.strength > 0) {
        const bonusedReward = applyBonusToReward(rewards.strength, 'strength');
        const result = updateAttribute(attributes.strength, bonusedReward);
        attributes.strength = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.agility && rewards.agility > 0) {
        const bonusedReward = applyBonusToReward(rewards.agility, 'agility');
        const result = updateAttribute(attributes.agility, bonusedReward);
        attributes.agility = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.dexterity && rewards.dexterity > 0) {
        const bonusedReward = applyBonusToReward(rewards.dexterity, 'dexterity');
        const result = updateAttribute(attributes.dexterity, bonusedReward);
        attributes.dexterity = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.intelligence && rewards.intelligence > 0) {
        const bonusedReward = applyBonusToReward(rewards.intelligence, 'intelligence');
        const result = updateAttribute(attributes.intelligence, bonusedReward);
        attributes.intelligence = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.endurance && rewards.endurance > 0) {
        const bonusedReward = applyBonusToReward(rewards.endurance, 'endurance');
        const result = updateAttribute(attributes.endurance, bonusedReward);
        attributes.endurance = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.cooking && rewards.cooking > 0) {
        const result = updateAttribute(attributes.cooking, rewards.cooking);
        attributes.cooking = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.brewing && rewards.brewing > 0) {
        const result = updateAttribute(attributes.brewing, rewards.brewing);
        attributes.brewing = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.chemistry && rewards.chemistry > 0) {
        const result = updateAttribute(attributes.chemistry, rewards.chemistry);
        attributes.chemistry = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.sewing && rewards.sewing > 0) {
        const result = updateAttribute(attributes.sewing, rewards.sewing);
        attributes.sewing = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.medicine && rewards.medicine > 0) {
        const result = updateAttribute(attributes.medicine, rewards.medicine);
        attributes.medicine = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.printing && rewards.printing > 0) {
        const result = updateAttribute(attributes.printing, rewards.printing);
        attributes.printing = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }
    if (rewards.lasercutting && rewards.lasercutting > 0) {
        const result = updateAttribute(attributes.lasercutting, rewards.lasercutting);
        attributes.lasercutting = result.updatedAttribute;
        totalAttributeLevelsGained += result.levelsGained;
    }

    // Handle health updates
    let updatedHealth = stats.health;
    let healthUpdates: any = {};

    if (rewards.strength || rewards.endurance) {
        const oldMaxHealth = stats.health?.max || 100;
        const oldCurrentHealth = stats.health?.current || 100;

        const newHealthData = calculatePlayerHealth(
            attributes.strength.level,
            attributes.endurance.level
        );

        const healthIncrease = newHealthData.max - oldMaxHealth;

        updatedHealth = {
            ...newHealthData,
            current: Math.min(oldCurrentHealth + healthIncrease, newHealthData.max)
        };

        if (updatedHealth.current >= updatedHealth.max) {
            healthUpdates.lastHealthUpdate = null;
        }
    }

    // Update player experience and level with validation
    const safePlayerExp = Math.max(0, Math.floor(rewards.playerExp));
    const newPlayerExp = (stats.experience || 0) + safePlayerExp;
    const newPlayerLevel = calculateLevelFromExp(newPlayerExp);

    // Prepare updates object
    let updates: any = {
        attributes: attributes,
        experience: Math.max(0, newPlayerExp),
        level: Math.max(1, newPlayerLevel),
        health: updatedHealth,
        ...healthUpdates
    };

    // Handle reputation gains with cap
    if (totalAttributeLevelsGained > 0) {
        const reputationGained = Math.min(100, totalAttributeLevelsGained * 2); // Cap at 100 per training
        const currentReputation = Math.max(0, stats.reputation || 0);
        updates.reputation = currentReputation + reputationGained;
    }

    // Handle inventory updates for kitchen/lab activities
    if (trainingType === 'kitchen-lab') {
        const activity = getKitchenLabActivityById(activityId);
        if (activity && activity.requiredItems && activity.producedItems) {
            const { updatedInventory, kitchenBonusResult } = updateInventoryForCrafting(
                stats.inventory || [],
                activity.requiredItems,
                activity.producedItems,
                stats,
                activity.name
            );
            updates.inventory = updatedInventory;

            if (kitchenBonusResult) {
                updates.kitchenBonusResult = kitchenBonusResult;
            }
        }
    }

    // NEW: Handle handicraft activities with workshop success rate system
    let craftingResult: {
        itemsProduced: boolean;
        isWorkshopActivity: boolean;
        activityName?: string;
    } | undefined;

    if (trainingType === 'handicraft') {
        const activity = getHandicraftActivityById(activityId);
        if (activity && activity.requiredItems) {
            const isWorkshopActivity = !!(activity.rewards.printing || activity.rewards.lasercutting);

            // Check if this is a workshop activity (printing or laser cutting)
            if (isWorkshopActivity) {
                // Use workshop crafting with success rate
                const workshopResult = await performWorkshopCrafting(userId, activity, stats.inventory || []);
                updates.inventory = workshopResult.updatedInventory;
                craftingResult = {
                    itemsProduced: workshopResult.itemsProduced,
                    isWorkshopActivity: true,
                    activityName: activity.name
                };

                // Log crafting outcome for debugging/monitoring
                if (!workshopResult.itemsProduced) {
                    console.log(`Workshop crafting failed for activity ${activityId} - materials consumed but no items produced`);
                }
            } else {
                // Non-workshop handicraft activities (sewing, medicine) - 100% success
                if (activity.producedItems) {
                    const updatedInventory = updateInventoryForCrafting(
                        stats.inventory || [],
                        activity.requiredItems,
                        activity.producedItems
                    );
                    updates.inventory = updatedInventory;
                    craftingResult = {
                        itemsProduced: true,
                        isWorkshopActivity: false,
                        activityName: activity.name
                    };
                }
            }
        }
    }

    // Update training data with SAFE OBJECT CONSTRUCTION
    if (trainingType === 'sports') {
        const trainingData = await checkAndResetTrainingClicks(userId);
        const updatedTrainingData: TrainingData = {
            remainingClicks: Math.max(0, Number(trainingData.remainingClicks - 1) || 0),
            lastResetTime: trainingData.lastResetTime,
            totalTrainingsDone: Math.max(0, Number(trainingData.totalTrainingsDone + 1) || 1),
            isWorking: Boolean(stats.activeWork)
        };
        updates.trainingData = updatedTrainingData;
    } else if (trainingType === 'kitchen-lab') {
        const kitchenLabData = await checkAndResetKitchenLabTrainingClicks(userId);
        const updatedKitchenLabData: KitchenLabTrainingData = {
            remainingClicks: Math.max(0, Number(kitchenLabData.remainingClicks - 1) || 0),
            lastResetTime: kitchenLabData.lastResetTime,
            totalTrainingsDone: Math.max(0, Number(kitchenLabData.totalTrainingsDone + 1) || 1)
        };
        updates.kitchenLabTrainingData = updatedKitchenLabData;
    } else if (trainingType === 'handicraft') {
        const handicraftData = await checkAndResetHandicraftTrainingClicks(userId);
        const updatedHandicraftData: HandicraftTrainingData = {
            remainingClicks: Math.max(0, Number(handicraftData.remainingClicks - 1) || 0),
            lastResetTime: handicraftData.lastResetTime,
            totalTrainingsDone: Math.max(0, Number(handicraftData.totalTrainingsDone + 1) || 1)
        };
        updates.handicraftTrainingData = updatedHandicraftData;
    }

    // Save to database
    await updateDoc(statsRef, updates);

    // Update task progress after successful training
    try {
        await updateProgress(userId, 'training', totalAttributeLevelsGained);
        console.log(`Task progress updated: ${totalAttributeLevelsGained} attribute levels gained`);
    } catch (error) {
        console.error('Task progress update failed, but training completed successfully:', error);
    }

    const finalStats = {
        ...stats,
        ...updates
    };

    return {
        updatedStats: finalStats,
        craftingResult,
        kitchenBonusResult: updates.kitchenBonusResult
    };
};

// Get time until next reset
export const getTimeUntilReset = (): string => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    const diff = nextHour.getTime() - now.getTime();

    const minutes = Math.max(0, Math.floor(diff / 60000));
    const seconds = Math.max(0, Math.floor((diff % 60000) / 1000));

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const performTraining5x = async (
    userId: string,
    activityId: string,
    rewards: any,
    trainingType: 'sports' | 'kitchen-lab' | 'handicraft' = 'sports'
): Promise<{
    updatedStats: PlayerStats;
    craftingResults?: {
        itemsProduced: boolean;
        isWorkshopActivity: boolean;
        activityName?: string;
    }[];
    craftingSummary?: {
        totalAttempts: number;
        successful: number;
        failed: number;
        activityName: string;
        isWorkshopActivity: boolean;
    };
    kitchenBonusResults?: (KitchenBonusResult & { activityName?: string })[];
}> => {

    // Pre-check: ensure we have enough clicks and materials
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;

    // Check we have at least 5 clicks
    const currentClicks = trainingType === 'sports'
        ? (stats.trainingData?.remainingClicks || 0)
        : trainingType === 'kitchen-lab'
            ? (stats.kitchenLabTrainingData?.remainingClicks || 0)
            : (stats.handicraftTrainingData?.remainingClicks || 0);

    if (currentClicks < 5) {
        throw new Error(`Vajad vähemalt 5 treeningut, sul on ${currentClicks}`);
    }

    // For crafting activities, check materials for 5x
    if (trainingType === 'kitchen-lab') {
        const activity = getKitchenLabActivityById(activityId);
        if (activity?.requiredItems) {
            const materialsFor5x = activity.requiredItems.map(item => ({
                ...item,
                quantity: item.quantity * 5
            }));

            const materialCheck = hasRequiredMaterials(stats.inventory || [], materialsFor5x);
            if (!materialCheck.hasAll) {
                throw new Error('Materjale pole piisavalt 5x valmistamiseks');
            }
        }
    } else if (trainingType === 'handicraft') {
        const activity = getHandicraftActivityById(activityId);
        if (activity?.requiredItems) {
            const materialsFor5x = activity.requiredItems.map(item => ({
                ...item,
                quantity: item.quantity * 5
            }));

            const materialCheck = hasRequiredMaterials(stats.inventory || [], materialsFor5x);
            if (!materialCheck.hasAll) {
                throw new Error('Materjale pole piisavalt 5x valmistamiseks');
            }
        }
    }

    // Perform 5 individual trainings
    let currentStats = stats;
    const craftingResults: {
        itemsProduced: boolean;
        isWorkshopActivity: boolean;
        activityName?: string;
    }[] = [];

    const kitchenBonusResults: (KitchenBonusResult & { activityName?: string })[] = [];

    for (let i = 0; i < 5; i++) {
        const result = await performTraining(userId, activityId, rewards, trainingType);
        currentStats = result.updatedStats;

        if (result.craftingResult) {
            craftingResults.push(result.craftingResult);
        }

        if (result.kitchenBonusResult) {
            kitchenBonusResults.push(result.kitchenBonusResult);
        }
    }

    // Create crafting summary if we have crafting results
    let craftingSummary;
    if (craftingResults.length > 0) {
        const successful = craftingResults.filter(r => r.itemsProduced).length;
        const failed = craftingResults.filter(r => !r.itemsProduced).length;

        craftingSummary = {
            totalAttempts: craftingResults.length,
            successful,
            failed,
            activityName: craftingResults[0]?.activityName || 'Teadmata',
            isWorkshopActivity: craftingResults[0]?.isWorkshopActivity || false
        };
    }

    return {
        updatedStats: currentStats,
        craftingResults: craftingResults.length > 0 ? craftingResults : undefined,
        craftingSummary,
        kitchenBonusResults: kitchenBonusResults.length > 0 ? kitchenBonusResults : undefined
    };
};