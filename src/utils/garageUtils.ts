// src/utils/garageUtils.ts
import { PlayerEstate } from '../types/estate';

/**
 * Calculate total garage slots available to player
 * @param playerEstate - The player's estate data
 * @returns Total garage slots (estate + extra purchased)
 */
export const calculateTotalGarageSlots = (playerEstate: PlayerEstate | null): number => {
    if (!playerEstate?.currentEstate?.hasGarage) {
        return 0;
    }

    const estateSlots = playerEstate.currentEstate.garageCapacity || 0;
    const extraSlots = playerEstate.extraGarageSlots || 0;

    return estateSlots + extraSlots;
};

/**
 * Check if player can buy extra garage slots
 * @param playerEstate - The player's estate data
 * @returns boolean - true if player has an estate with garage
 */
export const canBuyExtraGarageSlots = (playerEstate: PlayerEstate | null): boolean => {
    return !!(playerEstate?.currentEstate?.hasGarage);
};

/**
 * Constants for garage slot purchasing
 */
export const GARAGE_SLOT_CONSTANTS = {
    COST_PER_SLOT: 50,
    MAX_EXTRA_SLOTS: 20
} as const;