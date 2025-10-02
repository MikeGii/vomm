// src/services/TrainingBoosterService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { InventoryItem } from '../types';
import { PlayerStats } from '../types';
import {initializeHandicraftTrainingData, initializeKitchenLabTrainingData} from "./TrainingService";
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';
import { GlobalUserService } from './GlobalUserService';

export interface UseBoosterResult {
    success: boolean;
    message: string;
    clicksAdded?: number;
    newRemainingClicks?: number;
    itemsUsed?: number;
}

/**
 * Get all training boosters from player's inventory with stacking
 */
export const getTrainingBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'trainingClicks'
    );
};

/**
 * Get all kitchen/lab boosters from player's inventory
 */
export const getKitchenBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'kitchenClicks'
    );
};

/**
 * Get all handicraft boosters from player's inventory
 */
export const getHandicraftBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'handicraftClicks'
    );
};

/**
 * Use training booster(s) to restore training clicks with stacking support
 */
export const consumeTrainingBooster = async (
    userId: string,
    boosterId: string,
    quantity: number = 1
): Promise<UseBoosterResult> => {
    try {
        const playerRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
        const playerDoc = await getDoc(playerRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmed ei ole saadaval'
            };
        }

        const playerData = playerDoc.data() as PlayerStats;
        const inventory = playerData.inventory || [];
        const trainingData = playerData.trainingData;

        if (!trainingData) {
            return {
                success: false,
                message: 'Treeningandmed ei ole saadaval'
            };
        }

        // VIP LOGIC: Determine max clicks based on VIP status and work status
        const globalData = await GlobalUserService.getGlobalUserData(userId);
        let maxClicks: number;
        if (globalData.isVip) {
            maxClicks = playerData.activeWork ? 30 : 100;
        } else {
            maxClicks = playerData.activeWork ? 10 : 50;
        }

        // Find the booster in inventory
        const boosterIndex = inventory.findIndex(item => item.id === boosterId);

        if (boosterIndex === -1) {
            return {
                success: false,
                message: 'Ese ei ole inventaaris'
            };
        }

        const booster = inventory[boosterIndex];

        // Check if it's a valid training booster
        if (!booster.consumableEffect || booster.consumableEffect.type !== 'trainingClicks') {
            return {
                success: false,
                message: 'See ese ei ole treeningtarve'
            };
        }

        // Check if player has enough items
        if (booster.quantity < quantity) {
            return {
                success: false,
                message: `Pole piisavalt esemeid! Sul on ${booster.quantity}, tahad kasutada ${quantity}`
            };
        }

        // If already at max clicks
        const currentClicks = trainingData.remainingClicks || 0;
        const availableSpace = maxClicks - currentClicks;

        if (availableSpace <= 0) {
            return {
                success: false,
                message: 'Sul on juba maksimaalne arv treeningklõpse!'
            };
        }

        // Calculate how many boosters we actually need
        const clicksPerItem = booster.consumableEffect.value;
        const maxUsefulQuantity = Math.ceil(availableSpace / clicksPerItem);
        const actualQuantityToUse = Math.min(quantity, maxUsefulQuantity);

        // Warn if trying to use more than needed
        if (quantity > actualQuantityToUse) {
            // Optional: You could add a different message here
            // For now, we'll just use what's actually needed
        }

        // Calculate actual clicks to add
        const totalClicksToAdd = clicksPerItem * actualQuantityToUse;
        const newClicks = Math.min(currentClicks + totalClicksToAdd, maxClicks);
        const actualClicksAdded = newClicks - currentClicks;

        // Update inventory
        const updatedInventory = [...inventory];
        if (booster.quantity === actualQuantityToUse) {
            // Remove item completely if using all of them
            updatedInventory.splice(boosterIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[boosterIndex] = {
                ...booster,
                quantity: booster.quantity - actualQuantityToUse
            };
        }

        // Update player stats
        await updateDoc(playerRef, {
            'trainingData.remainingClicks': newClicks,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Kasutasid ${actualQuantityToUse}x ${booster.name}. Taastati ${actualClicksAdded} treeningklõpsu!`,
            clicksAdded: actualClicksAdded,
            newRemainingClicks: newClicks,
            itemsUsed: actualQuantityToUse
        };

    } catch (error) {
        console.error('Error using training booster:', error);
        return {
            success: false,
            message: 'Treeningtarbe kasutamine ebaõnnestus'
        };
    }
};

/**
 * Use training booster(s) to restore training clicks with stacking support
 */

export const consumeKitchenBooster = async (
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<UseBoosterResult> => {
    try {
        const playerRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
        const playerDoc = await getDoc(playerRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmeid ei leitud'
            };
        }

        const playerData = playerDoc.data() as PlayerStats;
        const inventory = playerData.inventory || [];
        const kitchenLabTrainingData = playerData.kitchenLabTrainingData || initializeKitchenLabTrainingData();

        // Find the booster in inventory
        const boosterIndex = inventory.findIndex((item: InventoryItem) => item.id === itemId);
        if (boosterIndex === -1) {
            return {
                success: false,
                message: 'Köögitarvet ei leitud!'
            };
        }

        const booster = inventory[boosterIndex];

        // Validate it's a kitchen clicks booster
        if (!booster.consumableEffect || booster.consumableEffect.type !== 'kitchenClicks') {
            return {
                success: false,
                message: 'See ese ei ole köögitarve!'
            };
        }

        // Check quantity
        if (booster.quantity < quantity) {
            return {
                success: false,
                message: `Sul pole piisavalt esemeid! Sul on ${booster.quantity}, tahad kasutada ${quantity}`
            };
        }

        // VIP LOGIC: Determine max clicks based on VIP status and work status
        const globalData = await GlobalUserService.getGlobalUserData(userId);
        let maxClicks: number;
        if (globalData.isVip) {
            maxClicks = playerData.activeWork ? 30 : 100;
        } else {
            maxClicks = playerData.activeWork ? 10 : 50;
        }

        // If already at max clicks
        const currentClicks = kitchenLabTrainingData.remainingClicks || 0;
        const availableSpace = maxClicks - currentClicks;

        if (availableSpace <= 0) {
            return {
                success: false,
                message: 'Sul on juba maksimaalne arv köök/labor klõpse!'
            };
        }

        // Calculate how many boosters we actually need
        const clicksPerItem = booster.consumableEffect.value;
        const maxUsefulQuantity = Math.ceil(availableSpace / clicksPerItem);
        const actualQuantityToUse = Math.min(quantity, maxUsefulQuantity);

        // Calculate actual clicks to add
        const totalClicksToAdd = clicksPerItem * actualQuantityToUse;
        const newClicks = Math.min(currentClicks + totalClicksToAdd, maxClicks);
        const actualClicksAdded = newClicks - currentClicks;

        // Update inventory
        const updatedInventory = [...inventory];
        if (booster.quantity === actualQuantityToUse) {
            // Remove item completely if using all of them
            updatedInventory.splice(boosterIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[boosterIndex] = {
                ...booster,
                quantity: booster.quantity - actualQuantityToUse
            };
        }

        // Update player stats
        await updateDoc(playerRef, {
            'kitchenLabTrainingData.remainingClicks': newClicks,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Kasutasid ${actualQuantityToUse}x ${booster.name}. Taastati ${actualClicksAdded} klõpsu!`,
            clicksAdded: actualClicksAdded,
            newRemainingClicks: newClicks,
            itemsUsed: actualQuantityToUse
        };

    } catch (error) {
        console.error('Error using kitchen booster:', error);
        return {
            success: false,
            message: 'Köögitarbe kasutamine ebaõnnestus'
        };
    }
};

/**
 * Use handicraft booster(s) to restore handicraft clicks
 */
export const consumeHandicraftBooster = async (
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<UseBoosterResult> => {
    try {
        const playerRef = doc(firestore, 'playerStats', getServerSpecificId(userId, getCurrentServer()));
        const playerDoc = await getDoc(playerRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmeid ei leitud'
            };
        }

        const playerData = playerDoc.data() as PlayerStats;
        const inventory = playerData.inventory || [];
        const handicraftTrainingData = playerData.handicraftTrainingData || initializeHandicraftTrainingData();

        // Find the booster in inventory
        const boosterIndex = inventory.findIndex((item: InventoryItem) => item.id === itemId);
        if (boosterIndex === -1) {
            return {
                success: false,
                message: 'Käsitöötarvet ei leitud!'
            };
        }

        const booster = inventory[boosterIndex];

        // Validate it's a handicraft clicks booster
        if (!booster.consumableEffect || booster.consumableEffect.type !== 'handicraftClicks') {
            return {
                success: false,
                message: 'See ese ei ole käsitöötarve!'
            };
        }

        // Check quantity
        if (booster.quantity < quantity) {
            return {
                success: false,
                message: `Sul pole piisavalt esemeid! Sul on ${booster.quantity}, tahad kasutada ${quantity}`
            };
        }

        // VIP LOGIC: Determine max clicks based on VIP status and work status
        const globalData = await GlobalUserService.getGlobalUserData(userId);
        let maxClicks: number;
        if (globalData.isVip) {
            maxClicks = playerData.activeWork ? 30 : 100;
        } else {
            maxClicks = playerData.activeWork ? 10 : 50;
        }

        // If already at max clicks
        const currentClicks = handicraftTrainingData.remainingClicks || 0;
        const availableSpace = maxClicks - currentClicks;

        if (availableSpace <= 0) {
            return {
                success: false,
                message: 'Sul on juba maksimaalne arv käsitöö klõpse!'
            };
        }

        // Calculate how many boosters we actually need
        const clicksPerItem = booster.consumableEffect.value;
        const maxUsefulQuantity = Math.ceil(availableSpace / clicksPerItem);
        const actualQuantityToUse = Math.min(quantity, maxUsefulQuantity);

        // Calculate actual clicks to add
        const totalClicksToAdd = clicksPerItem * actualQuantityToUse;
        const newClicks = Math.min(currentClicks + totalClicksToAdd, maxClicks);
        const actualClicksAdded = newClicks - currentClicks;

        // Update inventory
        const updatedInventory = [...inventory];
        if (booster.quantity === actualQuantityToUse) {
            // Remove item completely if using all of them
            updatedInventory.splice(boosterIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[boosterIndex] = {
                ...booster,
                quantity: booster.quantity - actualQuantityToUse
            };
        }

        // Update player stats
        await updateDoc(playerRef, {
            'handicraftTrainingData.remainingClicks': newClicks,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Kasutasid ${actualQuantityToUse}x ${booster.name}. Taastati ${actualClicksAdded} klõpsu!`,
            clicksAdded: actualClicksAdded,
            newRemainingClicks: newClicks,
            itemsUsed: actualQuantityToUse
        };

    } catch (error) {
        console.error('Error using handicraft booster:', error);
        return {
            success: false,
            message: 'Käsitöötarbe kasutamine ebaõnnestus'
        };
    }
};