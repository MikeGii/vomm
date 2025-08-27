// src/components/admin/tools/WorkManager.tsx
import React, { useState } from 'react';
import { completeAllPlayersWorkAdmin } from '../../../services/AdminWorkService';
import { useToast } from '../../../contexts/ToastContext';

export const WorkManager: React.FC = () => {
    const [isCompletingWork, setIsCompletingWork] = useState(false);
    const { showToast } = useToast();

    const handleCompleteAllWork = async () => {
        if (isCompletingWork) return;

        const confirmed = window.confirm(
            'Kas sa oled kindel, et tahad lõpetada kõigi mängijate tööd ilma sündmusteta? See annab neile täielikud auhinnad ja kustutab kõik pooleliolevad sündmused.'
        );

        if (!confirmed) return;

        try {
            setIsCompletingWork(true);
            const result = await completeAllPlayersWorkAdmin();

            if (result.errors.length > 0) {
                console.warn('Some errors occurred:', result.errors);
            }

            let message = `Edukalt lõpetati ${result.completedCount} mängija töö.`;
            if (result.eventsCleanedCount > 0) {
                message += ` Kustutati ${result.eventsCleanedCount} sündmus(t).`;
            }
            if (result.errors.length > 0) {
                message += ` ${result.errors.length} viga tekkis.`;
            }

            showToast(message, result.errors.length > 0 ? 'warning' : 'success');
        } catch (error: any) {
            console.error('Error completing all work:', error);
            showToast(error.message || 'Viga tööde lõpetamisel', 'error');
        } finally {
            setIsCompletingWork(false);
        }
    };

    return (
        <div className="admin-tool">
            <div className="tool-content">
                <h4>Tööde Lõpetamine</h4>
                <p className="tool-description">
                    Lõpetab kõigi mängijate aktiivsed tööd koheselt
                </p>

                <button
                    className="admin-btn admin-btn-danger"
                    onClick={handleCompleteAllWork}
                    disabled={isCompletingWork}
                >
                    {isCompletingWork ? 'Lõpetan tööd...' : 'Lõpeta Kõik Tööd'}
                </button>

                <div className="tool-note">
                    Annab täielikud auhinnad ja kustutab sündmused
                </div>
            </div>
        </div>
    );
};