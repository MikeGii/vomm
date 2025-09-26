// src/utils/playerStatus.ts
import { PlayerStats } from '../types';
import { getPositionName } from '../data/policePositions';

export const getPlayerDisplayStatus = (playerStats: PlayerStats): string => {
    const position = playerStats.policePosition ?? null;
    return getPositionName(position);
};

export const isPoliceOfficer = (playerStats: PlayerStats): boolean => {
    const position = playerStats.policePosition;
    return [
        'patrullpolitseinik',
        'uurija',
        'kiirreageerija',
        'koerajuht',
        'küberkriminalist',
        'jälitaja',
        'grupijuht_patrol',
        'grupijuht_investigation',
        'grupijuht_emergency',
        'grupijuht_k9',
        'grupijuht_cyber',
        'grupijuht_crimes',
        'talituse_juht_patrol',
        'talituse_juht_investigation',
        'talituse_juht_emergency',
        'talituse_juht_k9',
        'talituse_juht_cyber',
        'talituse_juht_crimes'
    ].includes(position || '');
};

export const isKadett = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'kadett';
};

export const isAbipolitseinik = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'abipolitseinik';
};

export const isGroupLeader = (playerStats: PlayerStats): boolean => {
    const position = playerStats.policePosition;
    return [
        'grupijuht_patrol',
        'grupijuht_investigation',
        'grupijuht_emergency',
        'grupijuht_k9',
        'grupijuht_cyber',
        'grupijuht_crimes'
    ].includes(position || '');
};

export const isUnitLeader = (playerStats: PlayerStats): boolean => {
    const position = playerStats.policePosition;
    return [
        'talituse_juht_patrol',
        'talituse_juht_investigation',
        'talituse_juht_emergency',
        'talituse_juht_k9',
        'talituse_juht_cyber',
        'talituse_juht_crimes'
    ].includes(position || '');
};

export const isUnitWorker = (playerStats: PlayerStats): boolean => {
    const position = playerStats.policePosition;
    return [
        'patrullpolitseinik',
        'uurija',
        'kiirreageerija',
        'koerajuht',
        'küberkriminalist',
        'jälitaja'
    ].includes(position || '');
};

export const getPositionDepartmentUnit = (policePosition: string | null | undefined): string | null => {
    if (!policePosition) return null;

    const unitMap: Record<string, string> = {
        // Regular unit workers
        'patrullpolitseinik': 'patrol',
        'uurija': 'procedural_service',
        'kiirreageerija': 'emergency_response',
        'koerajuht': 'k9_unit',
        'küberkriminalist': 'cyber_crime',
        'jälitaja': 'crime_unit',
        // Group leaders
        'grupijuht_patrol': 'patrol',
        'grupijuht_investigation': 'procedural_service',
        'grupijuht_emergency': 'emergency_response',
        'grupijuht_k9': 'k9_unit',
        'grupijuht_cyber': 'cyber_crime',
        'grupijuht_crimes': 'crime_unit',
        // Unit leaders
        'talituse_juht_patrol': 'patrol',
        'talituse_juht_investigation': 'procedural_service',
        'talituse_juht_emergency': 'emergency_response',
        'talituse_juht_k9': 'k9_unit',
        'talituse_juht_cyber': 'cyber_crime',
        'talituse_juht_crimes': 'crime_unit'
    };

    return unitMap[policePosition] || null;
};

export const getGroupLeaderPositionForUnit = (unitId: string): string | null => {
    const leaderMap: Record<string, string> = {
        'patrol': 'grupijuht_patrol',
        'procedural_service': 'grupijuht_investigation',
        'emergency_response': 'grupijuht_emergency',
        'k9_unit': 'grupijuht_k9',
        'cyber_crime': 'grupijuht_cyber',
        'crime_unit': 'grupijuht_crimes'
    };

    return leaderMap[unitId] || null;
};

export const getUnitLeaderPositionForUnit = (unitId: string): string | null => {
    const unitLeaderMap: Record<string, string> = {
        'patrol': 'talituse_juht_patrol',
        'procedural_service': 'talituse_juht_investigation',
        'emergency_response': 'talituse_juht_emergency',
        'k9_unit': 'talituse_juht_k9',
        'cyber_crime': 'talituse_juht_cyber',
        'crime_unit': 'talituse_juht_crimes'
    };

    return unitLeaderMap[unitId] || null;
};

// NEW: Helper to check if player can donate to department unit wallet
export const canDonateToUnitWallet = (playerStats: PlayerStats): boolean => {
    return isUnitWorker(playerStats) || isGroupLeader(playerStats) || isUnitLeader(playerStats);
};

// NEW: Helper to check if player can manage department unit wallet
export const canManageUnitWallet = (playerStats: PlayerStats): boolean => {
    return isUnitLeader(playerStats);
};