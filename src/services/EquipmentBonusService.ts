// src/services/EquipmentBonusService.ts - NEW FILE

import { CharacterEquipment, EquipmentItem } from '../types/equipment';
import { PlayerAttributes } from '../types';

export interface EquipmentBonuses {
    strength: number;
    agility: number;
    dexterity: number;
    intelligence: number;
    endurance: number;
}

/**
 * Calculate total bonuses from all equipped items
 */
export const calculateEquipmentBonuses = (equipment: CharacterEquipment): EquipmentBonuses => {
    const bonuses: EquipmentBonuses = {
        strength: 0,
        agility: 0,
        dexterity: 0,
        intelligence: 0,
        endurance: 0
    };

    // Go through each equipment slot
    Object.values(equipment).forEach((item: EquipmentItem | undefined) => {
        if (item?.stats) {
            bonuses.strength += item.stats.strength || 0;
            bonuses.agility += item.stats.agility || 0;
            bonuses.dexterity += item.stats.dexterity || 0;
            bonuses.intelligence += item.stats.intelligence || 0;
            bonuses.endurance += item.stats.endurance || 0;
        }
    });

    return bonuses;
};

/**
 * Apply equipment bonuses to base attributes
 */
export const getAttributesWithBonuses = (
    baseAttributes: PlayerAttributes,
    equipment: CharacterEquipment
): PlayerAttributes => {
    const bonuses = calculateEquipmentBonuses(equipment);

    return {
        strength: {
            ...baseAttributes.strength,
            level: baseAttributes.strength.level + bonuses.strength
        },
        agility: {
            ...baseAttributes.agility,
            level: baseAttributes.agility.level + bonuses.agility
        },
        dexterity: {
            ...baseAttributes.dexterity,
            level: baseAttributes.dexterity.level + bonuses.dexterity
        },
        intelligence: {
            ...baseAttributes.intelligence,
            level: baseAttributes.intelligence.level + bonuses.intelligence
        },
        endurance: {
            ...baseAttributes.endurance,
            level: baseAttributes.endurance.level + bonuses.endurance
        }
    };
};

/**
 * Calculate equipment market value for selling
 * Market price can be dynamic based on rarity, condition, etc.
 */
export const calculateMarketPrice = (item: EquipmentItem): number => {
    // If item has a specific market price set, use it
    if (item.marketPrice) {
        return item.marketPrice;
    }

    // Otherwise calculate based on shop price and rarity
    let multiplier = 0.5; // Base 50% of shop price

    // Adjust by rarity
    switch (item.rarity) {
        case 'uncommon':
            multiplier = 0.55;
            break;
        case 'rare':
            multiplier = 0.6;
            break;
        case 'epic':
            multiplier = 0.65;
            break;
        case 'legendary':
            multiplier = 0.7;
            break;
    }

    return Math.floor(item.shopPrice * multiplier);
};

/**
 * Calculate total value of all equipped items
 */
export const calculateTotalEquipmentValue = (equipment: CharacterEquipment): number => {
    let totalValue = 0;

    Object.values(equipment).forEach((item: EquipmentItem | undefined) => {
        if (item) {
            totalValue += calculateMarketPrice(item);
        }
    });

    return totalValue;
};

/**
 * Get effective attribute levels (base + equipment bonuses)
 * Used for checking requirements and displaying total stats
 */
export const getEffectiveAttributes = (
    baseAttributes: PlayerAttributes,
    equipment?: CharacterEquipment
): { [key: string]: number } => {
    const bonuses = equipment ? calculateEquipmentBonuses(equipment) : {
        strength: 0,
        agility: 0,
        dexterity: 0,
        intelligence: 0,
        endurance: 0
    };

    return {
        strength: baseAttributes.strength.level + bonuses.strength,
        agility: baseAttributes.agility.level + bonuses.agility,
        dexterity: baseAttributes.dexterity.level + bonuses.dexterity,
        intelligence: baseAttributes.intelligence.level + bonuses.intelligence,
        endurance: baseAttributes.endurance.level + bonuses.endurance
    };
};

/**
 * Check if player meets attribute requirements with equipment bonuses
 */
export const meetsAttributeRequirements = (
    baseAttributes: PlayerAttributes,
    equipment: CharacterEquipment | undefined,
    requirements: {
        strength?: number;
        agility?: number;
        dexterity?: number;
        intelligence?: number;
        endurance?: number;
    }
): boolean => {
    const effectiveAttributes = getEffectiveAttributes(baseAttributes, equipment);

    for (const [attr, required] of Object.entries(requirements)) {
        if (required && effectiveAttributes[attr] < required) {
            return false;
        }
    }

    return true;
};