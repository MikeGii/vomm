// src/services/FightTransactionService.ts
import { doc, runTransaction, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { FightResult } from './FightService';
import {PlayerStats} from "../types";

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
    player1Id: string,  // This is ALWAYS the fight initiator
    player1Username: string,
    player2Id: string,  // This is the opponent (NPC)
    player2Username: string,
    fightResult: FightResult
): Promise<{ success: boolean; message: string }> => {
    try {
        const result = await runTransaction(firestore, async (transaction) => {
            // Get player stats (only player1 is the real player initiating)
            const player1Ref = doc(firestore, 'playerStats', player1Id);
            const player1Doc = await transaction.get(player1Ref);

            if (!player1Doc.exists()) {
                throw new Error('Mängija andmed puuduvad');
            }

            const player1Stats = player1Doc.data() as PlayerStats;

            // HEALTH CHECK - Fight initiator needs at least 5 HP
            if (!player1Stats.health || player1Stats.health.current < 5) {
                throw new Error('Sul pole piisavalt tervist võitlemiseks! Vajalik vähemalt 5 HP.');
            }

            // Calculate new health (ALWAYS reduce by 5 for fight initiator)
            // Now TypeScript knows health exists because we checked above
            const newHealth = Math.max(0, player1Stats.health.current - 5);

            // Prepare updates for fight initiator
            const player1Updates: any = {
                'health.current': newHealth,
                'fightClubStats.totalFights': (player1Stats.fightClubStats?.totalFights || 0) + 1
            };

            // Start recovery timer if health dropped below max
            // Add null check here too
            if (player1Stats.health && player1Stats.health.current >= player1Stats.health.max && newHealth < player1Stats.health.max) {
                player1Updates.lastHealthUpdate = Timestamp.now();
            }

            // Handle money and win/loss stats based on fight result
            if (fightResult.winner === 'player1') {
                // INITIATOR WON - gets money
                player1Updates.money = (player1Stats.money || 0) + fightResult.moneyWon;
                player1Updates['fightClubStats.wins'] = (player1Stats.fightClubStats?.wins || 0) + 1;
                player1Updates['fightClubStats.totalMoneyWon'] = (player1Stats.fightClubStats?.totalMoneyWon || 0) + fightResult.moneyWon;
            } else {
                // INITIATOR LOST - no money change, just record loss
                player1Updates['fightClubStats.losses'] = (player1Stats.fightClubStats?.losses || 0) + 1;
            }

            // Apply updates ONLY to fight initiator
            transaction.update(player1Ref, player1Updates);

            // Note: We do NOT update player2 (opponent) stats at all - they're just NPCs

            return {
                winnerId: fightResult.winner === 'player1' ? player1Id : player2Id,
                loserId: fightResult.winner === 'player1' ? player2Id : player1Id,
                moneyTransferred: fightResult.winner === 'player1' ? fightResult.moneyWon : 0,
                healthCost: 5
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
            message: `Võitlus lõppes. -5 HP.`
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