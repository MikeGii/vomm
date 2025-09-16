// src/services/TrackedFirestore.ts - PARANDATUD VERSIOON
import * as originalFirestore from 'firebase/firestore';
import { globalDatabaseTracker } from './GlobalDatabaseTracker';

const getCollectionFromPath = (path: string): string => {
    return path.split('/')[0];
};

const getCollectionFromQuery = (query: any): string => {
    if (query._query && query._query.path && query._query.path.segments) {
        return query._query.path.segments[0];
    }
    return 'unknown';
};

export const getDoc = async (docRef: originalFirestore.DocumentReference) => {
    const collectionName = getCollectionFromPath(docRef.path);
    globalDatabaseTracker.trackRequest('read', collectionName);
    return await originalFirestore.getDoc(docRef);
};

export const getDocs = async (query: originalFirestore.Query) => {
    const collectionName = getCollectionFromQuery(query);
    globalDatabaseTracker.trackRequest('read', collectionName);
    return await originalFirestore.getDocs(query);
};

// PARANDATUD - overload funktsioonid
export const setDoc = async (
    docRef: originalFirestore.DocumentReference,
    data: any,
    options?: originalFirestore.SetOptions
) => {
    const collectionName = getCollectionFromPath(docRef.path);
    globalDatabaseTracker.trackRequest('write', collectionName);

    // Kui options on undefined, ära edasta seda
    if (options !== undefined) {
        return await originalFirestore.setDoc(docRef, data, options);
    } else {
        return await originalFirestore.setDoc(docRef, data);
    }
};

export const updateDoc = async (docRef: originalFirestore.DocumentReference, data: any) => {
    const collectionName = getCollectionFromPath(docRef.path);
    globalDatabaseTracker.trackRequest('write', collectionName);
    return await originalFirestore.updateDoc(docRef, data);
};

export const addDoc = async (collectionRef: originalFirestore.CollectionReference, data: any) => {
    const collectionName = collectionRef.path;
    globalDatabaseTracker.trackRequest('write', collectionName);
    return await originalFirestore.addDoc(collectionRef, data);
};

export const deleteDoc = async (docRef: originalFirestore.DocumentReference) => {
    const collectionName = getCollectionFromPath(docRef.path);
    globalDatabaseTracker.trackRequest('write', collectionName);
    return await originalFirestore.deleteDoc(docRef); // Eemaldatud vale "data" parameeter
};

export const runTransaction = async <T>(
    updateFunction: (transaction: originalFirestore.Transaction) => Promise<T>
): Promise<T> => {
    globalDatabaseTracker.trackRequest('write', 'transaction');
    return await originalFirestore.runTransaction(originalFirestore.getFirestore(), updateFunction);
};

export const writeBatch = () => {
    // PARANDA - eemalda getFirestore() argument
    const batch = originalFirestore.writeBatch(originalFirestore.getFirestore());

    const originalCommit = batch.commit;
    batch.commit = async () => {
        globalDatabaseTracker.trackRequest('write', 'batch');
        return await originalCommit.call(batch);
    };

    return batch;
};

// Export kõik muud Firebase funktsioonid
export {
    doc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    getFirestore
} from 'firebase/firestore';