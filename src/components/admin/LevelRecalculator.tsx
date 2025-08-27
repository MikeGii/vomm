// src/components/admin/LevelRecalculator.tsx
import React, { useState } from 'react';
import { recalculateAllPlayerLevels } from '../../services/AdminLevelService';

export const LevelRecalculator: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{
        success: boolean;
        processedCount: number;
        updatedCount: number;
        errors: string[];
    } | null>(null);

    const handleRecalculate = async () => {
        if (!window.confirm('This will recalculate ALL player levels based on their current XP. Continue?')) {
            return;
        }

        setIsProcessing(true);
        setResults(null);

        try {
            const results = await recalculateAllPlayerLevels();
            setResults(results);
        } catch (error) {
            setResults({
                success: false,
                processedCount: 0,
                updatedCount: 0,
                errors: [`Fatal error: ${error}`]
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="admin-tool-section">
            <h3>Level Recalculator</h3>
            <p>Recalculate all player levels based on new 9% progression system</p>

            <button
                onClick={handleRecalculate}
                disabled={isProcessing}
                className="admin-btn admin-btn-warning"
            >
                {isProcessing ? 'Processing...' : 'Recalculate All Levels'}
            </button>

            {results && (
                <div className={`admin-results ${results.success ? 'success' : 'error'}`}>
                    <h4>Results:</h4>
                    <p>Processed: {results.processedCount} players</p>
                    <p>Updated: {results.updatedCount} players</p>
                    <p>Status: {results.success ? 'Success' : 'Failed'}</p>

                    {results.errors.length > 0 && (
                        <div className="error-list">
                            <h5>Errors:</h5>
                            <ul>
                                {results.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};