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
 * Use training booster(s) to restore training clicks with stacking support
 */
export const consumeTrainingBooster = async (
    userId: string,
    boosterId: string,
    quantity: number = 1
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

        // Determine max clicks based on work status
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

        // Check if player has enough items
        if (booster.quantity < quantity) {
            return {
                success: false,
                message: `Pole piisavalt esemeid! Sul on ${booster.quantity}, tahad kasutada ${quantity}`
            };
        }

        // If already at max clicks
        const currentClicks = trainingData.remainingClicks || 0;
        if (currentClicks >= maxClicks) {
            return {
                success: false,
                message: 'Sul on juba maksimaalne arv treeningklõpse!'
            };
        }

        // Calculate clicks restoration
        const clicksPerItem = booster.consumableEffect.value;
        const totalClicksToAdd = clicksPerItem * quantity;
        const newClicks = Math.min(currentClicks + totalClicksToAdd, maxClicks);
        const actualClicksAdded = newClicks - currentClicks;

        // Update inventory
        const updatedInventory = [...inventory];
        if (booster.quantity === quantity) {
            // Remove item completely if using all of them
            updatedInventory.splice(boosterIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[boosterIndex] = {
                ...booster,
                quantity: booster.quantity - quantity
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
            message: `Kasutasid ${quantity}x ${booster.name}. Taastati ${actualClicksAdded} treeningklõpsu!`,
            clicksAdded: actualClicksAdded,
            newRemainingClicks: newClicks,
            itemsUsed: quantity
        };

    } catch (error) {
        console.error('Error using training booster:', error);
        return {
            success: false,
            message: 'Treeningtarbe kasutamine ebaõnnestus'
        };
    }
};