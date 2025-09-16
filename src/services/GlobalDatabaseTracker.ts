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

    constructor() {
        this.sessionId = this.generateSessionId();
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    enableTracking(userId: string) {
        this.isEnabled = true;
        this.userId = userId;

        // Alusta metriku kogumist iga 5 minuti järel
        this.startPeriodicFlush();

        console.log('🔍 Globaalne andmebaasijälgimine AKTIIVNE');
    }

    disableTracking() {
        this.isEnabled = false;
        this.userId = null;

        // Lõpeta perioodiline salvestamine
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        // Salvesta viimased kogutud andmed
        this.flushMetricsToDatabase();

        console.log('🔍 Globaalne andmebaasijälgimine PEATATUD');
    }

    setCurrentPage(pageName: string) {
        // Kui lehe nimi muutus, salvesta eelmise lehe andmed
        if (this.currentPage !== pageName && this.localMetrics.length > 0) {
            this.flushMetricsToDatabase();
        }

        this.currentPage = pageName;
    }

    trackRequest(operation: 'read' | 'write', collectionName: string) {
        if (!this.isEnabled || !this.userId) return;

        // LISA SEE KONTROLL - väldi duplikaate
        const now = Date.now();
        const requestKey = `${this.currentPage}_${operation}_${collectionName}`;

        // Kui sama päring tehti vähem kui 100ms tagasi, ignoreeri
        if (this.lastRequests && this.lastRequests[requestKey]) {
            if (now - this.lastRequests[requestKey] < 100) {
                return; // Väldi duplikaati
            }
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

        // Salvesta viimase päringu aeg
        if (!this.lastRequests) this.lastRequests = {};
        this.lastRequests[requestKey] = now;

        // Kui kogunud liiga palju andmeid, salvesta kohe
        if (this.localMetrics.length >= 50) {
            this.flushMetricsToDatabase();
        }
    }

    private startPeriodicFlush() {
        // Salvesta metriku iga 5 minuti järel
        this.flushInterval = setInterval(() => {
            this.flushMetricsToDatabase();
        }, 5 * 60 * 1000); // 5 minutit
    }

    private async flushMetricsToDatabase() {
        if (this.localMetrics.length === 0) return;

        try {
            // Grupeeri metriku lehe kaupa
            const pageGroups = this.groupMetricsByPage();

            // Salvesta grupeeritud andmed
            for (const batchedMetric of pageGroups) {
                await addDoc(collection(firestore, 'pageMetrics'), batchedMetric);
            }

            console.log(`📊 Salvestati ${this.localMetrics.length} metriku andmebaasi`);

            // Puhasta lokaalne cache
            this.localMetrics = [];

        } catch (error) {
            console.error('Viga metriku salvestamisel:', error);
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

                // Loe kokku kollektsioonide kaupa - PARANDATUD!
                if (!collections[metric.collection]) {
                    collections[metric.collection] = { reads: 0, writes: 0 };
                }

                // TypeScript'i jaoks turvalisem viis:
                if (metric.operation === 'read') {
                    collections[metric.collection].reads++;
                } else if (metric.operation === 'write') {
                    collections[metric.collection].writes++;
                }

                // Loe kasutajaid
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
}

export const globalDatabaseTracker = new GlobalDatabaseTracker();