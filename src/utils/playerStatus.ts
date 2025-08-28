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
        // NEW: Add the unit leader positions
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

// NEW: Check if player is a unit leader (talituse juht)
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

// NEW: Check if player is in any leadership position (grupijuht or talituse juht)
export const isInLeadership = (playerStats: PlayerStats): boolean => {
    return isGroupLeader(playerStats) || isUnitLeader(playerStats);
};

// Check if player is a standard unit worker (not group leader or unit leader)
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

        // NEW: Unit leaders
        'talituse_juht_patrol': 'patrol',
        'talituse_juht_investigation': 'procedural_service',
        'talituse_juht_emergency': 'emergency_response',
        'talituse_juht_k9': 'k9_unit',
        'talituse_juht_cyber': 'cyber_crime',
        'talituse_juht_crimes': 'crime_unit'
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

// NEW: Check if player can apply for unit leader position in their unit
export const canApplyForUnitLeader = (playerStats: PlayerStats, targetUnit: string): boolean => {
    const currentPosition = playerStats.policePosition;

    // Only group leaders can apply for unit leader positions
    if (!isGroupLeader(playerStats)) return false;

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

// NEW: Get corresponding unit leader position for unit
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

/**
 * NEW: Checks if unit already has a unit leader (talituse juht)
 * @param unitId - The department unit ID
 * @returns Promise<boolean> - True if unit already has a unit leader
 */
export const hasUnitLeader = async (unitId: string): Promise<boolean> => {
    const unitLeaderPosition = getUnitLeaderPositionForUnit(unitId);
    if (!unitLeaderPosition) return false;

    try {
        const playersQuery = query(
            collection(firestore, 'playerStats'),
            where('policePosition', '==', unitLeaderPosition),
            where('departmentUnit', '==', unitId)
        );

        const querySnapshot = await getDocs(playersQuery);
        return querySnapshot.size > 0;
    } catch (error) {
        console.error('Error checking unit leader:', error);
        return false;
    }
};

/**
 * NEW: Gets the current unit leader for a specific unit
 * @param unitId - The department unit ID
 * @returns Promise<string | null> - Username of current unit leader, or null if none
 */
export const getCurrentUnitLeader = async (unitId: string): Promise<string | null> => {
    const unitLeaderPosition = getUnitLeaderPositionForUnit(unitId);
    if (!unitLeaderPosition) return null;

    try {
        const playersQuery = query(
            collection(firestore, 'playerStats'),
            where('policePosition', '==', unitLeaderPosition),
            where('departmentUnit', '==', unitId)
        );

        const querySnapshot = await getDocs(playersQuery);
        if (querySnapshot.size > 0) {
            const doc = querySnapshot.docs[0];
            return doc.data().username || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting current unit leader:', error);
        return null;
    }
};