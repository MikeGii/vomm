// src/services/EquipmentBonusService.ts - Cleaned version

import { CharacterEquipment, EquipmentItem } from '../types';
import { PlayerAttributes } from '../types';

export interface EquipmentBonuses {
    strength: number;
    agility: number;
    dexterity: number;
    intelligence: number;
    endurance: number;
    printing: number;
    lasercutting: number;
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
        endurance: 0,
        printing: 0,
        lasercutting: 0,
    };

    // Go through each equipment slot
    Object.values(equipment).forEach((item: EquipmentItem | undefined) => {
        if (item?.stats) {
            bonuses.strength += item.stats.strength || 0;
            bonuses.agility += item.stats.agility || 0;
            bonuses.dexterity += item.stats.dexterity || 0;
            bonuses.intelligence += item.stats.intelligence || 0;
            bonuses.endurance += item.stats.endurance || 0;
            bonuses.printing += item.stats.printing || 0;
            bonuses.lasercutting += item.stats.lasercutting || 0;
        }
    });

    return bonuses;
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