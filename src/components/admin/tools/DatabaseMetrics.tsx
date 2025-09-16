// src/components/admin/tools/DatabaseMetrics.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
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
}

export const DatabaseMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState<PageMetricData[]>([]);
    const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
    const [totalDocuments, setTotalDocuments] = useState(0);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            // Lae pageMetrics kollektsioonist andmed
            const metricsRef = collection(firestore, 'pageMetrics');
            const metricsQuery = query(
                metricsRef,
                orderBy('timeWindow.end', 'desc'),
                limit(500) // Piira 500 dokumendiga
            );

            const snapshot = await getDocs(metricsQuery);
            const rawMetrics: PageMetricData[] = [];

            snapshot.forEach(doc => {
                const data = doc.data() as PageMetricData;
                rawMetrics.push(data);
            });

            setMetrics(rawMetrics);
            setTotalDocuments(snapshot.size);

            // Agregeeri andmed lehe kaupa
            const pageStats = new Map<string, {
                totalReads: number;
                totalWrites: number;
                users: Set<string>;
                collections: Map<string, { reads: number; writes: number }>;
            }>();

            rawMetrics.forEach(metric => {
                if (!pageStats.has(metric.page)) {
                    pageStats.set(metric.page, {
                        totalReads: 0,
                        totalWrites: 0,
                        users: new Set(),
                        collections: new Map()
                    });
                }

                const pageData = pageStats.get(metric.page)!;
                pageData.totalReads += metric.totalReads;
                pageData.totalWrites += metric.totalWrites;

                // Lisa kollektsioonide andmed
                Object.entries(metric.collections).forEach(([collName, collData]) => {
                    if (!pageData.collections.has(collName)) {
                        pageData.collections.set(collName, { reads: 0, writes: 0 });
                    }
                    const existingColl = pageData.collections.get(collName)!;
                    existingColl.reads += collData.reads;
                    existingColl.writes += collData.writes;
                });
            });

            // Konverteeri aggregeeritud statistikaks
            const aggregated: AggregatedStats[] = Array.from(pageStats.entries()).map(([page, data]) => {
                const mostUsedCollections = Array.from(data.collections.entries())
                    .map(([name, stats]) => ({
                        name,
                        reads: stats.reads,
                        writes: stats.writes,
                        total: stats.reads + stats.writes
                    }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5); // Top 5 kollektsiooni

                return {
                    page,
                    totalReads: data.totalReads,
                    totalWrites: data.totalWrites,
                    totalRequests: data.totalReads + data.totalWrites,
                    uniqueUsers: data.users.size,
                    mostUsedCollections
                };
            }).sort((a, b) => b.totalRequests - a.totalRequests);

            setAggregatedStats(aggregated);

        } catch (error) {
            console.error('Viga metriku laadimisel:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="database-metrics">
                <div className="tool-header">
                    <h4>Andmebaasipäringute Statistika</h4>
                    <p>Laadin andmeid...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="database-metrics">
            <div className="tool-header">
                <h4>Andmebaasipäringute Statistika</h4>
                <p>Vaata, millised lehekülged teevad kõige rohkem päringuid</p>
            </div>

            <div className="metrics-controls">
                <div className="time-selector">
                    <label>Ajaperiood:</label>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
                        <option value="24h">Viimased 24 tundi</option>
                        <option value="7d">Viimased 7 päeva</option>
                        <option value="30d">Viimased 30 päeva</option>
                    </select>
                </div>
                <button onClick={loadMetrics} className="admin-btn admin-btn-secondary">
                    🔄 Värska andmed
                </button>
            </div>

            <div className="metrics-summary">
                <div className="summary-card">
                    <h5>Kokkuvõte</h5>
                    <div className="summary-stats">
                        <div className="stat">
                            <span className="stat-label">Kokku dokumente:</span>
                            <span className="stat-value">{totalDocuments}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Jälgitud lehekülgi:</span>
                            <span className="stat-value">{aggregatedStats.length}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Kokku päringuid:</span>
                            <span className="stat-value">
                                {aggregatedStats.reduce((sum, stat) => sum + stat.totalRequests, 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-metrics-list">
                <h5>Lehekülgede statistika</h5>
                {aggregatedStats.length === 0 ? (
                    <div className="no-data">
                        <p>Andmebaasipäringute andmed puuduvad.</p>
                        <p>Külastage mõnda jälgitavat lehekülge (PatrolPage, DashboardPage) ja proovige uuesti.</p>
                    </div>
                ) : (
                    <div className="metrics-table">
                        {aggregatedStats.map((stat, index) => (
                            <div key={stat.page} className="metric-row">
                                <div className="metric-header">
                                    <h6>#{index + 1} {stat.page}</h6>
                                    <div className="metric-totals">
                                        <span className="reads">📖 {stat.totalReads} reads</span>
                                        <span className="writes">✏️ {stat.totalWrites} writes</span>
                                        <span className="total">📊 {stat.totalRequests} kokku</span>
                                    </div>
                                </div>

                                <div className="collections-breakdown">
                                    <strong>Kõige kasutatumad kollektsioonid:</strong>
                                    <div className="collections-list">
                                        {stat.mostUsedCollections.map(coll => (
                                            <div key={coll.name} className="collection-stat">
                                                <span className="collection-name">{coll.name}</span>
                                                <span className="collection-numbers">
                                                    {coll.reads}r + {coll.writes}w = {coll.total}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};