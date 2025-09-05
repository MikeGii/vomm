import {
    collection,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
    runTransaction, getDoc
} from 'firebase/firestore';
import { firestore as db } from '../config/firebase';
import { PlayerCar, CarModel } from '../types/vehicles';
import { GarageSlot } from '../types/estate'; // Lisa see import!
import { createStockEngine } from '../data/vehicles';


async function ensureGarageSlots(
    transaction: any,
    userRef: any,
    userData: any,
    userId: string
): Promise<GarageSlot[]> {
    // Kui garaaži slotid juba olemas, tagasta need
    if (userData.estateData?.garageSlots && userData.estateData.garageSlots.length > 0) {
        return userData.estateData.garageSlots;
    }

    // Kontrolli kas kasutajal on kinnisvara garaažiga
    const estateRef = doc(db, 'playerEstates', userId);
    const estateDoc = await transaction.get(estateRef);

    if (!estateDoc.exists()) {
        return [];
    }

    const estateData = estateDoc.data();
    const currentEstate = estateData.currentEstate;

    // Kui pole kinnisvara või pole garaaži
    if (!currentEstate?.hasGarage || !currentEstate?.garageCapacity) {
        return [];
    }

    // Loo uued tühjad garaaži slotid
    const newSlots: GarageSlot[] = [];
    for (let i = 1; i <= currentEstate.garageCapacity; i++) {
        newSlots.push({
            slotId: i,
            isEmpty: true
        });
    }

    // Uuenda kasutaja dokument uute slottidega
    transaction.update(userRef, {
        'estateData.garageSlots': newSlots
    });

    console.log(`Initialized ${newSlots.length} garage slots for user ${userId}`);
    return newSlots;
}

// Uuenda purchaseNewCar funktsiooni
export async function purchaseNewCar(
    userId: string,
    carModel: CarModel
): Promise<{ success: boolean; message: string; carId?: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error('Kasutajat ei leitud');
            }

            const userData = userDoc.data();

            // Kontrolli raha
            if (userData.money < carModel.basePrice) {
                throw new Error('Pole piisavalt raha');
            }

            // UUENDATUD: Kasuta ensureGarageSlots funktsiooni
            const garageSlots = await ensureGarageSlots(
                transaction,
                userRef,
                userData,
                userId
            );

            // Kui pole ühtegi slotti (pole garaaži)
            if (garageSlots.length === 0) {
                throw new Error('Sul pole garaaži! Osta kõigepealt garaažiga kinnisvara.');
            }

            // Leia tühi slot
            const emptySlotIndex = garageSlots.findIndex((slot: GarageSlot) => slot.isEmpty);

            if (emptySlotIndex === -1) {
                throw new Error('Garaažis pole ruumi');
            }

            // ... ülejäänud kood jääb samaks

            // Loo uus auto
            const newCar: PlayerCar = {
                id: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ownerId: userId,
                carModelId: carModel.id,
                mileage: 0,
                purchaseDate: new Date(),
                engine: createStockEngine(carModel.defaultEngine),
                isForSale: false
            };

            // Salvesta auto
            const carRef = doc(db, 'cars', newCar.id);
            transaction.set(carRef, {
                ...newCar,
                purchaseDate: Timestamp.fromDate(newCar.purchaseDate)
            });

            // Uuenda garaaži slot
            garageSlots[emptySlotIndex] = {
                slotId: garageSlots[emptySlotIndex].slotId,
                isEmpty: false,
                carId: newCar.id
            };

            // Uuenda kasutaja andmed (raha ja garaaž)
            transaction.update(userRef, {
                money: userData.money - carModel.basePrice,
                'estateData.garageSlots': garageSlots
            });

            return {
                success: true,
                message: `${carModel.brand} ${carModel.model} ostetud!`,
                carId: newCar.id
            };
        });
    } catch (error: any) {
        console.error('Error purchasing car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto ostmisel'
        };
    }
}

// Osta kasutatud auto (täiustatud transaktsiooniga)
export async function purchaseUsedCar(
    buyerId: string,
    carId: string
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            // Loe kõik vajalikud dokumendid
            const carRef = doc(db, 'cars', carId);
            const buyerRef = doc(db, 'users', buyerId);

            const carDoc = await transaction.get(carRef);
            const buyerDoc = await transaction.get(buyerRef);

            // Kontrolli auto olemasolu
            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            // Kontrolli kas auto on veel müügis
            if (!carData.isForSale) {
                throw new Error('Auto ei ole enam müügis');
            }

            // Kontrolli et ei osta enda autot
            if (carData.ownerId === buyerId) {
                throw new Error('Ei saa osta enda autot');
            }

            // Kontrolli ostja olemasolu
            if (!buyerDoc.exists()) {
                throw new Error('Ostja andmed ei leitud');
            }

            const buyerData = buyerDoc.data();
            const salePrice = carData.salePrice || 0;

            // Kontrolli raha
            if (buyerData.money < salePrice) {
                throw new Error('Pole piisavalt raha');
            }

            // Kontrolli garaaži ruumi - õige tüübiga
            const buyerGarageSlots: GarageSlot[] = buyerData.estateData?.garageSlots || [];
            const emptySlotIndex = buyerGarageSlots.findIndex((slot: GarageSlot) => slot.isEmpty);

            if (emptySlotIndex === -1) {
                throw new Error('Garaažis pole ruumi');
            }

            // Loe müüja andmed
            const sellerRef = doc(db, 'users', carData.ownerId);
            const sellerDoc = await transaction.get(sellerRef);

            if (!sellerDoc.exists()) {
                throw new Error('Müüja andmed ei leitud');
            }

            const sellerData = sellerDoc.data();

            // Leia müüja garaaži slot - õige tüübiga
            const sellerGarageSlots: GarageSlot[] = sellerData.estateData?.garageSlots || [];
            const sellerSlotIndex = sellerGarageSlots.findIndex(
                (slot: GarageSlot) => slot.carId === carId
            );

            // Tee kõik muudatused transaktsiooniliselt

            // 1. Uuenda auto omanik ja eemalda müügist
            transaction.update(carRef, {
                ownerId: buyerId,
                isForSale: false,
                salePrice: null,
                listedAt: null,
                previousOwner: carData.ownerId // Lisa eelmine omanik
            });

            // 2. Uuenda müüja (raha ja garaaž)
            if (sellerSlotIndex !== -1) {
                sellerGarageSlots[sellerSlotIndex] = {
                    slotId: sellerGarageSlots[sellerSlotIndex].slotId,
                    isEmpty: true,
                    carId: undefined
                };
            }

            transaction.update(sellerRef, {
                money: sellerData.money + salePrice,
                'estateData.garageSlots': sellerGarageSlots
            });

            // 3. Uuenda ostja (raha ja garaaž)
            buyerGarageSlots[emptySlotIndex] = {
                slotId: buyerGarageSlots[emptySlotIndex].slotId,
                isEmpty: false,
                carId: carId
            };

            transaction.update(buyerRef, {
                money: buyerData.money - salePrice,
                'estateData.garageSlots': buyerGarageSlots
            });

            return {
                success: true,
                message: 'Auto ostetud!'
            };
        });
    } catch (error: any) {
        console.error('Error purchasing used car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto ostmisel'
        };
    }
}

// Pane auto müüki (transaktsiooniga)
export async function listCarForSale(
    userId: string,
    carId: string,
    price: number
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            // Kontrolli auto ja omaniku õigsust
            const carRef = doc(db, 'cars', carId);
            const carDoc = await transaction.get(carRef);

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            // Kontrolli omandiõigust
            if (carData.ownerId !== userId) {
                throw new Error('See ei ole sinu auto');
            }

            // Kontrolli kas juba müügis
            if (carData.isForSale) {
                throw new Error('Auto on juba müügis');
            }

            // Kontrolli hinda
            if (price < 100) {
                throw new Error('Hind peab olema vähemalt $100');
            }

            if (price > 10000000) {
                throw new Error('Hind on liiga kõrge');
            }

            // Pane müüki
            transaction.update(carRef, {
                isForSale: true,
                salePrice: price,
                listedAt: Timestamp.now()
            });

            return {
                success: true,
                message: 'Auto pandud müüki!'
            };
        });
    } catch (error: any) {
        console.error('Error listing car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto müüki panemisel'
        };
    }
}

// Võta auto müügist maha (transaktsiooniga)
export async function unlistCarFromSale(
    userId: string,
    carId: string
): Promise<{ success: boolean; message: string }> {
    try {
        return await runTransaction(db, async (transaction) => {
            const carRef = doc(db, 'cars', carId);
            const carDoc = await transaction.get(carRef);

            if (!carDoc.exists()) {
                throw new Error('Autot ei leitud');
            }

            const carData = carDoc.data() as PlayerCar;

            // Kontrolli omandiõigust
            if (carData.ownerId !== userId) {
                throw new Error('See ei ole sinu auto');
            }

            // Kontrolli kas on müügis
            if (!carData.isForSale) {
                throw new Error('Auto ei ole müügis');
            }

            // Eemalda müügist
            transaction.update(carRef, {
                isForSale: false,
                salePrice: null,
                listedAt: null
            });

            return {
                success: true,
                message: 'Auto eemaldatud müügist'
            };
        });
    } catch (error: any) {
        console.error('Error unlisting car:', error);
        return {
            success: false,
            message: error.message || 'Viga auto müügist eemaldamisel'
        };
    }
}

// Saa kasutaja autod (ei vaja transaktsiooni)
export async function getUserCars(userId: string): Promise<PlayerCar[]> {
    try {
        const carsQuery = query(
            collection(db, 'cars'),
            where('ownerId', '==', userId)
        );

        const snapshot = await getDocs(carsQuery);
        const cars: PlayerCar[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            cars.push({
                ...data,
                id: doc.id,
                purchaseDate: data.purchaseDate?.toDate() || new Date()
            } as PlayerCar);
        });

        return cars;
    } catch (error) {
        console.error('Error fetching user cars:', error);
        return [];
    }
}

// Saa müügis olevad autod (ei vaja transaktsiooni)
export async function getCarsForSale(): Promise<Array<PlayerCar & { sellerName?: string }>> {
    try {
        console.log('Starting to fetch cars for sale...'); // DEBUG

        const carsQuery = query(
            collection(db, 'cars'),
            where('isForSale', '==', true)
            // Eemalda orderBy ajutiselt, kuni index valmis
        );

        const snapshot = await getDocs(carsQuery);
        console.log('Found cars:', snapshot.size); // DEBUG

        const cars: Array<PlayerCar & { sellerName?: string }> = [];

        // Kogume kõik unikaalsed ownerId-d
        const ownerIds = new Set<string>();
        const carDocs: any[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Car data:', data); // DEBUG
            ownerIds.add(data.ownerId);
            carDocs.push({ id: doc.id, ...data });
        });

        // Päri kõik kasutajad korraga (efektiivsem)
        const userPromises = Array.from(ownerIds).map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                    userId,
                    username: userData.username || userData.displayName || 'Kasutaja'
                };
            }
            return { userId, username: 'Kasutaja' };
        });

        const users = await Promise.all(userPromises);
        const userMap = new Map(users.map(u => [u.userId, u.username]));

        // Ühenda autod müüja nimedega
        carDocs.forEach((carData) => {
            cars.push({
                ...carData,
                id: carData.id,
                purchaseDate: carData.purchaseDate?.toDate() || new Date(),
                listedAt: carData.listedAt?.toDate(),
                sellerName: userMap.get(carData.ownerId) || 'Kasutaja'
            } as PlayerCar & { sellerName?: string });
        });

        // Sorteeri JavaScriptis kuni Firestore index valmis
        cars.sort((a, b) => {
            const dateA = a.listedAt || new Date(0);
            const dateB = b.listedAt || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        console.log('Final sorted cars:', cars); // DEBUG
        return cars;
    } catch (error) {
        console.error('Error fetching cars for sale:', error);
        return [];
    }
}