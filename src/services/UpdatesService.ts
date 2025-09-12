// src/services/UpdatesService.ts
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    limit,
    startAfter,
    DocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { DatabaseUpdate, CreateUpdateData, UpdateUpdateData } from '../types/updates';

const UPDATES_COLLECTION = 'updates';

/**
 * Create a new update
 */
export const createUpdate = async (
    data: CreateUpdateData,
    createdBy: string
): Promise<string> => {
    const now = Timestamp.now();

    const updateData: Omit<DatabaseUpdate, 'id'> = {
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy
    };

    const docRef = await addDoc(collection(firestore, UPDATES_COLLECTION), updateData);
    return docRef.id;
};

/**
 * Get all updates with pagination
 */
export const getUpdates = async (
    pageSize: number = 10,
    lastDoc?: DocumentSnapshot
): Promise<{
    updates: DatabaseUpdate[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
}> => {
    let q = query(
        collection(firestore, UPDATES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
    );

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);

    const updates: DatabaseUpdate[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as DatabaseUpdate));

    const hasMore = querySnapshot.docs.length === pageSize;
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
        updates,
        hasMore,
        lastDoc: newLastDoc
    };
};

/**
 * Get all updates for admin panel (no pagination needed for admin)
 */
export const getAllUpdatesForAdmin = async (): Promise<DatabaseUpdate[]> => {
    const querySnapshot = await getDocs(
        query(
            collection(firestore, UPDATES_COLLECTION),
            orderBy('createdAt', 'desc')
        )
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as DatabaseUpdate));
};

/**
 * Update an existing update
 */
export const updateUpdate = async (
    id: string,
    data: UpdateUpdateData,
    updatedBy: string
): Promise<void> => {
    const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
        updatedBy
    };

    const docRef = doc(firestore, UPDATES_COLLECTION, id);
    await updateDoc(docRef, updateData);
};

/**
 * Delete an update
 */
export const deleteUpdate = async (id: string): Promise<void> => {
    const docRef = doc(firestore, UPDATES_COLLECTION, id);
    await deleteDoc(docRef);
};

/**
 * Toggle NEW status of an update
 */
export const toggleUpdateNewStatus = async (
    id: string,
    isNew: boolean,
    updatedBy: string
): Promise<void> => {
    await updateUpdate(id, { isNew }, updatedBy);
};

/**
 * Get updates for public display (with pagination)
 */
export const getUpdatesForPublic = async (
    pageSize: number = 5,
    lastDoc?: DocumentSnapshot
): Promise<{
    updates: DatabaseUpdate[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
}> => {
    let q = query(
        collection(firestore, UPDATES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
    );

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);

    const updates: DatabaseUpdate[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as DatabaseUpdate));

    const hasMore = querySnapshot.docs.length === pageSize;
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
        updates,
        hasMore,
        lastDoc: newLastDoc
    };
};

/**
 * Get total count of updates (for display purposes)
 */
export const getUpdatesCount = async (): Promise<number> => {
    const querySnapshot = await getDocs(collection(firestore, UPDATES_COLLECTION));
    return querySnapshot.size;
};