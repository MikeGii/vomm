// src/components/admin/tools/CrimeInitializer.tsx
import React, { useState } from 'react';
import {
    initializeAllDepartmentCrimeStats,
    getAllExpectedDepartments,
    getMissingDepartmentStats
} from '../../../services/CrimeService';
import { useToast } from '../../../contexts/ToastContext';

export const CrimeInitializer: React.FC = () => {
    const [isInitializing, setIsInitializing] = useState(false);
    const [isCheckingMissing, setIsCheckingMissing] = useState(false);
    const [missingCount, setMissingCount] = useState<number | null>(null);
    const { showToast } = useToast();

    const handleInitializeCrime = async () => {
        if (isInitializing) return;

        const confirmed = window.confirm(
            'Kas oled kindel, et tahad lähtestada kõigi osakondade kuritegevuse statistika? See loob puuduvad andmed 50% tasemega.'
        );

        if (!confirmed) return;

        try {
            setIsInitializing(true);
            await initializeAllDepartmentCrimeStats();
            showToast('Kõigi osakondade kuritegevuse statistika on edukalt lähtestatud!', 'success');
            setMissingCount(0); // Reset missing count after successful init
        } catch (error: any) {
            console.error('Crime initialization error:', error);
            showToast(error.message || 'Viga kuritegevuse statistika lähtesel', 'error');
        } finally {
            setIsInitializing(false);
        }
    };

    const handleCheckMissing = async () => {
        if (isCheckingMissing) return;

        try {
            setIsCheckingMissing(true);
            const missing = await getMissingDepartmentStats();
            const total = getAllExpectedDepartments().length;

            setMissingCount(missing.length);

            if (missing.length === 0) {
                showToast(`Kõik ${total} osakonda on juba lähtestatud!`, 'success');
            } else {
                showToast(`${missing.length}/${total} osakonda vajab lähtestamist`, 'warning');
                console.log('Missing departments:', missing);
            }
        } catch (error: any) {
            console.error('Error checking missing departments:', error);
            showToast('Viga puuduvate osakondade kontrollimisel', 'error');
        } finally {
            setIsCheckingMissing(false);
        }
    };

    const expectedDepartments = getAllExpectedDepartments();

    return (
        <div className="admin-tool">
            <div className="tool-content">
                <h4>Kuritegevuse Süsteemi Lähtestamine</h4>
                <p className="tool-description">
                    Lähtestab kõigi osakondade kuritegevuse statistika (50% algtase)
                </p>

                <div style={{ marginBottom: '1rem' }}>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={handleCheckMissing}
                        disabled={isCheckingMissing}
                        style={{ marginBottom: '0.5rem', width: '100%' }}
                    >
                        {isCheckingMissing ? 'Kontrollin...' : 'Kontrolli Puuduvaid Osakondade'}
                    </button>

                    {missingCount !== null && (
                        <div className="tool-note" style={{
                            color: missingCount === 0 ? '#2ecc71' : '#f39c12',
                            fontWeight: 'bold'
                        }}>
                            {missingCount === 0
                                ? `✓ Kõik ${expectedDepartments.length} osakonda on lähtestatud`
                                : `⚠ ${missingCount}/${expectedDepartments.length} osakonda vajab lähtestamist`
                            }
                        </div>
                    )}
                </div>

                <button
                    className="admin-btn admin-btn-warning"
                    onClick={handleInitializeCrime}
                    disabled={isInitializing}
                >
                    {isInitializing ? 'Lähtestadn...' : 'Lähtesta Kuritegevuse Statistika'}
                </button>

                <div className="tool-note">
                    Loob {expectedDepartments.length} osakonna jaoks crime stats (välja arvatud Sisekaitseakadeemia)
                </div>
            </div>
        </div>
    );
};