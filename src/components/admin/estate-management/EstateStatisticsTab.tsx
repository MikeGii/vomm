// src/components/admin/estate-management/EstateStatisticsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getComprehensiveEstateStatistics, EstateStatistics } from '../../../services/EstateStatisticsService';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/admin/estate-management/EstateStatisticsTab.css';

export const EstateStatisticsTab: React.FC = () => {
    const { showToast } = useToast();
    const [statistics, setStatistics] = useState<EstateStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadStatistics = useCallback(async () => {
        setIsLoading(true);
        try {
            const stats = await getComprehensiveEstateStatistics();
            setStatistics(stats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading statistics:', error);
            showToast('Viga statistikate laadimisel', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadStatistics();
    }, [loadStatistics]);

    if (isLoading) {
        return <div className="estate-stats__loading">Laen statistikaid...</div>;
    }

    if (!statistics) {
        return <div className="estate-stats__error">Statistikaid ei õnnestunud laadida</div>;
    }

    const { overview, playerData, popularEstates, estateFeatures } = statistics;

    return (
        <div className="estate-stats">
            <div className="estate-stats__header">
                <div className="estate-stats__header-title">
                    <h3>Kinnisvarade Statistika</h3>
                    <p>Ülevaade kinnisvara süsteemist ja mängijate käitumisest</p>
                </div>
                <div className="estate-stats__header-actions">
                    <button
                        className="estate-stats__btn estate-stats__btn--refresh"
                        onClick={loadStatistics}
                        disabled={isLoading}
                    >
                        🔄 Värskenda
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <div className="estate-stats__last-updated">
                    Viimati uuendatud: {lastUpdated.toLocaleString('et-EE')}
                </div>
            )}

            {/* Overview Cards */}
            <div className="estate-stats__overview">
                <div className="estate-stats__card estate-stats__card--overview">
                    <div className="estate-stats__card-header">
                        <h4>Ülevaade</h4>
                        <span className="estate-stats__card-icon">📊</span>
                    </div>
                    <div className="estate-stats__metrics">
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value">{overview.totalEstates}</span>
                            <span className="estate-stats__metric-label">Kokku kinnisvarasid</span>
                        </div>
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value estate-stats__metric-value--success">
                                {overview.activeEstates}
                            </span>
                            <span className="estate-stats__metric-label">Aktiivseid</span>
                        </div>
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value estate-stats__metric-value--warning">
                                {overview.inactiveEstates}
                            </span>
                            <span className="estate-stats__metric-label">Mitteaktiivseid</span>
                        </div>
                    </div>
                </div>

                <div className="estate-stats__card estate-stats__card--players">
                    <div className="estate-stats__card-header">
                        <h4>Mängijad</h4>
                        <span className="estate-stats__card-icon">👥</span>
                    </div>
                    <div className="estate-stats__metrics">
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value estate-stats__metric-value--success">
                                {playerData.totalPlayersWithEstates}
                            </span>
                            <span className="estate-stats__metric-label">Kinnisvaraga</span>
                        </div>
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value estate-stats__metric-value--neutral">
                                {playerData.totalPlayersWithoutEstates}
                            </span>
                            <span className="estate-stats__metric-label">Ilma kinnisvarata</span>
                        </div>
                        <div className="estate-stats__metric">
                            <span className="estate-stats__metric-value">
                                {Math.round((playerData.totalPlayersWithEstates / (playerData.totalPlayersWithEstates + playerData.totalPlayersWithoutEstates)) * 100)}%
                            </span>
                            <span className="estate-stats__metric-label">Omandamise määr</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Estates */}
            <div className="estate-stats__section">
                <h4 className="estate-stats__section-title">Populaarseimad kinnisvarad</h4>
                <div className="estate-stats__table-container">
                    <table className="estate-stats__table">
                        <thead>
                        <tr>
                            <th>Nimi</th>
                            <th>Omanikke</th>
                            <th>Hind</th>
                            <th>Turg %</th>
                        </tr>
                        </thead>
                        <tbody>
                        {popularEstates.slice(0, 8).map(estate => (
                            <tr key={estate.estateId}>
                                <td className="estate-stats__estate-name">{estate.estateName}</td>
                                <td className="estate-stats__owner-count">{estate.ownerCount}</td>
                                <td className="estate-stats__price">€{estate.averagePrice.toLocaleString()}</td>
                                <td className="estate-stats__market-share">
                                    {Math.round((estate.ownerCount / playerData.totalPlayersWithEstates) * 100)}%
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Estate Features */}
            <div className="estate-stats__section">
                <h4 className="estate-stats__section-title">Kinnisvara omadused</h4>
                <div className="estate-stats__features-grid">
                    <div className="estate-stats__feature-card">
                        <h5>Omaduste jaotus</h5>
                        <div className="estate-stats__feature-metrics">
                            <div className="estate-stats__feature-metric">
                                <span className="estate-stats__feature-value">{estateFeatures.withGarage}</span>
                                <span className="estate-stats__feature-label">Garaažiga</span>
                            </div>
                            <div className="estate-stats__feature-metric">
                                <span className="estate-stats__feature-value">{estateFeatures.withWorkshop}</span>
                                <span className="estate-stats__feature-label">Töökojaga</span>
                            </div>
                            <div className="estate-stats__feature-metric">
                                <span className="estate-stats__feature-value">{estateFeatures.withoutFeatures}</span>
                                <span className="estate-stats__feature-label">Ilma lisadeta</span>
                            </div>
                        </div>
                    </div>

                    <div className="estate-stats__feature-card">
                        <h5>Garaaži mahutavus</h5>
                        <div className="estate-stats__capacity-list">
                            {estateFeatures.garageCapacityDistribution.map(item => (
                                <div key={item.capacity} className="estate-stats__capacity-item">
                                    <span className="estate-stats__capacity-value">{item.capacity} kohta</span>
                                    <span className="estate-stats__capacity-count">{item.count} kinnisasja</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="estate-stats__feature-card">
                        <h5>Köögi suurused</h5>
                        <div className="estate-stats__kitchen-list">
                            {estateFeatures.kitchenSizeDistribution.map(item => (
                                <div key={item.size} className="estate-stats__kitchen-item">
                                    <span className="estate-stats__kitchen-size">
                                        {item.size === 'small' ? 'Väike' :
                                            item.size === 'medium' ? 'Keskmine' : 'Suur'}
                                    </span>
                                    <span className="estate-stats__kitchen-count">{item.count} kinnisasja</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};