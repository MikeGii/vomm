// src/utils/playerStatus.ts
import { PlayerStats } from '../types';
import { getPositionName } from '../data/policePositions';

export const getPlayerDisplayStatus = (playerStats: PlayerStats): string => {
    // Handle undefined by converting to null
    const position = playerStats.policePosition ?? null;
    return getPositionName(position);
};

export const isPoliceOfficer = (playerStats: PlayerStats): boolean => {
    const position = playerStats.policePosition;
    return ['patrullpolitseinik', 'grupijuht', 'talituse_juht'].includes(position || '');
};

export const isKadett = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'kadett';
};

export const isAbipolitseinik = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'abipolitseinik';
};