// src/services/playerService.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';

// Estonian police ranks from lowest to highest
const POLICE_RANKS = [
    'Abipolitseinik',
    'Kadett',
    'Noorinspektor',
    'Inspektor',
    'Vaneminspektor',
    'Üleminspektor',
    'Komissar',
    'Vanemkomissar',
    'Politseileitnant',
    'Politseikapten',
    'Politseimajor',
    'Politseikolonelleitnant',
    'Politseikolonel',
    'Politseikindralinspektor',
    'Politseikindral'
];

export const initializePlayerStats = async (userId: string): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        return statsDoc.data() as PlayerStats;
    }

    // Create initial stats for new player - starts unemployed
    const initialStats: PlayerStats = {
        level: 1,
        experience: 0,
        reputation: 0,  // No reputation when unemployed
        rank: null,  // No rank when unemployed
        department: null,  // No department when unemployed
        badgeNumber: null,  // No badge when unemployed
        isEmployed: false,
        casesCompleted: 0,
        criminalsArrested: 0
    };

    await setDoc(statsRef, initialStats);
    return initialStats;
};

export const getPlayerStats = async (userId: string): Promise<PlayerStats | null> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
        return statsDoc.data() as PlayerStats;
    }

    return null;
};

// Function to hire player as police officer
export const hireAsPoliceOfficer = async (userId: string): Promise<PlayerStats> => {
    const statsRef = doc(firestore, 'playerStats', userId);
    const currentStats = await getPlayerStats(userId);

    if (!currentStats) {
        throw new Error('Mängija andmed puuduvad');
    }

    const updatedStats: PlayerStats = {
        ...currentStats,
        isEmployed: true,
        rank: POLICE_RANKS[0], // Start as Abipolitseinik
        department: 'Patrulltalitus',
        badgeNumber: Math.floor(10000 + Math.random() * 90000).toString(),
        reputation: 100  // Starting reputation when joining force
    };

    await setDoc(statsRef, updatedStats);
    return updatedStats;
};