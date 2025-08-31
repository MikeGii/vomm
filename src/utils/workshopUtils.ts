// src/utils/workshopUtils.ts
import { PlayerEstate } from '../types/estate';

export const canAccessPrinting = (playerEstate: PlayerEstate | null): boolean => {
    if (!playerEstate?.currentEstate?.hasWorkshop) {
        return false;
    }

    return playerEstate.ownedDevices?.has3DPrinter || false;
};

export const canAccessLaserCutting = (playerEstate: PlayerEstate | null): boolean => {
    if (!playerEstate?.currentEstate?.hasWorkshop) {
        return false;
    }

    return playerEstate.ownedDevices?.hasLaserCutter || false;
};

export const isAttributeUnlocked = (attributeName: string, playerEstate: PlayerEstate | null): boolean => {
    switch (attributeName) {
        case 'printing':
            return canAccessPrinting(playerEstate);
        case 'lasercutting':
            return canAccessLaserCutting(playerEstate);
        default:
            return true; // All other attributes are always unlocked
    }
};