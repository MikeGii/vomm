// src/services/CacheManager.ts
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: string;
}

interface CacheStats {
    totalEntries: number;
    totalSize: string;
    entries: Array<{ key: string; size: number; age: number }>;
    maxSize: string;
}

class CacheManager {
    private static instance: CacheManager;
    private readonly CACHE_VERSION = '1.1.0';
    private readonly CACHE_PREFIX = 'game_cache_';

    // Cache durations in milliseconds
    private readonly DURATIONS = {
        PLAYER_STATS: 60000,
        LEADERBOARD: 300000,
        SHOP_STOCK: 120000,
        DEPARTMENT_DATA: 600000,
        STATIC_DATA: 86400000,
    };

    private constructor() {
        // Clean old cache entries on initialization
        this.cleanExpiredCache();
        console.log('CacheManager initialized');
    }

    /**
     * Get singleton instance
     */
    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * Get data from cache
     */
    get<T>(key: string, customDuration?: number): T | null {
        try {
            const fullKey = `${this.CACHE_PREFIX}${key}`;
            const stored = localStorage.getItem(fullKey);

            if (!stored) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(stored);

            // Check if cache version matches
            if (entry.version !== this.CACHE_VERSION) {
                this.remove(key);
                return null;
            }

            // Check if cache has expired
            const age = Date.now() - entry.timestamp;
            const maxAge = customDuration || this.getDurationForKey(key);

            if (age > maxAge) {
                this.remove(key);
                return null;
            }

            console.log(`Cache hit: ${key} (age: ${Math.round(age/1000)}s)`);
            return entry.data;

        } catch (error) {
            console.error(`Cache read error for ${key}:`, error);
            this.remove(key);
            return null;
        }
    }

    /**
     * Save data to cache
     */
    set<T>(key: string, data: T, customDuration?: number): void {        try {
            const fullKey = `${this.CACHE_PREFIX}${key}`;
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                version: this.CACHE_VERSION
            };

            const serialized = JSON.stringify(entry);

            // Check size before saving (localStorage has ~5-10MB limit)
            if (serialized.length > 1000000) { // 1MB single item limit
                console.warn(`Cache item too large: ${key} (${serialized.length} bytes)`);
                return;
            }

            localStorage.setItem(fullKey, serialized);

        } catch (error) {
            console.error(`Cache write error for ${key}:`, error);

            // If localStorage is full, try to clear expired entries
            if (error instanceof DOMException && error.code === 22) {
                console.log('localStorage full, cleaning up...');
                this.cleanExpiredCache();

                // Try one more time
                try {
                    const fullKey = `${this.CACHE_PREFIX}${key}`;
                    localStorage.setItem(fullKey, JSON.stringify({
                        data,
                        timestamp: Date.now(),
                        version: this.CACHE_VERSION
                    }));
                } catch (retryError) {
                    console.error('Still failed after cleanup:', retryError);
                }
            }
        }
    }

    /**
     * Remove specific cache entry
     */
    remove(key: string): void {
        const fullKey = `${this.CACHE_PREFIX}${key}`;
        localStorage.removeItem(fullKey);
        console.log(`Cache removed: ${key}`);
    }

    /**
     * Clear all game cache
     */
    clearAll(): void {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`Cache cleared: ${cleared} entries removed`);
    }

    /**
     * Clean expired cache entries
     */
    private cleanExpiredCache(): void {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        let cleaned = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                try {
                    const stored = localStorage.getItem(key);
                    if (!stored) return;

                    const entry = JSON.parse(stored);
                    const simpleKey = key.replace(this.CACHE_PREFIX, '');
                    const maxAge = this.getDurationForKey(simpleKey);
                    const age = now - entry.timestamp;

                    // Remove if expired or wrong version
                    if (age > maxAge || entry.version !== this.CACHE_VERSION) {
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                } catch {
                    // Invalid entry, remove it
                    localStorage.removeItem(key);
                    cleaned++;
                }
            }
        });

        if (cleaned > 0) {
            console.log(`Cache cleanup: ${cleaned} expired entries removed`);
        }
    }

    /**
     * Get appropriate duration for cache key
     */
    private getDurationForKey(key: string): number {
        // Match key patterns to determine cache duration
        if (key.includes('leaderboard')) return this.DURATIONS.LEADERBOARD;
        if (key.includes('shop') || key.includes('stock')) return this.DURATIONS.SHOP_STOCK;
        if (key.includes('department')) return this.DURATIONS.DEPARTMENT_DATA;
        if (key.includes('player') || key.includes('stats')) return this.DURATIONS.PLAYER_STATS;
        if (key.includes('static') || key.includes('config')) return this.DURATIONS.STATIC_DATA;

        // Default duration
        return this.DURATIONS.PLAYER_STATS;
    }

    /**
     * Get cache statistics (useful for debugging)
     */
    getStats(): CacheStats {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const entries: Array<{ key: string; size: number; age: number }> = [];
        let totalSize = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                const value = localStorage.getItem(key);
                if (value) {
                    const size = value.length;
                    totalSize += size;

                    try {
                        const entry = JSON.parse(value);
                        const age = Math.round((now - entry.timestamp) / 1000);
                        entries.push({
                            key: key.replace(this.CACHE_PREFIX, ''),
                            size,
                            age
                        });
                    } catch {
                        entries.push({
                            key: key.replace(this.CACHE_PREFIX, ''),
                            size,
                            age: -1
                        });
                    }
                }
            }
        });

        return {
            totalEntries: entries.length,
            totalSize: totalSize > 1024 * 1024
                ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
                : `${(totalSize / 1024).toFixed(2)} KB`,
            entries: entries.sort((a, b) => b.size - a.size),
            maxSize: '5-10 MB' // localStorage typical limit
        };
    }

    /**
     * Check if cache exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Clear cache entries matching a pattern
     * @param pattern - Part of the key to match
     * @returns Number of entries cleared
     */
    clearByPattern(pattern: string): number {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            // Check if it's our cache AND contains the pattern
            if (key.startsWith(this.CACHE_PREFIX) && key.includes(pattern)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`Cleared ${cleared} cache entries matching pattern: "${pattern}"`);
        return cleared;
    }

    /**
     * Clear specific cache types
     * Useful for targeted cache invalidation
     */
    clearCacheType(type: 'leaderboard' | 'shop' | 'department' | 'player' | 'all'): void {
        if (type === 'all') {
            this.clearAll();
        } else {
            this.clearByPattern(type);
        }
    }

    /**
     * Force refresh specific data by clearing its cache
     * @param dataType - Type of data to force refresh
     */
    forceRefresh(dataType: string): void {
        this.clearByPattern(dataType);
        console.log(`Force refresh: ${dataType} cache cleared`);
    }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export class for testing purposes
export { CacheManager };
