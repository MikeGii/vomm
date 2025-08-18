// src/services/EquipmentService.ts
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { EquipmentSlot, EquipmentItem } from '../types/equipment';
import { InventoryItem } from '../types/inventory';

export const equipItem = async (
    userId: string,
    slot: EquipmentSlot,
    item: InventoryItem
): Promise<void> => {
    try {
        const playerStatsRef = doc(firestore, 'playerStats', userId);

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

        // Only add marketPrice if the item has one (player-listed price)
        if (item.marketPrice !== undefined) {
            equipmentItem.marketPrice = item.marketPrice;
        }


        // Update inventory - mark item as equipped
        let updatedInventory = currentInventory.map((invItem: InventoryItem) =>
            invItem.id === item.id
                ? { ...invItem, equipped: true }
                : invItem
        );

        // If there was an existing item in the slot, unequip it first
        if (existingItem) {
            updatedInventory = updatedInventory.map((invItem: InventoryItem) =>
                invItem.id === existingItem.id
                    ? { ...invItem, equipped: false }
                    : invItem
            );
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
        const playerStatsRef = doc(firestore, 'playerStats', userId);

        // Get current player stats
        const playerDoc = await getDoc(playerStatsRef);
        const playerData = playerDoc.data();
        const currentInventory = playerData?.inventory || [];

        // Update inventory - mark item as not equipped
        const updatedInventory = currentInventory.map((invItem: InventoryItem) =>
            invItem.id === item.id
                ? { ...invItem, equipped: false }
                : invItem
        );

        // If item is not in inventory (shouldn't happen but just in case), add it back
        const itemExists = currentInventory.some((invItem: InventoryItem) => invItem.id === item.id);
        if (!itemExists) {
            const inventoryItem: InventoryItem = {
                id: item.id,
                name: item.name,
                description: item.description,
                category: 'equipment',
                quantity: 1,
                shopPrice: item.shopPrice,
                stats: item.stats,
                equipped: false,
                equipmentSlot: slot
            };

            // Only add marketPrice if it exists
            if (item.marketPrice !== undefined) {
                inventoryItem.marketPrice = item.marketPrice;
            }

            updatedInventory.push(inventoryItem);
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