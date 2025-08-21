// src/services/FightTransactionService.ts - SIMPLIFIED VERSION
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { FightResult } from './FightService';
import { PlayerStats } from "../types";

export const processFightResult = async (
    player1Id: string,
    player2Id: string,
    fightResult: FightResult
): Promise<{ success: boolean; message: string }> => {
    try {
        const result = await runTransaction(firestore, async (transaction) => {
            const player1Ref = doc(firestore, 'playerStats', player1Id);
            const player1Doc = await transaction.get(player1Ref);

            if (!player1Doc.exists()) {
                throw new Error('Mängija andmed puuduvad');
            }

            const player1Stats = player1Doc.data() as PlayerStats;

            if (!player1Stats.health || player1Stats.health.current < 5) {
                throw new Error('Sul pole piisavalt tervist võitlemiseks! Vajalik vähemalt 5 HP.');
            }

            const healthDamage = fightResult.winner === 'player1' ? 5 : 15;
            const newHealth = Math.max(0, player1Stats.health.current - healthDamage);

            const player1Updates: any = {
                'health.current': newHealth,
                'fightClubStats.totalFights': (player1Stats.fightClubStats?.totalFights || 0) + 1
            };

            if (player1Stats.health && player1Stats.health.current >= player1Stats.health.max && newHealth < player1Stats.health.max) {
                player1Updates.lastHealthUpdate = Timestamp.now();
            }

            if (fightResult.winner === 'player1') {
                player1Updates.money = (player1Stats.money || 0) + fightResult.moneyWon;
                player1Updates['fightClubStats.wins'] = (player1Stats.fightClubStats?.wins || 0) + 1;
                player1Updates['fightClubStats.totalMoneyWon'] = (player1Stats.fightClubStats?.totalMoneyWon || 0) + fightResult.moneyWon;
            } else {
                player1Updates['fightClubStats.losses'] = (player1Stats.fightClubStats?.losses || 0) + 1;
            }

            transaction.update(player1Ref, player1Updates);

            return {
                winnerId: fightResult.winner === 'player1' ? player1Id : player2Id,
                loserId: fightResult.winner === 'player1' ? player2Id : player1Id,
                moneyTransferred: fightResult.winner === 'player1' ? fightResult.moneyWon : 0,
                healthCost: healthDamage
            };
        });

        return {
            success: true,
            message: `Võitlus lõppes. Tervise kaotus: ${result.healthCost} HP`
        };

    } catch (error: any) {
        console.error('Fight processing error:', error);
        return {
            success: false,
            message: error.message || 'Viga võitluse läbiviimisel'
        };
    }
};
