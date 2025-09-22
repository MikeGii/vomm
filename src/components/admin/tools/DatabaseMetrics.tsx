// src/components/admin/tools/DatabaseMetrics.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';

interface PageMetricData {
    page: string;
    totalReads: number;
    totalWrites: number;
    collections: Record<string, { reads: number; writes: number }>;
    timeWindow: {
        start: Timestamp;
        end: Timestamp;
    };
    userCount: number;
    sessionId: string;
}

interface AggregatedStats {
    page: string;
    totalReads: number;
    totalWrites: number;
    totalRequests: number;
    uniqueUsers: number;
    mostUsedCollections: Array<{
        name: string;
        reads: number;
        writes: number;
        total: number;
    }>;
    averageRequestsPerHour: number;
    peakHour?: string;
}

export const DatabaseMetrics: React.FC = () => {
    // Eemaldasime 'metrics' state kuna seda ei kasutata
    const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [documentLimit, setDocumentLimit] = useState<number>(10000);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
    // Eemaldasime 'totalDocuments' state kuna seda ei kasutata
    const [actualDocumentsLoaded, setActualDocumentsLoaded] = useState(0);

    // Optimeeritud andmete töötlemine
    const processMetrics = useCallback((rawMetrics: PageMetricData[], hoursInRange: number): AggregatedStats[] => {
        const pageStats = new Map<string, {
            totalReads: number;
            totalWrites: number;
            users: Set<string>;
            collections: Map<string, { reads: number; writes: number }>;
            hourlyActivity: Map<number, number>;
        }>();

        // Protsessi kõik metriku kirjed
        rawMetrics.forEach(metric => {
            if (!pageStats.has(metric.page)) {
                pageStats.set(metric.page, {
                    totalReads: 0,
                    totalWrites: 0,
                    users: new Set(),
                    collections: new Map(),
                    hourlyActivity: new Map()
                });
            }

            const pageData = pageStats.get(metric.page)!;

            // Lisa lugemised ja kirjutamised
            pageData.totalReads += metric.totalReads;
            pageData.totalWrites += metric.totalWrites;

            // Lisa unikaalsed kasutajad
            if (metric.sessionId) {
                pageData.users.add(metric.sessionId);
            }

            // Lisa kollektsioonide statistika
            Object.entries(metric.collections).forEach(([collName, collData]) => {
                if (!pageData.collections.has(collName)) {
                    pageData.collections.set(collName, { reads: 0, writes: 0 });
                }
                const existingColl = pageData.collections.get(collName)!;
                existingColl.reads += collData.reads;
                existingColl.writes += collData.writes;
            });

            // Jälgi tunni põhist aktiivsust
            const hour = new Date(metric.timeWindow.end.toMillis()).getHours();
            const currentActivity = pageData.hourlyActivity.get(hour) || 0;
            pageData.hourlyActivity.set(hour, currentActivity + metric.totalReads + metric.totalWrites);
        });

        // Konverteeri agregeeritud statistikaks
        const aggregated: AggregatedStats[] = Array.from(pageStats.entries()).map(([page, data]) => {
            // Sorteeri kollektsioonid kasutuse järgi
            const mostUsedCollections = Array.from(data.collections.entries())
                .map(([name, stats]) => ({
                    name,
                    reads: stats.reads,
                    writes: stats.writes,
                    total: stats.reads + stats.writes
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10); // Top 10 kollektsiooni

            // Leia tippkoormus tund
            let peakHour = '';
            let maxActivity = 0;
            data.hourlyActivity.forEach((activity, hour) => {
                if (activity > maxActivity) {
                    maxActivity = activity;
                    peakHour = `${hour}:00`;
                }
            });

            const totalRequests = data.totalReads + data.totalWrites;
            const avgRequestsPerHour = Math.round(totalRequests / hoursInRange);

            return {
                page,
                totalReads: data.totalReads,
                totalWrites: data.totalWrites,
                totalRequests,
                uniqueUsers: data.users.size,
                mostUsedCollections,
                averageRequestsPerHour: avgRequestsPerHour,
                peakHour
            };
        }).sort((a, b) => b.totalRequests - a.totalRequests);

        return aggregated;
    }, []); // processMetrics ei sõltu muutujatest

    // loadMetrics wrapped in useCallback to prevent recreation
    const loadMetrics = useCallback(async () => {
        setLoading(true);
        try {
            // Arvuta ajafilter
            const now = Timestamp.now();
            const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
            const startTime = Timestamp.fromMillis(now.toMillis() - (hoursAgo * 60 * 60 * 1000));

            // Lae pageMetrics kollektsioonist andmed koos ajafiltriga
            const metricsRef = collection(firestore, 'pageMetrics');

            // Esimene päring - leia dokumendid ajavahemikus
            const metricsQuery = query(
                metricsRef,
                where('timeWindow.end', '>=', startTime),
                orderBy('timeWindow.end', 'desc'),
                limit(documentLimit) // Nüüd kuni 10000 dokumenti
            );

            console.log(`📊 Laadin kuni ${documentLimit} dokumenti viimase ${hoursAgo} tunni kohta...`);

            const snapshot = await getDocs(metricsQuery);
            const rawMetrics: PageMetricData[] = [];

            snapshot.forEach(doc => {
                const data = doc.data() as PageMetricData;
                rawMetrics.push(data);
            });

            // Salvestame ainult dokumendite arvu, mitte ise dokumente
            setActualDocumentsLoaded(snapshot.size);

            console.log(`✅ Laaditud ${snapshot.size} dokumenti`);

            // Agregeeri andmed lehe kaupa (optimeeritud versioon)
            const aggregated = processMetrics(rawMetrics, hoursAgo);
            setAggregatedStats(aggregated);

        } catch (error) {
            console.error('Viga metriku laadimisel:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange, documentLimit, processMetrics]); // Lisa kõik sõltuvused

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]); // Nüüd loadMetrics on dependencies

    // Memoize problematic pages
    const problematicPages = useMemo(() => {
        return aggregatedStats.filter(stat =>
            stat.totalRequests > 1000 || // Üle 1000 päringu
            stat.averageRequestsPerHour > 100 // Üle 100 päringu tunnis
        );
    }, [aggregatedStats]);

    if (loading) {
        return (
            <div className="database-metrics">
                <div className="tool-header">
                    <h4>📊 Andmebaasipäringute Analüüs</h4>
                    <p>Laadin kuni {documentLimit} dokumenti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="database-metrics">
            <div className="tool-header">
                <h4>📊 Andmebaasipäringute Analüüs</h4>
                <p>Detailne ülevaade andmebaasi kasutusest ja probleemkohtadest</p>
            </div>

            <div className="metrics-controls">
                <div className="control-group">
                    <label>Ajaperiood:</label>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
                        <option value="24h">Viimased 24 tundi</option>
                        <option value="7d">Viimased 7 päeva</option>
                        <option value="30d">Viimased 30 päeva</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Dokumentide limiit:</label>
                    <select value={documentLimit} onChange={(e) => setDocumentLimit(Number(e.target.value))}>
                        <option value="500">500 (kiire)</option>
                        <option value="2000">2000 (keskmine)</option>
                        <option value="5000">5000 (põhjalik)</option>
                        <option value="10000">10000 (väga põhjalik)</option>
                    </select>
                </div>

                <button onClick={loadMetrics} className="admin-btn admin-btn-secondary">
                    🔄 Värskenda andmeid
                </button>
            </div>

            {/* Kokkuvõte kast */}
            <div className="metrics-summary">
                <div className="summary-card">
                    <h5>📈 Üldine kokkuvõte</h5>
                    <div className="summary-stats">
                        <div className="stat">
                            <span className="stat-label">Analüüsitud dokumente:</span>
                            <span className="stat-value">{actualDocumentsLoaded}/{documentLimit}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Jälgitud lehekülgi:</span>
                            <span className="stat-value">{aggregatedStats.length}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Kokku päringuid:</span>
                            <span className="stat-value">
                                {aggregatedStats.reduce((sum, stat) => sum + stat.totalRequests, 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Probleemkohti tuvastatud:</span>
                            <span className="stat-value" style={{ color: problematicPages.length > 0 ? '#ff5722' : '#4CAF50' }}>
                                {problematicPages.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Probleemkohtade hoiatus */}
            {problematicPages.length > 0 && (
                <div className="problem-alert">
                    <h5>⚠️ Tuvastatud probleemkohad</h5>
                    <p>Järgmised leheküljed teevad liiga palju andmebaasipäringuid:</p>
                    <ul>
                        {problematicPages.slice(0, 5).map(page => (
                            <li key={page.page}>
                                <strong>{page.page}</strong>: {page.totalRequests.toLocaleString()} päringut
                                ({page.averageRequestsPerHour}/tunnis)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Detailne tabel */}
            <div className="page-metrics-list">
                <h5>📋 Lehekülgede detailstatistika</h5>
                {aggregatedStats.length === 0 ? (
                    <div className="no-data">
                        <p>Andmebaasipäringute andmed puuduvad valitud perioodil.</p>
                        <p>Kontrollige, kas GlobalDatabaseTracker on aktiivne.</p>
                    </div>
                ) : (
                    <div className="metrics-table">
                        {aggregatedStats.slice(0, 20).map((stat, index) => (
                            <div key={stat.page} className={`metric-row ${stat.totalRequests > 1000 ? 'high-usage' : ''}`}>
                                <div className="metric-header">
                                    <h6>
                                        #{index + 1} {stat.page}
                                        {stat.totalRequests > 1000 && <span className="warning-badge">⚠️ Kõrge kasutus</span>}
                                    </h6>
                                    <div className="metric-totals">
                                        <span className="reads">📖 {stat.totalReads.toLocaleString()} lugemist</span>
                                        <span className="writes">✏️ {stat.totalWrites.toLocaleString()} kirjutamist</span>
                                        <span className="total">📊 {stat.totalRequests.toLocaleString()} kokku</span>
                                    </div>
                                </div>

                                <div className="metric-details">
                                    <div className="detail-row">
                                        <span>⏱️ Keskmine: {stat.averageRequestsPerHour} päringut/tunnis</span>
                                        {stat.peakHour && <span>📈 Tipptund: {stat.peakHour}</span>}
                                        <span>👥 Unikaalseid kasutajaid: {stat.uniqueUsers}</span>
                                    </div>
                                </div>

                                <div className="collections-breakdown">
                                    <strong>🗂️ Kõige kasutatumad kollektsioonid:</strong>
                                    <div className="collections-list">
                                        {stat.mostUsedCollections.slice(0, 5).map(coll => (
                                            <div key={coll.name} className="collection-stat">
                                                <span className="collection-name">{coll.name}</span>
                                                <span className="collection-numbers">
                                                    {coll.reads.toLocaleString()}R + {coll.writes.toLocaleString()}W = {coll.total.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {aggregatedStats.length > 20 && (
                            <div className="more-results">
                                Kuvatakse esimesed 20 lehekülge {aggregatedStats.length}-st
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};