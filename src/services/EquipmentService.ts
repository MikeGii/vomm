// src/services/EquipmentService.ts
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField, getDoc } from 'firebase/firestore';
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

        // Get current player stats to manipulate inventory
        const playerDoc = await getDoc(playerStatsRef);
        const playerData = playerDoc.data();
        const currentInventory = playerData?.inventory || [];

        // Create equipment item from inventory item
        const equipmentItem: EquipmentItem = {
            id: item.id,
            name: item.name,
            description: item.description,
            slot: slot,
            icon: item.icon,
            rarity: item.rarity,
            equipped: true
        };

        // Filter out the item from inventory and mark it as equipped
        const updatedInventory = currentInventory.map((invItem: InventoryItem) =>
            invItem.id === item.id
                ? { ...invItem, equipped: true }
                : invItem
        );

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

        // Find the item in inventory and mark it as not equipped
        const updatedInventory = currentInventory.map((invItem: InventoryItem) =>
            invItem.id === item.id
                ? { ...invItem, equipped: false }
                : invItem
        );

        // If item is not in inventory, add it back
        const itemExists = currentInventory.some((invItem: InventoryItem) => invItem.id === item.id);
        if (!itemExists) {
            const inventoryItem: InventoryItem = {
                id: item.id,
                name: item.name,
                description: item.description,
                category: 'equipment',
                quantity: 1,
                rarity: item.rarity,
                equipped: false,
                equipmentSlot: slot
            };
            updatedInventory.push(inventoryItem);
        }

        // Remove from equipment and update inventory
        await updateDoc(playerStatsRef, {
            [`equipment.${slot}`]: deleteField(),
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('Error unequipping item:', error);
        throw error;
    }
};