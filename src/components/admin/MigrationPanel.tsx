// src/components/admin/MigrationPanel.tsx - Admin Migration Tool

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
    getMigrationStatistics,
    migrateAllPlayersToUniversalTuning,
    getMigrationStatus, testMigrationOnPlayer
} from '../../services/AdminMigrationService';
import '../../styles/components/admin/MigrationPanel.css';

interface MigrationStats {
    totalPlayersNeedingMigration: number;
    totalCarsNeedingMigration: number;
    totalSparePartsValue: number;
    estimatedRefunds: number;
}

export const MigrationPanel: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [stats, setStats] = useState<MigrationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

    const [testUserId, setTestUserId] = useState<string>('');
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadMigrationData();
    }, []);

    const loadMigrationData = async () => {
        setLoading(true);
        try {
            const [migrationStats, status] = await Promise.all([
                getMigrationStatistics(),
                getMigrationStatus()
            ]);

            setStats(migrationStats);
            setMigrationStatus(status);
        } catch (error) {
            console.error('Error loading migration data:', error);
            showToast('Viga migratsiooni andmete laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStartMigration = async () => {
        if (!stats || stats.totalPlayersNeedingMigration === 0) {
            showToast('Pole mängijaid, kes vajaksid migratsiooni', 'info');
            return;
        }

        if (!window.confirm('Kas oled kindel? See migreerib KÕIK mängijad uude süsteemi. See on pöördumatu!')) {
            return;
        }

        // Add second confirmation for safety
        if (!window.confirm(`See mõjutab ${stats.totalPlayersNeedingMigration} mängijat ja ${stats.totalCarsNeedingMigration} autot. Jätka?`)) {
            return;
        }

        setMigrating(true);
        try {
            const result = await migrateAllPlayersToUniversalTuning();

            if (result.success) {
                showToast(`Migratsioon lõpetatud! ${result.details?.playersProcessed} mängijat migreeritud.`, 'success');
                setMigrationStatus('completed');
                await loadMigrationData();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Migration failed:', error);
            showToast('Migratsioon ebaõnnestus', 'error');
        } finally {
            setMigrating(false);
        }
    };

    const handleTestMigration = async () => {
        if (!testUserId.trim()) {
            showToast('Sisesta kasutaja ID', 'error');
            return;
        }

        if (!window.confirm(`Test migration on user: ${testUserId}?`)) {
            return;
        }

        setTesting(true);
        try {
            const result = await testMigrationOnPlayer(testUserId);

            if (result.success) {
                showToast(`Test successful: ${result.message}`, 'success');
            } else {
                showToast(`Test failed: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Test failed:', error);
            showToast('Test migration failed', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="migration-panel loading">Laadin migratsiooni andmeid...</div>;
    }

    return (
        <div className="migration-panel">
            <div className="migration-header">
                <h2>🔧 Universaalse Tuuningu Migratsioon</h2>
                <div className={`migration-status ${migrationStatus}`}>
                    {migrationStatus === 'not_started' && '⏳ Ootel'}
                    {migrationStatus === 'in_progress' && '🔄 Käimas'}
                    {migrationStatus === 'completed' && '✅ Lõpetatud'}
                </div>
            </div>

            {stats && (
                <div className="migration-stats">
                    <div className="stat-card">
                        <h3>Mängijad</h3>
                        <div className="stat-value">{stats.totalPlayersNeedingMigration}</div>
                        <div className="stat-label">vajab migratsiooni</div>
                    </div>
                    <div className="stat-card">
                        <h3>Autod</h3>
                        <div className="stat-value">{stats.totalCarsNeedingMigration}</div>
                        <div className="stat-label">konverteeritakse</div>
                    </div>
                    <div className="stat-card">
                        <h3>Varuosad</h3>
                        <div className="stat-value">{stats.totalSparePartsValue.toLocaleString()}€</div>
                        <div className="stat-label">koguväärtus</div>
                    </div>
                    <div className="stat-card">
                        <h3>Tagasimakse</h3>
                        <div className="stat-value">{stats.estimatedRefunds.toLocaleString()}€</div>
                        <div className="stat-label">eeldatav kogusumma</div>
                    </div>
                </div>
            )}

            <div className="test-section">
                <h3>🧪 Test Migration</h3>
                <div className="test-controls">
                    <input
                        type="text"
                        placeholder="User ID to test"
                        value={testUserId}
                        onChange={(e) => setTestUserId(e.target.value)}
                        className="test-input"
                    />
                    <button
                        className="btn-test"
                        onClick={handleTestMigration}
                        disabled={testing || !testUserId.trim()}
                    >
                        {testing ? 'Testing...' : 'Test Migration'}
                    </button>
                </div>
                <p className="test-note">
                    Test migration on a single player to verify everything works correctly.
                </p>
            </div>

            <div className="migration-description">
                <h3>Migratsiooni protsess:</h3>
                <ol>
                    <li>Kõik mängijate autod tagastatakse stock-tasemele</li>
                    <li>Paigaldatud osade eest tagasimakse 75%</li>
                    <li>Varuosade eest tagasimakse 50%</li>
                    <li>Universaalne tuuningu süsteem aktiveeritakse</li>
                    <li>Kõik varuosad eemaldatakse süsteemist</li>
                </ol>
            </div>

            <div className="migration-actions">
                {migrationStatus === 'not_started' && (
                    <button
                        className="btn-migrate"
                        onClick={handleStartMigration}
                        disabled={migrating || !stats || stats.totalPlayersNeedingMigration === 0}
                    >
                        {migrating ? 'Migreeritakse...' : 'Alusta Migratsiooni'}
                    </button>
                )}

                {migrationStatus === 'completed' && (
                    <div className="migration-completed">
                        <p>✅ Migratsioon on lõpetatud!</p>
                        <button onClick={loadMigrationData}>Värskenda Andmeid</button>
                    </div>
                )}
            </div>

            <div className="migration-warnings">
                <h4>⚠️ Hoiatused:</h4>
                <ul>
                    <li>See protsess on <strong>pöördumatu</strong></li>
                    <li>Kõik mängijad kaotavad oma tuuningu</li>
                    <li>Varuosade süsteem eemaldatakse täielikult</li>
                    <li>Soovitame teha andmebaasi varundus enne</li>
                </ul>
            </div>
        </div>
    );
};