// src/services/MedicalService.ts
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { InventoryItem, PlayerStats } from '../types';

export interface UseMedicalResult {
    success: boolean;
    message: string;
    healthRestored?: number;
    newHealth?: number;
    itemsUsed?: number;
}

/**
 * Get all medical items from player's inventory
 */
export const getMedicalItems = (inventory: InventoryItem[]): InventoryItem[] => {
    return inventory.filter(item =>
        item.consumableEffect?.type === 'heal'
    );
};

/**
 * Use medical items to restore health
 */
export const consumeMedicalItem = async (
    userId: string,
    itemId: string,
    quantity: number = 1
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

        // Check if player has enough items
        if (medicalItem.quantity < quantity) {
            return {
                success: false,
                message: `Pole piisavalt esemeid! Sul on ${medicalItem.quantity}, tahad kasutada ${quantity}`
            };
        }

        // Calculate health restoration
        const healPerItem = medicalItem.consumableEffect.value;
        const currentHealth = health.current;
        const maxHealth = health.max;
        const healthNeeded = maxHealth - currentHealth;

        // Handle "full heal" items (value 9999)
        if (healPerItem >= 9999) {
            // Full heal items only need 1 to restore all health
            quantity = 1;
        } else {
            // Calculate optimal quantity (don't use more than needed)
            const optimalQuantity = Math.ceil(healthNeeded / healPerItem);
            quantity = Math.min(quantity, optimalQuantity, medicalItem.quantity);
        }

        // Calculate actual health restored
        const totalHealAmount = healPerItem >= 9999
            ? healthNeeded
            : healPerItem * quantity;

        const actualHealAmount = Math.min(totalHealAmount, healthNeeded);
        const newHealth = currentHealth + actualHealAmount;

        // Update inventory
        const updatedInventory = [...inventory];
        if (medicalItem.quantity === quantity) {
            // Remove item completely
            updatedInventory.splice(itemIndex, 1);
        } else {
            // Reduce quantity
            updatedInventory[itemIndex] = {
                ...medicalItem,
                quantity: medicalItem.quantity - quantity
            };
        }

        // Update player stats
        await updateDoc(playerRef, {
            'health.current': newHealth,
            'health.lastHealTime': Timestamp.now(),
            inventory: updatedInventory,
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Tervis taastatud! +${actualHealAmount} HP (kasutatud ${quantity}x ${medicalItem.name})`,
            healthRestored: actualHealAmount,
            newHealth: newHealth,
            itemsUsed: quantity
        };

    } catch (error) {
        console.error('Error using medical item:', error);
        return {
            success: false,
            message: 'Viga meditsiinivarustuse kasutamisel'
        };
    }
};

/**
 * Calculate how many items needed for full heal
 */
export const calculateItemsNeededForFullHeal = (
    currentHealth: number,
    maxHealth: number,
    healPerItem: number
): number => {
    if (healPerItem >= 9999) return 1; // Full heal items
    const healthNeeded = maxHealth - currentHealth;
    return Math.ceil(healthNeeded / healPerItem);
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