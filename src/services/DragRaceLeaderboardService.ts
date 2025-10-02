// src/services/DragRaceLeaderboardService.ts
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { LeaderboardData, LeaderboardEntry, DragRaceDistance, RACING_CONSTANTS } from '../types/dragRace';
import { getCurrentServer } from '../utils/serverUtils';

export class DragRaceLeaderboardService {
    private static cache: Map<string, { data: LeaderboardData; timestamp: number }> = new Map();

    /**
     * Get leaderboard for a specific track with caching
     */
    static async getLeaderboard(
        trackId: string,
        distance: DragRaceDistance,
        page: number = 1,
        currentUserId?: string
    ): Promise<LeaderboardData> {
        const currentServer = getCurrentServer();
        const cacheKey = `${trackId}_${page}_${currentServer}`;
        const now = Date.now();

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && (now - cached.timestamp) < (RACING_CONSTANTS.CACHE_DURATION_MINUTES * 60 * 1000)) {
            if (currentUserId) {
                cached.data.entries = cached.data.entries.map(entry => ({
                    ...entry,
                    isCurrentPlayer: entry.userId === currentUserId
                }));
            }
            return cached.data;
        }

        const leaderboardData = await this.fetchLeaderboardFromDB(trackId, distance, page, currentUserId);

        this.cache.set(cacheKey, {
            data: leaderboardData,
            timestamp: now
        });

        return leaderboardData;
    }

    private static async fetchLeaderboardFromDB(
        trackId: string,
        distance: DragRaceDistance,
        page: number,
        currentUserId?: string
    ): Promise<LeaderboardData> {
        const currentServer = getCurrentServer();
        const pageSize = RACING_CONSTANTS.LEADERBOARD_PAGE_SIZE;
        const offset = (page - 1) * pageSize;

        const timesRef = collection(firestore, 'dragRaceTimes');
        const leaderboardQuery = query(
            timesRef,
            where('trackId', '==', trackId),
            orderBy('time', 'asc'),
            limit(pageSize + offset)
        );

        const querySnapshot = await getDocs(leaderboardQuery);
        const allResults = querySnapshot.docs
            .filter(doc => {
                const docId = doc.id;
                if (currentServer === 'beta' && docId.includes('_server')) return false;
                if (currentServer !== 'beta' && !docId.endsWith(`_${currentServer}`)) return false;
                return true;
            })
            .map(doc => doc.data());

        const pageResults = allResults.slice(offset, offset + pageSize);

        const entries: LeaderboardEntry[] = pageResults.map((data, index) => ({
            rank: offset + index + 1,
            userId: data.userId,
            playerName: data.playerName,
            time: data.time,
            carBrand: data.carBrand,
            carModel: data.carModel,
            completedAt: data.completedAt.toDate(),
            isCurrentPlayer: currentUserId ? data.userId === currentUserId : false
        }));

        const totalPlayers = allResults.length;
        const totalPages = Math.ceil(totalPlayers / pageSize);

        let playerRank: number | undefined;
        if (currentUserId && !entries.some(e => e.userId === currentUserId)) {
            playerRank = await this.getPlayerRank(trackId, currentUserId);
        }

        return {
            trackId,
            distance,
            entries,
            totalPlayers,
            currentPage: page,
            totalPages,
            playerRank,
            lastUpdated: new Date()
        };
    }

    private static async getPlayerRank(trackId: string, userId: string): Promise<number | undefined> {
        const currentServer = getCurrentServer();
        const docId = currentServer === 'beta'
            ? `${userId}_${trackId}`
            : `${userId}_${trackId}_${currentServer}`;
        const playerTimeRef = doc(firestore, 'dragRaceTimes', docId);
        const playerTimeDoc = await getDoc(playerTimeRef);

        if (!playerTimeDoc.exists()) {
            return undefined;
        }

        const playerTime = playerTimeDoc.data().time;

        const timesRef = collection(firestore, 'dragRaceTimes');
        const betterTimesQuery = query(
            timesRef,
            where('trackId', '==', trackId),
            where('time', '<', playerTime)
        );

        const betterTimesSnapshot = await getDocs(betterTimesQuery);
        return betterTimesSnapshot.docs.length + 1;
    }

    static clearTrackCache(trackId: string): void {
        const currentServer = getCurrentServer();
        const keysToDelete: string[] = [];
        this.cache.forEach((_, key) => {
            if (key.startsWith(`${trackId}_`) && key.includes(currentServer)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.cache.delete(key));
    }
}