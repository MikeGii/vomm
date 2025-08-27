// src/components/admin/tools/LevelRecalculator.tsx
import React, { useState } from 'react';
import { recalculateAllPlayerLevels } from '../../../services/AdminLevelService';
import { useToast } from '../../../contexts/ToastContext';

export const LevelRecalculator: React.FC = () => {
    const [isRecalculatingLevels, setIsRecalculatingLevels] = useState(false);
    const { showToast } = useToast();

    const handleRecalculateLevels = async () => {
        if (isRecalculatingLevels) return;

        const confirmed = window.confirm(
            'Kas sa oled kindel, et tahad ümber arvutada kõigi mängijate tasemed uue 9% progressiooni süsteemi järgi? See toimingu ei saa tagasi võtta.'
        );

        if (!confirmed) return;

        try {
            setIsRecalculatingLevels(true);
            const result = await recalculateAllPlayerLevels();

            let message = `Töödeldud ${result.processedCount} mängijat. Uuendatud ${result.updatedCount} taset.`;
            if (result.errors.length > 0) {
                message += ` ${result.errors.length} viga tekkis.`;
            }

            showToast(message, result.success && result.errors.length === 0 ? 'success' : 'warning');

            if (result.errors.length > 0) {
                console.warn('Level recalculation errors:', result.errors);
            }

        } catch (error: any) {
            console.error('Error recalculating levels:', error);
            showToast(error.message || 'Viga tasemete ümberarvutamisel', 'error');
        } finally {
            setIsRecalculatingLevels(false);
        }
    };

    return (
        <div className="admin-tool">
            <div className="tool-content">
                <h4>Tasemete Ümberarvutamine</h4>
                <p className="tool-description">
                    Arvutab kõik mängijate tasemed uuesti 9% süsteemi järgi
                </p>

                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleRecalculateLevels}
                    disabled={isRecalculatingLevels}
                >
                    {isRecalculatingLevels ? 'Arvutan...' : 'Arvuta Tasemed Uuesti'}
                </button>

                <div className="tool-note">
                    Kasutab olemasolevat kogemust uue formula jaoks
                </div>
            </div>
        </div>
    );
};