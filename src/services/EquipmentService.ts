// src/services/EquipmentService.ts
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { EquipmentSlot, EquipmentItem } from '../types';
import { InventoryItem } from '../types';
import { getCurrentServer, getServerSpecificId } from '../utils/serverUtils';

export const equipItem = async (
    userId: string,
    slot: EquipmentSlot,
    item: InventoryItem
): Promise<void> => {
    try {
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const playerStatsRef = doc(firestore, 'playerStats', serverSpecificId);

        // Get current player stats
        const playerDoc = await getDoc(playerStatsRef);
        const playerData = playerDoc.data();
        const currentInventory = playerData?.inventory || [];
        const currentEquipment = playerData?.equipment || {};

        // Check if there's already an item in this slot
        const existingItem = currentEquipment[slot];

        // Create equipment item from inventory item
        const equipmentItem: EquipmentItem = {
            id: item.id,
            name: item.name,
            description: item.description,
            slot: slot,
            shopPrice: item.shopPrice,
            stats: item.stats,
            equipped: true
        };

        // Only add marketPrice if the item has one
        if (item.marketPrice !== undefined) {
            equipmentItem.marketPrice = item.marketPrice;
        }

        // Update inventory
        let updatedInventory = [...currentInventory];

        // Find the item in inventory
        const itemIndex = updatedInventory.findIndex(invItem => invItem.id === item.id);

        if (itemIndex !== -1) {
            const inventoryItem = updatedInventory[itemIndex];

            if (inventoryItem.quantity > 1) {
                // If quantity > 1, decrease quantity and create a new equipped item
                updatedInventory[itemIndex] = {
                    ...inventoryItem,
                    quantity: inventoryItem.quantity - 1
                };

                // Add the equipped item as a separate entry
                const equippedItem = {
                    ...inventoryItem,
                    id: `${item.id}_equipped_${Date.now()}`,
                    quantity: 1,
                    equipped: true
                };
                updatedInventory.push(equippedItem);

                // Update equipment item ID to match
                equipmentItem.id = equippedItem.id;
            } else {
                // If quantity = 1, just mark as equipped
                updatedInventory[itemIndex] = {
                    ...inventoryItem,
                    equipped: true
                };
            }
        }

        // If there was an existing item in the slot, unequip it first
        if (existingItem) {
            const existingIndex = updatedInventory.findIndex(invItem => invItem.id === existingItem.id);
            if (existingIndex !== -1) {
                updatedInventory[existingIndex] = {
                    ...updatedInventory[existingIndex],
                    equipped: false
                };
            }
        }

        // Update both equipment and inventory
        await updateDoc(playerStatsRef, {
            [`equipment.${slot}`]: equipmentItem,
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('Error equipping item:', error);
        throw error;
    }
};

export const unequipItem = async (
    userId: string,
    slot: EquipmentSlot,
    item: EquipmentItem
): Promise<void> => {
    try {
        const serverSpecificId = getServerSpecificId(userId, getCurrentServer());
        const playerStatsRef = doc(firestore, 'playerStats', serverSpecificId);

        // Get current player stats
        const playerDoc = await getDoc(playerStatsRef);
        const playerData = playerDoc.data();
        const currentInventory = playerData?.inventory || [];

        // Update inventory
        let updatedInventory = [...currentInventory];

        // Find the equipped item
        const equippedIndex = updatedInventory.findIndex(invItem => invItem.id === item.id);

        if (equippedIndex !== -1) {
            // Mark as not equipped
            updatedInventory[equippedIndex] = {
                ...updatedInventory[equippedIndex],
                equipped: false
            };

            // Check if we can stack with existing unequipped items
            const stackableIndex = updatedInventory.findIndex(
                invItem =>
                    invItem.name === item.name &&
                    !invItem.equipped &&
                    invItem.id !== item.id
            );

            if (stackableIndex !== -1) {
                // Stack with existing unequipped item
                updatedInventory[stackableIndex] = {
                    ...updatedInventory[stackableIndex],
                    quantity: updatedInventory[stackableIndex].quantity + 1
                };
                // Remove the unequipped item
                updatedInventory.splice(equippedIndex, 1);
            }
        }

        // Remove from equipment slot and update inventory
        await updateDoc(playerStatsRef, {
            [`equipment.${slot}`]: deleteField(),
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('Error unequipping item:', error);
        throw error;
    }
};