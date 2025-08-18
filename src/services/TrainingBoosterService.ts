// src/services/TrainingBoosterService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { InventoryItem } from '../types';
import { PlayerStats } from '../types';

export interface UseBoosterResult {
    success: boolean;
    message: string;
    clicksAdded?: number;
    newRemainingClicks?: number;
}

/**
 * Get all training boosters from player's inventory
 */
export const getTrainingBoosters = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.category === 'consumable' &&
        item.consumableEffect?.type === 'trainingClicks'
    );
};

/**
 * Use a training booster to restore training clicks
 */
export const consumeTrainingBooster = async (
    userId: string,
    boosterId: string
): Promise<UseBoosterResult> => {
    try {
        const playerRef = doc(firestore, 'playerStats', userId);
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

        // Determine max clicks based on work status - DYNAMIC!
        const maxClicks = playerData.activeWork ? 10 : 50;

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

        // Calculate new clicks using dynamic max
        const clicksToAdd = booster.consumableEffect.value;
        const currentClicks = trainingData.remainingClicks || 0;
        const newClicks = Math.min(currentClicks + clicksToAdd, maxClicks);
        const actualClicksAdded = newClicks - currentClicks;

        // Remove the booster from inventory
        const updatedInventory = [...inventory];
        updatedInventory.splice(boosterIndex, 1);

        // Update player stats
        await updateDoc(playerRef, {
            'trainingData.remainingClicks': newClicks,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Kasutasid ${booster.name}. Taastati ${actualClicksAdded} treeningklõpsu!`,
            clicksAdded: actualClicksAdded,
            newRemainingClicks: newClicks
        };

    } catch (error) {
        console.error('Error using training booster:', error);
        return {
            success: false,
            message: 'Treeningtarbe kasutamine ebaõnnestus'
        };
    }
};