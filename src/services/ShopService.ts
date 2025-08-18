// src/services/ShopService.ts - Updated version
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ShopItem, PurchaseResult } from '../types/shop';
import { InventoryItem } from '../types/inventory';
import { PlayerStats } from '../types';
import { ALL_SHOP_ITEMS } from '../data/shop';

/**
 * Get shop item by ID
 */
export const getShopItemById = (itemId: string): ShopItem | undefined => {
    return ALL_SHOP_ITEMS.find(item => item.id === itemId);
};

/**
 * Convert shop item to inventory item
 */
const shopItemToInventoryItem = (shopItem: ShopItem): InventoryItem => {
    return {
        id: `${shopItem.id}_${Date.now()}`, // Unique ID for inventory
        name: shopItem.name,
        description: shopItem.description,
        category: shopItem.category === 'uniforms' ? 'equipment' :
            shopItem.category === 'protection' ? 'equipment' :
                shopItem.category === 'weapons' ? 'weapon' :
                    shopItem.category === 'documents' ? 'document' :
                        shopItem.category === 'consumables' ? 'consumable' : 'misc',
        quantity: 1,
        shopPrice: shopItem.price,
        rarity: shopItem.rarity,
        equipped: false,
        equipmentSlot: shopItem.equipmentSlot,
        stats: shopItem.stats,
        source: 'shop',
        obtainedAt: new Date()
    };
};

/**
 * Purchase item from shop
 */
export const purchaseItem = async (
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<PurchaseResult> => {
    try {
        // Get shop item
        const shopItem = getShopItemById(itemId);
        if (!shopItem) {
            return {
                success: false,
                message: 'Ese ei ole saadaval',
                failureReason: 'out_of_stock'
            };
        }

        // Get player stats
        const playerRef = doc(firestore, 'playerStats', userId);
        const playerDoc = await getDoc(playerRef);

        if (!playerDoc.exists()) {
            return {
                success: false,
                message: 'Mängija andmed ei ole saadaval'
            };
        }

        const playerStats = playerDoc.data() as PlayerStats;

        // Calculate total cost
        const totalCost = shopItem.price * quantity;

        // Check if player has enough money
        if (playerStats.money < totalCost) {
            return {
                success: false,
                message: `Ebapiisav raha. Vaja: €${totalCost}, Sul on: €${playerStats.money}`,
                failureReason: 'insufficient_funds'
            };
        }

        // Create inventory items
        const inventoryItems: InventoryItem[] = [];
        for (let i = 0; i < quantity; i++) {
            inventoryItems.push(shopItemToInventoryItem(shopItem));
        }

        // Update player stats (decrease money and add items to inventory)
        await updateDoc(playerRef, {
            money: playerStats.money - totalCost,
            inventory: arrayUnion(...inventoryItems),
            lastModified: Timestamp.now()
        });

        return {
            success: true,
            message: `Ostsid: ${shopItem.name}${quantity > 1 ? ` x${quantity}` : ''}`,
            newBalance: playerStats.money - totalCost
        };

    } catch (error) {
        console.error('Purchase error:', error);
        return {
            success: false,
            message: 'Ostu sooritamine ebaõnnestus'
        };
    }
};

/**
 * Get items player can afford
 */
export const getAffordableItems = (
    playerMoney: number,
    category?: string
): ShopItem[] => {
    let items = ALL_SHOP_ITEMS.filter(item => item.price <= playerMoney);

    if (category && category !== 'all') {
        items = items.filter(item => item.category === category);
    }

    return items;
};

/**
 * Get items with active discounts
 */
export const getDiscountedItems = (): ShopItem[] => {
    return ALL_SHOP_ITEMS.filter(item => item.discount && item.discount > 0);
};

/**
 * Calculate final price with discount
 */
export const calculateFinalPrice = (item: ShopItem): number => {
    if (item.discount) {
        return Math.floor(item.price * (1 - item.discount / 100));
    }
    return item.price;
};

/**
 * Sort shop items
 */
export const sortShopItems = (
    items: ShopItem[],
    sortBy: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rarity'
): ShopItem[] => {
    const sorted = [...items];

    switch (sortBy) {
        case 'price_asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name_asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name_desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'rarity':
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            return sorted.sort((a, b) => {
                const aIndex = rarityOrder.indexOf(a.rarity || 'common');
                const bIndex = rarityOrder.indexOf(b.rarity || 'common');
                return bIndex - aIndex;
            });
        default:
            return sorted;
    }
};