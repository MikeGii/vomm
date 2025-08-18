// src/services/MedicalService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { InventoryItem, PlayerStats } from '../types';

export interface UseMedicalResult {
    success: boolean;
    message: string;
    healthRestored?: number;
    newHealth?: number;
}

/**
 * Get all medical items from player's inventory
 */
export const getMedicalItems = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.category === 'consumable' &&
        item.consumableEffect?.type === 'heal'
    );
};

/**
 * Use a medical item to restore health
 */
export const consumeMedicalItem = async (
    userId: string,
    itemId: string
): Promise<UseMedicalResult> => {
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
        const health = playerData.health;

        if (!health) {
            return {
                success: false,
                message: 'Terviseandmed ei ole saadaval'
            };
        }

        // Check if already at max health
        if (health.current >= health.max) {
            return {
                success: false,
                message: 'Tervis on juba maksimaalne!'
            };
        }

        // Find the medical item in inventory
        const itemIndex = inventory.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return {
                success: false,
                message: 'Ese ei ole inventaaris'
            };
        }

        const medicalItem = inventory[itemIndex];

        // Check if it's a valid medical item
        if (!medicalItem.consumableEffect || medicalItem.consumableEffect.type !== 'heal') {
            return {
                success: false,
                message: 'See ese ei ole meditsiinitarve'
            };
        }

        // Calculate health restoration
        const healAmount = medicalItem.consumableEffect.value;
        const currentHealth = health.current;
        const maxHealth = health.max;

        // Handle "full heal" items (value 9999)
        const actualHealAmount = healAmount >= 9999
            ? maxHealth - currentHealth
            : Math.min(healAmount, maxHealth - currentHealth);

        const newHealth = currentHealth + actualHealAmount;

        // Remove the medical item from inventory
        const updatedInventory = [...inventory];
        updatedInventory.splice(itemIndex, 1);

        // Prepare updates
        const updates: any = {
            'health.current': newHealth,
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        };

        // Clear recovery timer if health is now at max
        if (newHealth >= maxHealth) {
            updates.lastHealthUpdate = null;
        }

        // Update player stats
        await updateDoc(playerRef, updates);

        return {
            success: true,
            message: `Kasutasid ${medicalItem.name}. Taastati ${actualHealAmount} HP!`,
            healthRestored: actualHealAmount,
            newHealth: newHealth
        };

    } catch (error) {
        console.error('Error using medical item:', error);
        return {
            success: false,
            message: 'Meditsiinitarbe kasutamine ebaõnnestus'
        };
    }
};

/**
 * Check if player needs healing
 */
export const needsHealing = (health: { current: number; max: number }): boolean => {
    return health.current < health.max;
};

/**
 * Get health percentage
 */
export const getHealthPercentage = (health: { current: number; max: number }): number => {
    return Math.round((health.current / health.max) * 100);
};