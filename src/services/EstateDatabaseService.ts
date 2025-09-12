// src/services/EstateDatabaseService.ts (UPDATED - removed sortOrder)
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { DatabaseEstate, CreateEstateData, UpdateEstateData } from '../types/estateDatabase';
import { EstateProperty } from '../types/estate';

const ESTATES_COLLECTION = 'estates';

// ============================================
// PUBLIC METHODS (For Players/Client Side)
// ============================================

/**
 * Get all active estates for players to buy
 */
export const getAvailableEstates = async (sortBy: 'price' | 'name' = 'price', sortOrder: 'asc' | 'desc' = 'asc'): Promise<EstateProperty[]> => {
    try {
        let q = query(
            collection(firestore, ESTATES_COLLECTION),
            where('isActive', '==', true)
        );

        // Apply sorting based on parameters
        if (sortBy === 'price') {
            q = query(q, orderBy('price', sortOrder));
        } else if (sortBy === 'name') {
            q = query(q, orderBy('name', sortOrder));
        }

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data() as DatabaseEstate;
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                price: data.price,
                hasGarage: data.hasGarage,
                garageCapacity: data.garageCapacity,
                hasWorkshop: data.hasWorkshop,
                kitchenSpace: data.kitchenSpace
            } as EstateProperty;
        });
    } catch (error) {
        console.error('Error fetching estates from database:', error);
        throw error;
    }
};

/**
 * Get single estate by ID (for players)
 */
export const getEstateById = async (id: string): Promise<EstateProperty | null> => {
    try {
        const docRef = doc(firestore, ESTATES_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data() as DatabaseEstate;

        if (!data.isActive) {
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            hasGarage: data.hasGarage,
            garageCapacity: data.garageCapacity,
            hasWorkshop: data.hasWorkshop,
            kitchenSpace: data.kitchenSpace
        } as EstateProperty;
    } catch (error) {
        console.error('Error fetching estate by ID:', error);
        throw error;
    }
};

// ============================================
// ADMIN METHODS (For Admin Panel)
// ============================================

export const getAllEstatesForAdmin = async (sortBy: 'name' | 'price' | 'createdAt' = 'name', sortOrder: 'asc' | 'desc' = 'asc'): Promise<DatabaseEstate[]> => {
    try {
        let q = query(collection(firestore, ESTATES_COLLECTION));

        // Apply sorting
        if (sortBy === 'name') {
            q = query(q, orderBy('name', sortOrder));
        } else if (sortBy === 'price') {
            q = query(q, orderBy('price', sortOrder));
        } else if (sortBy === 'createdAt') {
            q = query(q, orderBy('createdAt', sortOrder));
        }

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
        } as DatabaseEstate));
    } catch (error) {
        console.error('Error fetching estates for admin:', error);
        throw error;
    }
};

export const createEstate = async (
    estateData: CreateEstateData & { id?: string },
    adminUserId: string
): Promise<{ success: boolean; message: string; estateId?: string }> => {
    try {
        // Use provided ID or generate one from name
        const estateId = estateData.id || estateData.name.toLowerCase()
            .replace(/[äöüõ]/g, (match) => ({ ä: 'a', ö: 'o', ü: 'u', õ: 'o' }[match] || match))
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        // Check if estate already exists
        const existingEstate = await getDoc(doc(firestore, ESTATES_COLLECTION, estateId));
        if (existingEstate.exists()) {
            return {
                success: false,
                message: `Kinnisvara ID "${estateId}" on juba olemas!`
            };
        }

        const now = new Date();
        const newEstate: DatabaseEstate = {
            id: estateId,
            name: estateData.name,
            description: estateData.description,
            price: estateData.price,
            hasGarage: estateData.hasGarage,
            garageCapacity: estateData.garageCapacity,
            hasWorkshop: estateData.hasWorkshop,
            kitchenSpace: estateData.kitchenSpace,
            isActive: estateData.isActive ?? true,
            createdAt: now,
            updatedAt: now,
            createdBy: adminUserId
        };

        await setDoc(doc(firestore, ESTATES_COLLECTION, estateId), {
            ...newEstate,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
        });

        return {
            success: true,
            message: `Kinnisvara "${estateData.name}" edukalt loodud ID-ga "${estateId}"!`,
            estateId: estateId
        };
    } catch (error) {
        console.error('Error creating estate:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Tundmatu viga'
        };
    }
};

export const updateEstate = async (
    estateId: string,
    updateData: UpdateEstateData
): Promise<{ success: boolean; message: string }> => {
    try {
        const docRef = doc(firestore, ESTATES_COLLECTION, estateId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return {
                success: false,
                message: 'Kinnisvara ei leitud!'
            };
        }

        const updatePayload = {
            ...updateData,
            updatedAt: Timestamp.now()
        };

        await updateDoc(docRef, updatePayload);

        return {
            success: true,
            message: 'Kinnisvara edukalt uuendatud!'
        };
    } catch (error) {
        console.error('Error updating estate:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Tundmatu viga'
        };
    }
};

export const deleteEstate = async (
    estateId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const playersWithEstate = await checkPlayersWithEstate(estateId);

        if (playersWithEstate > 0) {
            return {
                success: false,
                message: `Ei saa kustutada! ${playersWithEstate} mängijal on see kinnisvara praegu omanduses.`
            };
        }

        await deleteDoc(doc(firestore, ESTATES_COLLECTION, estateId));

        return {
            success: true,
            message: 'Kinnisvara edukalt kustutatud!'
        };
    } catch (error) {
        console.error('Error deleting estate:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Tundmatu viga'
        };
    }
};

export const toggleEstateStatus = async (
    estateId: string,
    isActive: boolean,
    adminUserId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const docRef = doc(firestore, ESTATES_COLLECTION, estateId);

        await updateDoc(docRef, {
            isActive: isActive,
            updatedBy: adminUserId,
            updatedAt: Timestamp.now()
        });

        const statusText = isActive ? 'aktiveeritud' : 'deaktiveeritud';

        return {
            success: true,
            message: `Kinnisvara edukalt ${statusText}!`
        };
    } catch (error) {
        console.error('Error toggling estate status:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Tundmatu viga'
        };
    }
};

// ============================================
// HELPER METHODS
// ============================================

const checkPlayersWithEstate = async (estateId: string): Promise<number> => {
    try {
        const q = query(
            collection(firestore, 'playerEstates'),
            where('currentEstate.id', '==', estateId)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error checking players with estate:', error);
        return 0;
    }
};

export const getEstateStatistics = async (): Promise<{
    totalEstates: number;
    activeEstates: number;
    inactiveEstates: number;
    averagePrice: number;
}> => {
    try {
        const querySnapshot = await getDocs(collection(firestore, ESTATES_COLLECTION));
        const estates = querySnapshot.docs.map(doc => doc.data() as DatabaseEstate);

        const totalEstates = estates.length;
        const activeEstates = estates.filter(e => e.isActive).length;
        const inactiveEstates = totalEstates - activeEstates;

        const totalPrice = estates.reduce((sum, estate) => sum + estate.price, 0);
        const averagePrice = totalEstates > 0 ? Math.round(totalPrice / totalEstates) : 0;

        return {
            totalEstates,
            activeEstates,
            inactiveEstates,
            averagePrice
        };
    } catch (error) {
        console.error('Error getting estate statistics:', error);
        return {
            totalEstates: 0,
            activeEstates: 0,
            inactiveEstates: 0,
            averagePrice: 0
        };
    }
};