// src/components/admin/vehicle-management/CarMigrationTab.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { migrateCarModelIds, getCarMigrationStatus, CarMigrationResult } from '../../../services/CarMigrationService';

const CarMigrationTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [migrationStatus, setMigrationStatus] = useState<{
        totalCars: number;
        hardcodedCars: number;
        databaseCars: number;
    } | null>(null);
    const [migrationResult, setMigrationResult] = useState<CarMigrationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        loadMigrationStatus();
    }, []);

    const loadMigrationStatus = async () => {
        setIsLoading(true);
        try {
            const status = await getCarMigrationStatus();
            setMigrationStatus(status);
        } catch (error) {
            console.error('Failed to load migration status:', error);
            showToast('Viga migratsiooni staatuse laadimisel', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMigration = async () => {
        if (!currentUser) {
            showToast('Pead olema sisse logitud', 'error');
            return;
        }

        if (migrationStatus?.hardcodedCars === 0) {
            showToast('Kõik autod on juba migreeritud', 'info');
            return;
        }

        const confirmed = window.confirm(
            `Kas oled kindel, et soovid migreerida ${migrationStatus?.hardcodedCars} autot? See tegevus on pöördumatu.`
        );

        if (!confirmed) return;

        setIsMigrating(true);
        try {
            const result = await migrateCarModelIds(currentUser.uid);
            setMigrationResult(result);

            if (result.success) {
                showToast(`Migratsioon lõpetatud: ${result.migratedCars} autot migreeritud`, 'success');
            } else {
                showToast(`Migratsioon lõpetatud vigadega: ${result.errors.length} viga`, 'warning');
            }

            // Refresh status
            await loadMigrationStatus();
        } catch (error: any) {
            console.error('Migration failed:', error);
            showToast(`Migratsioon ebaõnnestus: ${error.message}`, 'error');
        } finally {
            setIsMigrating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="migration-tab">
                <div className="loading">Laadin migratsiooni staatust...</div>
            </div>
        );
    }

    return (
        <div className="migration-tab">
            <div className="migration-header">
                <h2>Auto Mudeli Migratsioon</h2>
                <p>Migreeri vanad hardcoded auto mudelid andmebaasi mudeliteks</p>
            </div>

            {migrationStatus && (
                <div className="migration-status">
                    <div className="status-cards">
                        <div className="status-card">
                            <div className="status-number">{migrationStatus.totalCars}</div>
                            <div className="status-label">Kokku autosid</div>
                        </div>
                        <div className="status-card warning">
                            <div className="status-number">{migrationStatus.hardcodedCars}</div>
                            <div className="status-label">Vanad autod</div>
                        </div>
                        <div className="status-card success">
                            <div className="status-number">{migrationStatus.databaseCars}</div>
                            <div className="status-label">Migreeritud autod</div>
                        </div>
                    </div>

                    <div className="migration-actions">
                        <button
                            className="btn btn-refresh"
                            onClick={loadMigrationStatus}
                            disabled={isLoading}
                        >
                            Värskenda Staatust
                        </button>

                        <button
                            className={`btn btn-migrate ${migrationStatus.hardcodedCars === 0 ? 'disabled' : ''}`}
                            onClick={handleMigration}
                            disabled={isMigrating || migrationStatus.hardcodedCars === 0}
                        >
                            {isMigrating ? 'Migreerimas...' : `Migreeri ${migrationStatus.hardcodedCars} autot`}
                        </button>
                    </div>
                </div>
            )}

            {migrationResult && (
                <div className="migration-results">
                    <h3>Migratsiooni Tulemused</h3>
                    <div className="result-summary">
                        <div>Migreeritud: {migrationResult.migratedCars}</div>
                        <div>Vahele jäetud: {migrationResult.skippedCars}</div>
                        <div>Vigu: {migrationResult.errors.length}</div>
                    </div>

                    {migrationResult.errors.length > 0 && (
                        <div className="migration-errors">
                            <h4>Vead:</h4>
                            <ul>
                                {migrationResult.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="migration-details">
                        <h4>Detailid:</h4>
                        <div className="details-list">
                            {migrationResult.details.map((detail, index) => (
                                <div key={index} className={`detail-item ${detail.status}`}>
                                    <span className="car-id">{detail.carId}</span>
                                    <span className="model-change">
                                        {detail.oldModelId} → {detail.newModelId || 'N/A'}
                                    </span>
                                    <span className="status">{detail.status}</span>
                                    <span className="reason">{detail.reason}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarMigrationTab;