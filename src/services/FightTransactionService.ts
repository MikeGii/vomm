// src/services/FightTransactionService.ts
import { doc, runTransaction, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { FightResult } from './FightService';

export interface FightRecord {
    fightId: string;
    player1Id: string;
    player1Username: string;
    player2Id: string;
    player2Username: string;
    winnerId: string;
    loserId: string;
    rounds: number;
    player1Score: number;
    player2Score: number;
    moneyTransferred: number;
    fightTimestamp: Timestamp;
    fightDetails: FightResult;
}

// Process fight result and handle money/stats updates
export const processFightResult = async (
    player1Id: string,
    player1Username: string,
    player2Id: string,
    player2Username: string,
    fightResult: FightResult
): Promise<{ success: boolean; message: string }> => {
    try {
        const result = await runTransaction(firestore, async (transaction) => {
            // Get both players' current stats
            const player1Ref = doc(firestore, 'playerStats', player1Id);
            const player2Ref = doc(firestore, 'playerStats', player2Id);

            const player1Doc = await transaction.get(player1Ref);
            const player2Doc = await transaction.get(player2Ref);

            if (!player1Doc.exists() || !player2Doc.exists()) {
                throw new Error('Mängija andmeid ei leitud');
            }

            const player1Stats = player1Doc.data();
            const player2Stats = player2Doc.data();

            // Determine winner and loser
            const winnerId = fightResult.winner === 'player1' ? player1Id : player2Id;
            const loserId = fightResult.winner === 'player1' ? player2Id : player1Id;
            const winnerStats = fightResult.winner === 'player1' ? player1Stats : player2Stats;
            const loserStats = fightResult.winner === 'player1' ? player2Stats : player1Stats;
            const winnerRef = fightResult.winner === 'player1' ? player1Ref : player2Ref;
            const loserRef = fightResult.winner === 'player1' ? player2Ref : player1Ref;

            // Check if loser has enough money (optional - for betting system)
            const moneyToTransfer = fightResult.moneyWon;

            // Update winner stats
            const winnerUpdates: any = {
                money: (winnerStats.money || 0) + moneyToTransfer,
                'fightClubStats.wins': (winnerStats.fightClubStats?.wins || 0) + 1,
                'fightClubStats.totalFights': (winnerStats.fightClubStats?.totalFights || 0) + 1,
                'fightClubStats.totalMoneyWon': (winnerStats.fightClubStats?.totalMoneyWon || 0) + moneyToTransfer
            };

            // Update loser stats (no money loss for now, just record the fight)
            const loserUpdates: any = {
                'fightClubStats.losses': (loserStats.fightClubStats?.losses || 0) + 1,
                'fightClubStats.totalFights': (loserStats.fightClubStats?.totalFights || 0) + 1
            };

            // Apply updates
            transaction.update(winnerRef, winnerUpdates);
            transaction.update(loserRef, loserUpdates);

            return {
                winnerId,
                loserId,
                moneyTransferred: moneyToTransfer
            };
        });

        // Record the fight in fight history
        await recordFightHistory({
            fightId: `${Date.now()}_${player1Id}_${player2Id}`,
            player1Id,
            player1Username,
            player2Id,
            player2Username,
            winnerId: result.winnerId,
            loserId: result.loserId,
            rounds: fightResult.totalRounds,
            player1Score: fightResult.player1Score,
            player2Score: fightResult.player2Score,
            moneyTransferred: result.moneyTransferred,
            fightTimestamp: Timestamp.now(),
            fightDetails: fightResult
        });

        return {
            success: true,
            message: `Fight completed successfully. Money transferred: ${result.moneyTransferred}€`
        };

    } catch (error: any) {
        console.error('Error processing fight result:', error);
        return {
            success: false,
            message: error.message || 'Viga võitluse tulemuse töötlemisel'
        };
    }
};

// Record fight in history collection
const recordFightHistory = async (fightRecord: FightRecord): Promise<void> => {
    try {
        await addDoc(collection(firestore, 'fightHistory'), fightRecord);
    } catch (error) {
        console.error('Error recording fight history:', error);
        // Don't throw error here - fight result is already processed
    }
};

// Get player's fight history
export const getPlayerFightHistory = async (
    playerId: string,
    limit: number = 10
): Promise<FightRecord[]> => {
    try {
        const { query: queryFunc, where, orderBy, limit: limitFunc, getDocs } = await import('firebase/firestore');

        const fightHistoryRef = collection(firestore, 'fightHistory');

        // Get fights where player was participant
        const q = queryFunc(
            fightHistoryRef,
            where('player1Id', '==', playerId),
            orderBy('fightTimestamp', 'desc'),
            limitFunc(limit)
        );

        const q2 = queryFunc(
            fightHistoryRef,
            where('player2Id', '==', playerId),
            orderBy('fightTimestamp', 'desc'),
            limitFunc(limit)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q),
            getDocs(q2)
        ]);

        const fights: FightRecord[] = [];

        snapshot1.forEach(doc => {
            fights.push({ ...doc.data() } as FightRecord);
        });

        snapshot2.forEach(doc => {
            fights.push({ ...doc.data() } as FightRecord);
        });

        // Sort by timestamp and remove duplicates
        const uniqueFights = fights.reduce((acc, fight) => {
            if (!acc.find(f => f.fightId === fight.fightId)) {
                acc.push(fight);
            }
            return acc;
        }, [] as FightRecord[]);

        uniqueFights.sort((a, b) => b.fightTimestamp.toMillis() - a.fightTimestamp.toMillis());

        return uniqueFights.slice(0, limit);

    } catch (error) {
        console.error('Error getting fight history:', error);
        return [];
    }
};