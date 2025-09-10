// src/components/admin/tools/VehicleDataMigrator.tsx
import React, { useState } from 'react';
import { migrateVehicleData, validateMigration, MigrationResult } from '../../../services/VehicleDataMigration';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export const VehicleDataMigrator: React.FC = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const handleMigration = async () => {
        if (!currentUser) return;

        const confirmed = window.confirm(
            'Kas oled kindel, et tahad migreerida kõik sõidukite andmed andmebaasi? See toiming on ohutu ja ei mõjuta olemasolevaid mängijate autosid.'
        );

        if (!confirmed) return;

        try {
            setIsMigrating(true);
            setMigrationResult(null);

            const result = await migrateVehicleData(currentUser.uid);
            setMigrationResult(result);

            if (result.success) {
                showToast(
                    `Andmed edukalt migreeritud! Loodud: ${result.brandsCreated} marki, ${result.enginesCreated} mootorit, ${result.modelsCreated} mudelit.`,
                    'success'
                );
            } else {
                showToast('Migratsioon lõpetatud vigadega. Kontrolli tulemusi.', 'warning');
            }
        } catch (error: any) {
            showToast(`Migratsiooni viga: ${error.message}`, 'error');
        } finally {
            setIsMigrating(false);
        }
    };

    const handleValidation = async () => {
        try {
            setIsValidating(true);
            const result = await validateMigration();
            setValidationResult(result);

            if (result.isValid) {
                showToast('Andmebaas on korrektne!', 'success');
            } else {
                showToast(`Leiti ${result.issues.length} probleemi andmebaasis`, 'warning');
            }
        } catch (error: any) {
            showToast(`Validatsiooni viga: ${error.message}`, 'error');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="admin-tool">
            <div className="tool-content">
                <h4>Sõidukite Andmete Migratsioon</h4>
                <p className="tool-description">
                    Migreerib kõik hardcoded sõidukite andmed andmebaasi
                </p>

                <div className="migration-actions">
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={handleMigration}
                        disabled={isMigrating}
                        style={{ marginBottom: '0.5rem' }}
                    >
                        {isMigrating ? 'Migreerib...' : 'Alusta Migratsiooni'}
                    </button>

                    <button
                        className="admin-btn admin-btn-warning"
                        onClick={handleValidation}
                        disabled={isValidating}
                    >
                        {isValidating ? 'Kontrollib...' : 'Kontrolli Andmebaasi'}
                    </button>
                </div>

                <div className="tool-note">
                    ⚠️ Ohutu: ei mõjuta olemasolevaid mängijate autosid
                </div>

                {/* Migration Results */}
                {migrationResult && (
                    <div className="migration-results">
                        <h5>Migratsiooni Tulemused:</h5>
                        <div className="result-stats">
                            <span className="stat-item">Margid: {migrationResult.brandsCreated} uut</span>
                            <span className="stat-item">Mootorid: {migrationResult.enginesCreated} uut</span>
                            <span className="stat-item">Mudelid: {migrationResult.modelsCreated} uut</span>
                        </div>

                        {migrationResult.skippedDuplicates.brands > 0 && (
                            <p className="skip-info">
                                Vahele jäetud duplikaadid: {migrationResult.skippedDuplicates.brands + migrationResult.skippedDuplicates.engines + migrationResult.skippedDuplicates.models}
                            </p>
                        )}

                        {migrationResult.errors.length > 0 && (
                            <div className="migration-errors">
                                <h6>Vead:</h6>
                                {migrationResult.errors.slice(0, 3).map((error, index) => (
                                    <p key={index} className="error-item">{error}</p>
                                ))}
                                {migrationResult.errors.length > 3 && (
                                    <p>...ja {migrationResult.errors.length - 3} veel</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Validation Results */}
                {validationResult && (
                    <div className="validation-results">
                        <h5>Andmebaasi Kontroll:</h5>
                        <div className="result-stats">
                            <span className="stat-item">Margid: {validationResult.summary.totalBrands}</span>
                            <span className="stat-item">Mootorid: {validationResult.summary.totalEngines}</span>
                            <span className="stat-item">Mudelid: {validationResult.summary.totalModels}</span>
                        </div>

                        {validationResult.issues.length > 0 && (
                            <div className="validation-issues">
                                <h6>Probleemid:</h6>
                                {validationResult.issues.slice(0, 3).map((issue: string, index: number) => (
                                    <p key={index} className="issue-item">{issue}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};