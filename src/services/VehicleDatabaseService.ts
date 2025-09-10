// src/services/VehicleDatabaseService.ts
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import {
    VehicleBrand,
    VehicleModel,
    VehicleEngine,
    CreateVehicleBrandData,
    CreateVehicleModelData,
    CreateVehicleEngineData
} from '../types/vehicleDatabase';

// Collections
const BRANDS_COLLECTION = 'vehicleBrands';
const MODELS_COLLECTION = 'vehicleModels';
const ENGINES_COLLECTION = 'vehicleEngines';

// Vehicle Brands
export const createVehicleBrand = async (
    data: CreateVehicleBrandData,
    createdBy: string
): Promise<string> => {
    const now = Timestamp.now();
    const brandData: Omit<VehicleBrand, 'id'> = {
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy
    };

    const docRef = await addDoc(collection(firestore, BRANDS_COLLECTION), brandData);
    return docRef.id;
};

export const getAllVehicleBrands = async (): Promise<VehicleBrand[]> => {
    const querySnapshot = await getDocs(
        query(collection(firestore, BRANDS_COLLECTION), orderBy('name'))
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VehicleBrand));
};

export const updateVehicleBrand = async (
    id: string,
    updates: Partial<CreateVehicleBrandData>
): Promise<void> => {
    const docRef = doc(firestore, BRANDS_COLLECTION, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
};

export const deleteVehicleBrand = async (id: string): Promise<void> => {
    // TODO: Add validation to prevent deletion if models exist
    const docRef = doc(firestore, BRANDS_COLLECTION, id);
    await deleteDoc(docRef);
};

// Vehicle Engines
export const createVehicleEngine = async (
    data: CreateVehicleEngineData,
    createdBy: string
): Promise<string> => {
    const now = Timestamp.now();
    const engineData: Omit<VehicleEngine, 'id'> = {
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy
    };

    const docRef = await addDoc(collection(firestore, ENGINES_COLLECTION), engineData);
    return docRef.id;
};

export const getAllVehicleEngines = async (): Promise<VehicleEngine[]> => {
    const querySnapshot = await getDocs(
        query(collection(firestore, ENGINES_COLLECTION), orderBy('code'))
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VehicleEngine));
};

export const getVehicleEnginesByBrand = async (brandName: string): Promise<VehicleEngine[]> => {
    const querySnapshot = await getDocs(
        query(
            collection(firestore, ENGINES_COLLECTION),
            where('brandName', '==', brandName),
            orderBy('code')
        )
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VehicleEngine));
};

export const updateVehicleEngine = async (
    id: string,
    updates: Partial<CreateVehicleEngineData>
): Promise<void> => {
    const docRef = doc(firestore, ENGINES_COLLECTION, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
};

export const deleteVehicleEngine = async (id: string): Promise<void> => {
    // TODO: Add validation to prevent deletion if models use this engine
    const docRef = doc(firestore, ENGINES_COLLECTION, id);
    await deleteDoc(docRef);
};

// Vehicle Models
export const createVehicleModel = async (
    data: CreateVehicleModelData,
    createdBy: string
): Promise<string> => {
    // Get brand name for denormalization
    const brandDoc = await getDoc(doc(firestore, BRANDS_COLLECTION, data.brandId));
    if (!brandDoc.exists()) {
        throw new Error('Brand not found');
    }

    const brandName = brandDoc.data().name;
    const now = Timestamp.now();

    const modelData: any = {
        ...data,
        brandName,
        createdAt: now,
        updatedAt: now,
        createdBy
    };

    // Remove undefined values that Firestore doesn't like
    Object.keys(modelData).forEach(key => {
        if (modelData[key] === undefined) {
            delete modelData[key];
        }
    });

    const docRef = await addDoc(collection(firestore, MODELS_COLLECTION), modelData);
    return docRef.id;
};

export const getAllVehicleModels = async (): Promise<VehicleModel[]> => {
    const querySnapshot = await getDocs(
        query(collection(firestore, MODELS_COLLECTION), orderBy('brandName'), orderBy('model'))
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VehicleModel));
};

export const getVehicleModelsByBrand = async (brandId: string): Promise<VehicleModel[]> => {
    const querySnapshot = await getDocs(
        query(
            collection(firestore, MODELS_COLLECTION),
            where('brandId', '==', brandId),
            orderBy('model')
        )
    );

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VehicleModel));
};

export const updateVehicleModel = async (
    id: string,
    updates: Partial<CreateVehicleModelData>
): Promise<void> => {
    const updateData: any = { ...updates };

    // If brandId is being updated, update brandName too
    if (updates.brandId) {
        const brandDoc = await getDoc(doc(firestore, BRANDS_COLLECTION, updates.brandId));
        if (brandDoc.exists()) {
            updateData.brandName = brandDoc.data().name;
        }
    }

    const docRef = doc(firestore, MODELS_COLLECTION, id);
    await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now()
    });
};

export const deleteVehicleModel = async (id: string): Promise<void> => {
    // TODO: Add validation to prevent deletion if players own this model
    const docRef = doc(firestore, MODELS_COLLECTION, id);
    await deleteDoc(docRef);
};