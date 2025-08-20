// src/services/TrainingService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {PlayerStats, PlayerAttributes, AttributeData, TrainingData, KitchenLabTrainingData} from '../types';
import {calculateLevelFromExp, calculatePlayerHealth} from "./PlayerService";
import { getTrainingBonusForAttribute} from "../data/abilities";
import { getKitchenLabActivityById } from '../data/kitchenLabActivities';
import { CRAFTING_INGREDIENTS } from '../data/shop/craftingIngredients';
import { InventoryItem } from '../types';


// Helper function to extract base ID properly from inventory items
const getBaseIdFromInventoryId = (inventoryId: string): string => {
    const parts = inventoryId.split('_');

    // For timestamped IDs like "cleaning_solution_1234567890_0.123"
    // Remove the last 2 parts (timestamp and random) but keep the original base ID
    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        // If last part is decimal and second-to-last is all digits (timestamp)
        if (lastPart.includes('.') && /^\\d+$/.test(secondLastPart)) {
            return parts.slice(0, -2).join('_');
        }
    }

    // Fallback to first part if pattern doesn't match
    return parts[0];
};

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

// Helper function to check if player has required materials
const hasRequiredMaterials = (
    inventory: InventoryItem[],
    requiredItems: { id: string; quantity: number }[]
): { hasAll: boolean; missing: { id: string; needed: number; has: number }[] } => {
    const missing: { id: string; needed: number; has: number }[] = [];

    for (const required of requiredItems) {
        // Sum quantities of all items with matching base ID - FIXED
        const totalQuantity = inventory
            .filter(item => {
                const baseId = getBaseIdFromInventoryId(item.id);
                return baseId === required.id && item.category === 'crafting';
            })
            .reduce((sum, item) => sum + item.quantity, 0);

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
    const shopItem = CRAFTING_INGREDIENTS.find(item => item.id === itemId);

    if (!shopItem) {
        throw new Error(`Item ${itemId} not found in crafting ingredients`);
    }

    return {
        id: `${itemId}_${Date.now()}_${Math.random()}`, // Use complex ID like shop does
        name: shopItem.name,
        description: shopItem.description,
        category: 'crafting', // Changed from 'misc' to 'crafting'
        quantity: quantity,
        shopPrice: shopItem.basePrice,
        source: 'training',
        obtainedAt: new Date()
    };
};

// Helper function to update inventory after crafting
const updateInventoryForCrafting = (
    inventory: InventoryItem[],
    requiredItems: { id: string; quantity: number }[],
    producedItems: { id: string; quantity: number }[]
): InventoryItem[] => {
    let updatedInventory = [...inventory];

    // Remove required materials by base ID
    requiredItems.forEach(required => {
        let remainingToRemove = required.quantity;

        for (let i = updatedInventory.length - 1; i >= 0 && remainingToRemove > 0; i--) {
            const item = updatedInventory[i];
            const baseId = getBaseIdFromInventoryId(item.id); // FIXED

            if (baseId === required.id && item.category === 'crafting') {
                if (item.quantity <= remainingToRemove) {
                    remainingToRemove -= item.quantity;
                    updatedInventory.splice(i, 1);
                } else {
                    updatedInventory[i] = {
                        ...item,
                        quantity: item.quantity - remainingToRemove
                    };
                    remainingToRemove = 0;
                }
            }
        }
    });

    // Add produced items
    producedItems.forEach(produced => {
        // Check if item already exists by base ID - FIXED
        const existingIndex = updatedInventory.findIndex(item => {
            const baseId = getBaseIdFromInventoryId(item.id);
            return baseId === produced.id && item.category === 'crafting';
        });

        if (existingIndex >= 0) {
            updatedInventory[existingIndex] = {
                ...updatedInventory[existingIndex],
                quantity: updatedInventory[existingIndex].quantity + produced.quantity
            };
        } else {
            const newItem = createInventoryItemFromId(produced.id, produced.quantity);
            updatedInventory.push(newItem);
        }
    });

    return updatedInventory;
};

// Check if training clicks should reset (every full hour)
export const checkAndResetTrainingClicks = async (userId: string): Promise<TrainingData> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let trainingData = stats.trainingData || initializeTrainingData();

    const maxClicks = stats.activeWork ? 10 : 50;
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    if (trainingData.lastResetTime instanceof Timestamp) {
        lastReset = trainingData.lastResetTime.toDate();
    } else if (trainingData.lastResetTime && typeof trainingData.lastResetTime === 'object' && 'seconds' in trainingData.lastResetTime) {
        lastReset = new Date(trainingData.lastResetTime.seconds * 1000);
    } else {
        lastReset = new Date(trainingData.lastResetTime);
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    if (currentHour.getTime() > lastResetHour.getTime()) {
        trainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: trainingData.totalTrainingsDone,
            isWorking: !!stats.activeWork
        };

        await updateDoc(statsRef, {
            trainingData: trainingData
        });
    }

    return trainingData;
};

export const checkAndResetKitchenLabTrainingClicks = async (userId: string): Promise<KitchenLabTrainingData> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        throw new Error('Player stats not found');
    }

    const stats = statsDoc.data() as PlayerStats;
    let kitchenLabTrainingData = stats.kitchenLabTrainingData || initializeKitchenLabTrainingData();

    const maxClicks = stats.activeWork ? 10 : 50;
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    let lastReset: Date;
    if (kitchenLabTrainingData.lastResetTime instanceof Timestamp) {
        lastReset = kitchenLabTrainingData.lastResetTime.toDate();
    } else if (kitchenLabTrainingData.lastResetTime && typeof kitchenLabTrainingData.lastResetTime === 'object' && 'seconds' in kitchenLabTrainingData.lastResetTime) {
        lastReset = new Date(kitchenLabTrainingData.lastResetTime.seconds * 1000);
    } else {
        lastReset = new Date(kitchenLabTrainingData.lastResetTime);
    }

    const lastResetHour = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate(), lastReset.getHours());

    if (currentHour.getTime() > lastResetHour.getTime()) {
        kitchenLabTrainingData = {
            remainingClicks: maxClicks,
            lastResetTime: Timestamp.now(),
            totalTrainingsDone: kitchenLabTrainingData.totalTrainingsDone
        };

        await updateDoc(statsRef, {
            kitchenLabTrainingData: kitchenLabTrainingData
        });
    }

    return kitchenLabTrainingData;
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
        playerExp: number;
    },
    trainingType: 'sports' | 'kitchen-lab' = 'sports'
): Promise<PlayerStats> => {
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

        // NEW: Check materials for kitchen/lab activities
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
    }

    // Initialize attributes if they don't exist
    const attributes = stats.attributes || initializeAttributes();

    // Update attributes based on rewards
    const updateAttribute = (attr: AttributeData, expGained: number): AttributeData => {
        let newExp = attr.experience + expGained;
        let newLevel = attr.level;
        let expForNext = attr.experienceForNextLevel;

        while (newExp >= expForNext) {
            newExp -= expForNext;
            newLevel++;
            expForNext = calculateExpForNextLevel(newLevel);
        }

        return {
            level: newLevel,
            experience: newExp,
            experienceForNextLevel: expForNext
        };
    };

    const applyBonusToReward = (baseReward: number, attribute: 'strength' | 'agility' | 'dexterity' | 'intelligence' | 'endurance'): number => {
        const bonus = getTrainingBonusForAttribute(stats.completedCourses || [], attribute);
        return Math.floor(baseReward * (1 + bonus));
    };

    if (rewards.strength) {
        const bonusedReward = applyBonusToReward(rewards.strength, 'strength');
        attributes.strength = updateAttribute(attributes.strength, bonusedReward);
    }
    if (rewards.agility) {
        const bonusedReward = applyBonusToReward(rewards.agility, 'agility');
        attributes.agility = updateAttribute(attributes.agility, bonusedReward);
    }
    if (rewards.dexterity) {
        const bonusedReward = applyBonusToReward(rewards.dexterity, 'dexterity');
        attributes.dexterity = updateAttribute(attributes.dexterity, bonusedReward);
    }
    if (rewards.intelligence) {
        const bonusedReward = applyBonusToReward(rewards.intelligence, 'intelligence');
        attributes.intelligence = updateAttribute(attributes.intelligence, bonusedReward);
    }
    if (rewards.endurance) {
        const bonusedReward = applyBonusToReward(rewards.endurance, 'endurance');
        attributes.endurance = updateAttribute(attributes.endurance, bonusedReward);
    }
    if (rewards.cooking) {
        attributes.cooking = updateAttribute(attributes.cooking, rewards.cooking);
    }
    if (rewards.brewing) {
        attributes.brewing = updateAttribute(attributes.brewing, rewards.brewing);
    }
    if (rewards.chemistry) {
        attributes.chemistry = updateAttribute(attributes.chemistry, rewards.chemistry);
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
            current: oldCurrentHealth + healthIncrease
        };

        updatedHealth.current = Math.min(updatedHealth.current, updatedHealth.max);

        if (updatedHealth.current >= updatedHealth.max) {
            healthUpdates.lastHealthUpdate = null;
        }
    }

    // Update player experience and level
    const newPlayerExp = stats.experience + rewards.playerExp;
    const newPlayerLevel = calculateLevelFromExp(newPlayerExp);

    // Prepare updates object
    let updates: any = {
        attributes: attributes,
        experience: newPlayerExp,
        level: newPlayerLevel,
        health: updatedHealth,
        ...healthUpdates
    };

    // Handle inventory updates for kitchen/lab activities
    if (trainingType === 'kitchen-lab') {
        const activity = getKitchenLabActivityById(activityId);
        if (activity && activity.requiredItems && activity.producedItems) {
            const updatedInventory = updateInventoryForCrafting(
                stats.inventory || [],
                activity.requiredItems,
                activity.producedItems
            );
            updates.inventory = updatedInventory;
        }
    }

    // Update training data
    if (trainingType === 'sports') {
        const trainingData = await checkAndResetTrainingClicks(userId);
        const updatedTrainingData: TrainingData = {
            remainingClicks: trainingData.remainingClicks - 1,
            lastResetTime: trainingData.lastResetTime,
            totalTrainingsDone: trainingData.totalTrainingsDone + 1,
            isWorking: !!stats.activeWork
        };
        updates.trainingData = updatedTrainingData;
    } else if (trainingType === 'kitchen-lab') {
        const kitchenLabData = await checkAndResetKitchenLabTrainingClicks(userId);
        const updatedKitchenLabData: KitchenLabTrainingData = {
            remainingClicks: kitchenLabData.remainingClicks - 1,
            lastResetTime: kitchenLabData.lastResetTime,
            totalTrainingsDone: kitchenLabData.totalTrainingsDone + 1
        };
        updates.kitchenLabTrainingData = updatedKitchenLabData;
    }

    // Save to database
    await updateDoc(statsRef, updates);

    return {
        ...stats,
        ...updates
    };
};

// Get time until next reset
export const getTimeUntilReset = (): string => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    const diff = nextHour.getTime() - now.getTime();

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};