// src/utils/playerStatus.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';
import { getPositionName } from '../data/policePositions';

export const getPlayerDisplayStatus = (playerStats: PlayerStats): string => {
    // Handle undefined by converting to null
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
        'talituse_juht'
    ].includes(position || '');
};

export const isKadett = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'kadett';
};

export const isAbipolitseinik = (playerStats: PlayerStats): boolean => {
    return playerStats.policePosition === 'abipolitseinik';
};

// Check if player is a group leader
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

// Check if player is a standard unit worker (not group leader)
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

// Get the department unit based on position
export const getPositionDepartmentUnit = (policePosition: string | null | undefined): string | null => {
    if (!policePosition) return null;

    const unitMap: Record<string, string> = {
        'patrullpolitseinik': 'patrol',
        'grupijuht_patrol': 'patrol',
        'uurija': 'procedural_service',
        'grupijuht_investigation': 'procedural_service',
        'kiirreageerija': 'emergency_response',
        'grupijuht_emergency': 'emergency_response',
        'koerajuht': 'k9_unit',
        'grupijuht_k9': 'k9_unit',
        'küberkriminalist': 'cyber_crime',
        'grupijuht_cyber': 'cyber_crime',
        'jälitaja': 'crime_unit',
        'grupijuht_crimes': 'crime_unit'
    };

    return unitMap[policePosition] || null;
};

// Check if player can apply for group leader position in their unit
export const canApplyForGroupLeader = (playerStats: PlayerStats, targetUnit: string): boolean => {
    const currentPosition = playerStats.policePosition;

    if (!isUnitWorker(playerStats)) return false;

    const currentUnit = getPositionDepartmentUnit(currentPosition);
    return currentUnit === targetUnit;
};

// Get corresponding group leader position for current position
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

/**
 * Counts current group leaders in a specific department unit
 * @param unitId - The department unit ID (e.g., 'patrol', 'procedural_service')
 * @returns Promise<number> - Number of current group leaders in that unit
 */
export const getGroupLeaderCountInUnit = async (unitId: string): Promise<number> => {
    const groupLeaderPositions = [
        'grupijuht_patrol',
        'grupijuht_investigation',
        'grupijuht_emergency',
        'grupijuht_k9',
        'grupijuht_cyber',
        'grupijuht_crimes'
    ];

    try {
        const playersQuery = query(
            collection(firestore, 'playerStats'),
            where('policePosition', 'in', groupLeaderPositions),
            where('departmentUnit', '==', unitId)
        );

        const querySnapshot = await getDocs(playersQuery);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error counting group leaders:', error);
        return 0;
    }
};

/**
 * Checks if unit can accept more group leaders (max 4 per unit)
 * @param unitId - The department unit ID
 * @returns Promise<boolean> - True if unit has space for more group leaders
 */
export const canUnitAcceptMoreGroupLeaders = async (unitId: string): Promise<boolean> => {
    const currentCount = await getGroupLeaderCountInUnit(unitId);
    return currentCount < 4;
};