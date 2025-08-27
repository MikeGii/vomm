// src/services/CrimeService.ts
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { DepartmentCrimeStats, CrimeReductionResult, DepartmentCrimeDisplay } from '../types/crimeActivity';
import { getAllGraduatedPlayers } from './DepartmentService';
import { PREFECTURES } from '../data/prefectures';

const CRIME_COLLECTION = 'departmentCrimeStats';
const DAILY_CRIME_INCREASE = 5; // 5% per day
const BASE_REDUCTION_FOR_10_PLAYERS = 1; // 1% for 12h work with 10 players
const MAX_CRIME_LEVEL = 100;


/**
 * Initialize crime stats for all departments in the game
 * This should be run once when the feature launches
 */
export const initializeAllDepartmentCrimeStats = async (): Promise<void> => {
    try {
        console.log('Starting initialization of all department crime stats...');

        const now = Timestamp.now();
        const batch = [];

        // Iterate through all prefectures and departments
        for (const prefecture of PREFECTURES) {
            for (const department of prefecture.departments) {
                // Skip Sisekaitseakadeemia as specified
                if (department === 'Sisekaitseakadeemia') {
                    continue;
                }

                // Check if document already exists
                const docRef = doc(firestore, CRIME_COLLECTION, department);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    const crimeStats: DepartmentCrimeStats = {
                        departmentId: department,
                        prefecture: prefecture.name,
                        currentCrimeLevel: 50, // Start at 50%
                        lastDailyUpdate: now,
                        monthlyResetDate: now,
                        totalWorkHoursThisMonth: 0,
                        lastUpdated: now
                    };

                    batch.push(setDoc(docRef, crimeStats));
                    console.log(`Initializing crime stats for: ${department} (${prefecture.name})`);
                }
            }
        }

        // Execute all batch operations
        await Promise.all(batch);

        console.log(`Initialization complete! Created crime stats for ${batch.length} departments.`);

    } catch (error) {
        console.error('Error initializing all department crime stats:', error);
        throw error;
    }
};

/**
 * Get list of all departments that should have crime stats
 * Useful for verification and debugging
 */
export const getAllExpectedDepartments = (): Array<{departmentId: string, prefecture: string}> => {
    const departments: Array<{departmentId: string, prefecture: string}> = [];

    PREFECTURES.forEach(prefecture => {
        prefecture.departments.forEach(department => {
            if (department !== 'Sisekaitseakadeemia') {
                departments.push({
                    departmentId: department,
                    prefecture: prefecture.name
                });
            }
        });
    });

    return departments;
};

/**
 * Check which departments are missing crime stats
 * Useful for debugging
 */
export const getMissingDepartmentStats = async (): Promise<Array<{departmentId: string, prefecture: string}>> => {
    try {
        const expectedDepartments = getAllExpectedDepartments();
        const missing: Array<{departmentId: string, prefecture: string}> = [];

        for (const dept of expectedDepartments) {
            const docRef = doc(firestore, CRIME_COLLECTION, dept.departmentId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                missing.push(dept);
            }
        }

        return missing;

    } catch (error) {
        console.error('Error checking missing department stats:', error);
        return [];
    }
};

/**
 * Get current count of graduated players in specific department
 */
const getDepartmentPlayerCount = async (departmentId: string): Promise<number> => {
    try {
        const allPlayers = await getAllGraduatedPlayers();

        // Count only graduated players (exclude abipolitseinik, kadett, and null positions)
        // Also exclude Sisekaitseakadeemia as specified
        const departmentPlayers = allPlayers.filter(player =>
            player.department === departmentId &&
            player.department !== 'Sisekaitseakadeemia'
        );

        return departmentPlayers.length;
    } catch (error) {
        console.error('Error getting department player count:', error);
        return 10; // Default to 10 to prevent division by zero
    }
};

/**
 * Calculate crime reduction amount based on work hours and department size
 */
const calculateCrimeReduction = (workHours: number, departmentPlayerCount: number): number => {
    // Ensure minimum of 1 player to prevent division by zero
    const playerCount = Math.max(departmentPlayerCount, 1);

    // Base calculation: 1% reduction for 12h work with 10 players
    const baseReduction = BASE_REDUCTION_FOR_10_PLAYERS;
    const hourMultiplier = workHours / 12; // Scale based on hours worked
    const playerMultiplier = 10 / playerCount; // Inverse relationship with player count

    const reduction = baseReduction * hourMultiplier * playerMultiplier;

    // Round to 2 decimal places for clean display
    return Math.round(reduction * 100) / 100;
};

/**
 * Initialize crime stats for a department if it doesn't exist
 */
const initializeDepartmentCrime = async (
    departmentId: string,
    prefecture: string
): Promise<DepartmentCrimeStats> => {
    const now = Timestamp.now();

    const crimeStats: DepartmentCrimeStats = {
        departmentId,
        prefecture,
        currentCrimeLevel: 50, // Start at 50%
        lastDailyUpdate: now,
        monthlyResetDate: now,
        totalWorkHoursThisMonth: 0,
        lastUpdated: now
    };

    // Create document with department name as ID for easy lookup
    const docRef = doc(firestore, CRIME_COLLECTION, departmentId);
    await setDoc(docRef, crimeStats);

    return crimeStats;
};

/**
 * Get or create department crime stats
 */
export const getDepartmentCrimeStats = async (
    departmentId: string,
    prefecture: string
): Promise<DepartmentCrimeStats> => {
    try {
        const docRef = doc(firestore, CRIME_COLLECTION, departmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as DepartmentCrimeStats;
        } else {
            // Initialize if doesn't exist
            return await initializeDepartmentCrime(departmentId, prefecture);
        }
    } catch (error) {
        console.error('Error getting department crime stats:', error);
        throw error;
    }
};

/**
 * Update department crime level after work completion
 */
export const updateCrimeLevelAfterWork = async (
    prefecture: string,
    departmentId: string,
    workHours: number
): Promise<CrimeReductionResult> => {
    try {
        // Skip if department is Sisekaitseakadeemia
        if (departmentId === 'Sisekaitseakadeemia') {
            return {
                success: false,
                previousCrimeLevel: 0,
                newCrimeLevel: 0,
                reductionAmount: 0,
                departmentPlayerCount: 0,
                message: 'Sisekaitseakadeemia ei mõjuta kuritegevuse taset'
            };
        }

        // Get current crime stats
        const crimeStats = await getDepartmentCrimeStats(departmentId, prefecture);

        // Get current player count for this department
        const playerCount = await getDepartmentPlayerCount(departmentId);

        // Calculate reduction amount
        const reductionAmount = calculateCrimeReduction(workHours, playerCount);

        const previousLevel = crimeStats.currentCrimeLevel;
        const newLevel = Math.max(0, previousLevel - reductionAmount); // Can't go below 0%

        // Update in database
        const docRef = doc(firestore, CRIME_COLLECTION, departmentId);
        await updateDoc(docRef, {
            currentCrimeLevel: newLevel,
            totalWorkHoursThisMonth: (crimeStats.totalWorkHoursThisMonth || 0) + workHours,
            lastUpdated: Timestamp.now()
        });

        return {
            success: true,
            previousCrimeLevel: previousLevel,
            newCrimeLevel: newLevel,
            reductionAmount,
            departmentPlayerCount: playerCount,
            message: `Kuritegevuse tase vähenes ${reductionAmount}% (${previousLevel}% → ${newLevel}%)`
        };

    } catch (error) {
        console.error('Error updating crime level:', error);
        return {
            success: false,
            previousCrimeLevel: 0,
            newCrimeLevel: 0,
            reductionAmount: 0,
            departmentPlayerCount: 0,
            message: 'Viga kuritegevuse taseme uuendamisel'
        };
    }
};

/**
 * Get all departments' crime stats for display
 */
export const getAllDepartmentCrimeStats = async (): Promise<DepartmentCrimeDisplay[]> => {
    try {
        const crimeCollection = collection(firestore, CRIME_COLLECTION);
        const querySnapshot = await getDocs(crimeCollection);

        const results: DepartmentCrimeDisplay[] = [];

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data() as DepartmentCrimeStats;
            const playerCount = await getDepartmentPlayerCount(data.departmentId);

            // Calculate days until next monthly reset
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            results.push({
                departmentId: data.departmentId,
                prefecture: data.prefecture,
                currentCrimeLevel: data.currentCrimeLevel,
                playerCount,
                lastUpdated: data.lastUpdated.toDate(),
                daysUntilReset
            });
        }

        // Sort by crime level (highest first)
        return results.sort((a, b) => b.currentCrimeLevel - a.currentCrimeLevel);

    } catch (error) {
        console.error('Error getting all crime stats:', error);
        return [];
    }
};

/**
 * Manual daily crime increase (will be automated later)
 */
export const increaseDailyCrime = async (): Promise<void> => {
    try {
        const crimeCollection = collection(firestore, CRIME_COLLECTION);
        const querySnapshot = await getDocs(crimeCollection);

        const batch = [];
        const now = Timestamp.now();

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data() as DepartmentCrimeStats;
            const newLevel = Math.min(MAX_CRIME_LEVEL, data.currentCrimeLevel + DAILY_CRIME_INCREASE);

            batch.push(
                updateDoc(doc(firestore, CRIME_COLLECTION, docSnap.id), {
                    currentCrimeLevel: newLevel,
                    lastDailyUpdate: now,
                    lastUpdated: now
                })
            );
        }

        await Promise.all(batch);
        console.log('Daily crime increase completed for all departments');

    } catch (error) {
        console.error('Error increasing daily crime:', error);
        throw error;
    }
};

/**
 * Monthly reset (1st of month at 00:01)
 */
export const monthlyResetCrime = async (): Promise<void> => {
    try {
        const crimeCollection = collection(firestore, CRIME_COLLECTION);
        const querySnapshot = await getDocs(crimeCollection);

        const batch = [];
        const now = Timestamp.now();

        for (const docSnap of querySnapshot.docs) {
            batch.push(
                updateDoc(doc(firestore, CRIME_COLLECTION, docSnap.id), {
                    currentCrimeLevel: 50, // Reset to 50%
                    monthlyResetDate: now,
                    totalWorkHoursThisMonth: 0,
                    lastDailyUpdate: now,
                    lastUpdated: now
                })
            );
        }

        await Promise.all(batch);
        console.log('Monthly crime reset completed for all departments');

    } catch (error) {
        console.error('Error resetting monthly crime:', error);
        throw error;
    }
};