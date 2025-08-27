// src/services/BankService.ts
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    orderBy,
    limit,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerSearchResult, BankTransaction } from '../types';
import { PlayerStats } from '../types';

/**
 * Search for a player by badge number
 */
export const searchPlayerByBadgeNumber = async (badgeNumber: string): Promise<PlayerSearchResult> => {
    try {
        if (!badgeNumber.trim()) {
            return {
                userId: '',
                username: '',
                badgeNumber: '',
                found: false
            };
        }

        const playersRef = collection(firestore, 'playerStats');
        const q = query(playersRef, where('badgeNumber', '==', badgeNumber.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return {
                userId: '',
                username: '',
                badgeNumber: '',
                found: false
            };
        }

        const playerDoc = querySnapshot.docs[0];
        const playerData = playerDoc.data() as PlayerStats;

        // Get username from users collection
        const userDoc = await getDoc(doc(firestore, 'users', playerDoc.id));
        const userData = userDoc.data();

        return {
            userId: playerDoc.id,
            username: userData?.username || 'Tundmatu kasutaja',
            badgeNumber: playerData.badgeNumber || '',
            found: true
        };
    } catch (error) {
        console.error('Error searching player by badge number:', error);
        return {
            userId: '',
            username: '',
            badgeNumber: '',
            found: false
        };
    }
};

/**
 * Process a bank transaction between two players
 */
export const processTransaction = async (
    fromUserId: string,
    targetBadgeNumber: string,
    amount: number,
    description: string
): Promise<{ success: boolean; message: string }> => {
    try {
        // Validate amount
        if (amount <= 0) {
            return {
                success: false,
                message: 'Summa peab olema suurem kui 0'
            };
        }

        // Validate description
        if (!description.trim()) {
            return {
                success: false,
                message: 'Kirjeldus on kohustuslik'
            };
        }

        // Find target player
        const targetPlayer = await searchPlayerByBadgeNumber(targetBadgeNumber);
        if (!targetPlayer.found) {
            return {
                success: false,
                message: 'Märginumbriga mängijat ei leitud'
            };
        }

        // Can't send money to yourself
        if (targetPlayer.userId === fromUserId) {
            return {
                success: false,
                message: 'Sa ei saa endale raha saata'
            };
        }

        // Use Firestore transaction to ensure atomicity
        const result = await runTransaction(firestore, async (transaction) => {
            // Get sender data
            const senderRef = doc(firestore, 'playerStats', fromUserId);
            const senderDoc = await transaction.get(senderRef);

            if (!senderDoc.exists()) {
                throw new Error('Saatja andmed ei ole saadaval');
            }

            const senderData = senderDoc.data() as PlayerStats;
            const senderUserDoc = await transaction.get(doc(firestore, 'users', fromUserId));
            const senderUsername = senderUserDoc.data()?.username || 'Tundmatu kasutaja';

            // Check if sender has enough money
            if (senderData.money < amount) {
                throw new Error('Ebapiisav saldo');
            }

            // Get receiver data
            const receiverRef = doc(firestore, 'playerStats', targetPlayer.userId);
            const receiverDoc = await transaction.get(receiverRef);

            if (!receiverDoc.exists()) {
                throw new Error('Saaja andmed ei ole saadaval');
            }

            const receiverData = receiverDoc.data() as PlayerStats;

            // Update sender money
            transaction.update(senderRef, {
                money: senderData.money - amount
            });

            // Update receiver money
            transaction.update(receiverRef, {
                money: receiverData.money + amount
            });

            // Create transaction record
            const transactionData: Omit<BankTransaction, 'id'> = {
                fromUserId: fromUserId,
                fromBadgeNumber: senderData.badgeNumber || '',
                fromPlayerName: senderUsername,
                toUserId: targetPlayer.userId,
                toBadgeNumber: targetPlayer.badgeNumber,
                toPlayerName: targetPlayer.username,
                amount: amount,
                description: description.trim(),
                timestamp: Timestamp.now()
            };

            const transactionsRef = collection(firestore, 'bankTransactions');
            const newTransactionRef = doc(transactionsRef);
            transaction.set(newTransactionRef, transactionData);

            // Add this console.log to see if transaction is being created
            console.log('Creating transaction:', transactionData);

            return {
                success: true,
                message: `${amount}€ edukalt saadetud mängijale ${targetPlayer.username}`
            };
        });

        return result;

    } catch (error: any) {
        console.error('Error processing transaction:', error);
        return {
            success: false,
            message: error.message || 'Viga tehingu töötlemisel'
        };
    }
};

/**
 * Get transaction history for a player
 */
export const getPlayerTransactions = async (userId: string): Promise<BankTransaction[]> => {
    try {
        const transactionsRef = collection(firestore, 'bankTransactions');

        // Get transactions where user is sender
        const sentQuery = query(
            transactionsRef,
            where('fromUserId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        // Get transactions where user is receiver
        const receivedQuery = query(
            transactionsRef,
            where('toUserId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const [sentSnapshot, receivedSnapshot] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        const sentTransactions = sentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BankTransaction));

        const receivedTransactions = receivedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BankTransaction));

        // Combine and sort by timestamp
        const allTransactions = [...sentTransactions, ...receivedTransactions];
        allTransactions.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        return allTransactions;

    } catch (error) {
        console.error('Error getting player transactions:', error);
        return [];
    }
};