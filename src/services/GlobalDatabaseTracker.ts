// src/services/GlobalDatabaseTracker.ts
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

interface PageMetric {
    page: string;
    operation: 'read' | 'write';
    collection: string;
    timestamp: Timestamp;
    userId: string;
    sessionId: string;
}

interface CollectionStats {
    reads: number;
    writes: number;
}

interface BatchedMetric {
    page: string;
    totalReads: number;
    totalWrites: number;
    collections: Record<string, CollectionStats>;
    timeWindow: {
        start: Timestamp;
        end: Timestamp;
    };
    userCount: number;
    sessionId: string;
}

class GlobalDatabaseTracker {
    private isEnabled = false;
    private currentPage = 'unknown';
    private sessionId: string;
    private userId: string | null = null;
    private localMetrics: PageMetric[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private lastRequests: Record<string, number> = {};

    // Täiustatud jälgitavate lehtede süsteem
    private readonly TRACKED_PAGES = new Set([
        'DashboardPage',
        'PatrolPage',
        'CoursesPage',
        'TrainingPage',
        'ProfilePage',
        'ShopPage',
        'CarMarketplacePage',
        'CarMarketplace_new',
        'CarMarketplace_used',
        'DepartmentPage',
        'Department_Overview',
        'Department_MyDept',
        'Department_Transfer',
        'Department_Leaderboard',
        'BankPage',
        'FightClubPage',
        'CasinoPage',
        'RealEstatePage',
        'VIPPage',
        'DragRacePage',
        'TestsPage',
        'SettingsPage'
    ]);

    // Statistika jälgimine
    private stats = {
        totalTrackedRequests: 0,
        requestsByPage: new Map<string, number>(),
        lastFlushTime: Date.now()
    };

    constructor() {
        this.sessionId = this.generateSessionId();
        console.log('🔧 GlobalDatabaseTracker initialized');
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    enableTracking(userId: string) {
        // Väldi topelt aktiveerimist
        if (this.isEnabled && this.userId === userId) {
            console.log('⏭️ Tracking already enabled for this user');
            return;
        }

        this.isEnabled = true;
        this.userId = userId;

        // Alusta metriku kogumist iga 5 minuti järel
        this.startPeriodicFlush();

        console.log(`🔍 Database tracking ENABLED for user: ${userId.substring(0, 8)}...`);
    }

    disableTracking() {
        if (!this.isEnabled) return;

        this.isEnabled = false;
        this.userId = null;

        // Lõpeta perioodiline salvestamine
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        // Salvesta viimased kogutud andmed
        this.flushMetricsToDatabase();

        console.log('🔍 Database tracking DISABLED');
    }

    setCurrentPage(pageName: string) {
        // Kontrolli, kas lehte peaks jälgima
        if (!this.shouldTrackPage(pageName)) {
            console.log(`⏭️ Page "${pageName}" is not in tracked pages list`);
            return;
        }

        // Kui lehe nimi muutus, salvesta eelmise lehe andmed
        if (this.currentPage !== pageName && this.localMetrics.length > 0) {
            console.log(`📄 Page changed from ${this.currentPage} to ${pageName}, flushing metrics...`);
            this.flushMetricsToDatabase();
        }

        this.currentPage = pageName;
        console.log(`📊 Now tracking: ${pageName}`);
    }

    private shouldTrackPage(pageName: string): boolean {
        return this.TRACKED_PAGES.has(pageName) || pageName === 'unknown';
    }

    trackRequest(operation: 'read' | 'write', collectionName: string) {
        if (!this.isEnabled || !this.userId) return;

        // Väldi duplikaate
        const now = Date.now();
        const requestKey = `${this.currentPage}_${operation}_${collectionName}`;

        // Kui sama päring tehti vähem kui 100ms tagasi, ignoreeri
        if (this.lastRequests[requestKey] && (now - this.lastRequests[requestKey]) < 100) {
            return; // Väldi duplikaati
        }

        const metric: PageMetric = {
            page: this.currentPage,
            operation,
            collection: collectionName,
            timestamp: Timestamp.now(),
            userId: this.userId,
            sessionId: this.sessionId
        };

        this.localMetrics.push(metric);
        this.lastRequests[requestKey] = now;

        // Uuenda statistikat
        this.stats.totalTrackedRequests++;
        const pageCount = this.stats.requestsByPage.get(this.currentPage) || 0;
        this.stats.requestsByPage.set(this.currentPage, pageCount + 1);

        // Kui kogunud liiga palju andmeid, salvesta kohe
        if (this.localMetrics.length >= 50) {
            console.log('📦 Metric buffer full, flushing to database...');
            this.flushMetricsToDatabase();
        }
    }

    private startPeriodicFlush() {
        // Puhasta vana interval kui eksisteerib
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }

        // Salvesta metriku iga 5 minuti järel
        this.flushInterval = setInterval(() => {
            if (this.localMetrics.length > 0) {
                console.log(`⏰ Periodic flush: ${this.localMetrics.length} metrics`);
                this.flushMetricsToDatabase();
            }
        }, 5 * 60 * 1000); // 5 minutit
    }

    private async flushMetricsToDatabase() {
        if (this.localMetrics.length === 0) return;

        const metricsCount = this.localMetrics.length;

        try {
            // Grupeeri metriku lehe kaupa
            const pageGroups = this.groupMetricsByPage();

            // Salvesta grupeeritud andmed
            for (const batchedMetric of pageGroups) {
                await addDoc(collection(firestore, 'pageMetrics'), batchedMetric);
            }

            console.log(`✅ Saved ${metricsCount} metrics to database (${pageGroups.length} documents)`);

            // Uuenda viimase salvestuse aeg
            this.stats.lastFlushTime = Date.now();

            // Puhasta lokaalne cache
            this.localMetrics = [];
            this.lastRequests = {};

        } catch (error) {
            console.error('❌ Error saving metrics:', error);
        }
    }

    private groupMetricsByPage(): BatchedMetric[] {
        const groups: Record<string, PageMetric[]> = {};

        // Grupeeri metriku lehe kaupa
        this.localMetrics.forEach(metric => {
            if (!groups[metric.page]) {
                groups[metric.page] = [];
            }
            groups[metric.page].push(metric);
        });

        // Konverteeri grupeeritud andmeteks
        return Object.entries(groups).map(([page, metrics]) => {
            const collections: Record<string, CollectionStats> = {};
            let totalReads = 0;
            let totalWrites = 0;
            const uniqueUsers = new Set<string>();

            metrics.forEach(metric => {
                // Loe kokku operatsioonid
                if (metric.operation === 'read') totalReads++;
                if (metric.operation === 'write') totalWrites++;

                // Loe kokku kollektsioonide kaupa
                if (!collections[metric.collection]) {
                    collections[metric.collection] = { reads: 0, writes: 0 };
                }

                if (metric.operation === 'read') {
                    collections[metric.collection].reads++;
                } else if (metric.operation === 'write') {
                    collections[metric.collection].writes++;
                }

                // Lisa unikaalne kasutaja
                uniqueUsers.add(metric.userId);
            });

            const timestamps = metrics.map(m => m.timestamp);
            const sortedTimestamps = timestamps.sort((a, b) => a.seconds - b.seconds);

            return {
                page,
                totalReads,
                totalWrites,
                collections,
                timeWindow: {
                    start: sortedTimestamps[0],
                    end: sortedTimestamps[sortedTimestamps.length - 1]
                },
                userCount: uniqueUsers.size,
                sessionId: this.sessionId
            };
        });
    }

    // Avalikud meetodid statistika jaoks
    getSessionStats() {
        return {
            isEnabled: this.isEnabled,
            currentPage: this.currentPage,
            sessionId: this.sessionId,
            metricsInBuffer: this.localMetrics.length,
            totalTrackedRequests: this.stats.totalTrackedRequests,
            requestsByPage: Array.from(this.stats.requestsByPage.entries()),
            lastFlushTime: new Date(this.stats.lastFlushTime).toLocaleTimeString('et-EE')
        };
    }

    // Manuaalne flush (debugging jaoks)
    forceFlush() {
        if (this.localMetrics.length > 0) {
            console.log('🔄 Manual flush triggered');
            this.flushMetricsToDatabase();
        } else {
            console.log('ℹ️ No metrics to flush');
        }
    }

    // Lisa uus lehekülg jälgimisse
    addTrackedPage(pageName: string) {
        this.TRACKED_PAGES.add(pageName);
        console.log(`➕ Added "${pageName}" to tracked pages`);
    }

    // Eemalda lehekülg jälgimisest
    removeTrackedPage(pageName: string) {
        this.TRACKED_PAGES.delete(pageName);
        console.log(`➖ Removed "${pageName}" from tracked pages`);
    }

    // Näita kõik jälgitavad lehed
    getTrackedPages(): string[] {
        return Array.from(this.TRACKED_PAGES);
    }
}

export const globalDatabaseTracker = new GlobalDatabaseTracker();