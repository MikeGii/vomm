// src/services/InventoryMigrationService.ts
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {firestore} from "../config/firebase";
import {PlayerStats} from "../types";
import {CRAFTING_INGREDIENTS} from "../data/shop/craftingIngredients";

export const migrateCraftingItems = async (userId: string) => {
    const playerRef = doc(firestore, 'playerStats', userId);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) return;

    const playerStats = playerDoc.data() as PlayerStats;
    const inventory = playerStats.inventory || [];

    const updatedInventory = inventory.map(item => {
        // Check if item matches a crafting ingredient by base ID
        const baseId = item.id.split('_')[0]; // Extract base ID from timestamped ID
        const isCraftingItem = CRAFTING_INGREDIENTS.some(ingredient => ingredient.id === baseId);

        if (isCraftingItem && item.category !== 'crafting') {
            return { ...item, category: 'crafting' as const };
        }
        return item;
    });

    await updateDoc(playerRef, { inventory: updatedInventory });
};