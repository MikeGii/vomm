// src/components/admin/AdminTools.tsx
import React, { useState } from 'react';
import { restockAllItems } from '../../services/AdminShopService';
import { completeAllPlayersWorkAdmin } from '../../services/AdminWorkService';
import { useToast } from '../../contexts/ToastContext';
import { recalculateAllPlayerLevels } from '../../services/AdminLevelService';
import '../../styles/components/admin/AdminTools.css';

export const AdminTools: React.FC = () => {
    const [isRestocking, setIsRestocking] = useState(false);
    const [isCompletingWork, setIsCompletingWork] = useState(false);
    const [isRecalculatingLevels, setIsRecalculatingLevels] = useState(false);
    const { showToast } = useToast();

    const handleRestockAll = async () => {
        if (isRestocking) return;

        const confirmed = window.confirm(
            'Kas sa oled kindel, et tahad täita kõik esemed maksimaalse laoseisuni? See toimingu ei saa tagasi võtta.'
        );

        if (!confirmed) return;

        try {
            setIsRestocking(true);
            const result = await restockAllItems();
            showToast(
                `Edukalt täideti ${result.restockedCount} ese(t). Vahele jäeti ${result.skippedCount} ese(t).`,
                'success'
            );
        } catch (error: any) {
            console.error('Error restocking items:', error);
            showToast(error.message || 'Viga esemete taastäitmisel', 'error');
        } finally {
            setIsRestocking(false);
        }
    };

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

    const handleRecalculateLevels = async () => {
        if (isRecalculatingLevels) return;

        const confirmed = window.confirm(
            'Kas sa oled kindel, et tahad ümber arvutada kõigi mängijate tasemed uue 9% progressiooni süsteemi järgi? See toimingu ei saa tagasi võtta.'
        );

        if (!confirmed) return;

        try {
            setIsRecalculatingLevels(true);
            const result = await recalculateAllPlayerLevels();

            let message = `Edukalt töödeldud ${result.processedCount} mängijat. Uuendatud ${result.updatedCount} mängija taset.`;
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
        <div className="admin-tools">
            <h2>Admin tööriistad</h2>

            <div className="tools-section">
                <div className="tool-card">
                    <div className="tool-header">
                        <h3>Lao haldus</h3>
                        <p>Kiired toimingud kogu poe laoseisu haldamiseks</p>
                    </div>

                    <div className="tool-actions">
                        <button
                            className="restock-all-btn"
                            onClick={handleRestockAll}
                            disabled={isRestocking}
                        >
                            {isRestocking ? 'Täidan ladu...' : 'Täida kõik laod maksimumini'}
                        </button>
                        <small className="tool-note">
                            Täidab kõik esemed (v.a. mängija valmistatud tooted) maksimaalse laoseisuni
                        </small>
                    </div>
                </div>

                <div className="tool-card">
                    <div className="tool-header">
                        <h3>Tööde haldus</h3>
                        <p>Mängijate aktiivsete tööde kiire haldamine</p>
                    </div>

                    <div className="tool-actions">
                        <button
                            className="complete-work-btn"
                            onClick={handleCompleteAllWork}
                            disabled={isCompletingWork}
                        >
                            {isCompletingWork ? 'Lõpetan tööd...' : 'Lõpeta kõik tööd ilma sündmusteta'}
                        </button>
                        <small className="tool-note">
                            Lõpetab kõigi mängijate aktiivsed tööd, annab täielikud auhinnad ja kustutab kõik pooleliolevad sündmused
                        </small>
                    </div>
                </div>

                {/* NEW: Level Recalculator */}
                <div className="tool-card">
                    <div className="tool-header">
                        <h3>Tasemete haldus</h3>
                        <p>Mängijate tasemete ümberarvutamine uue süsteemi järgi</p>
                    </div>

                    <div className="tool-actions">
                        <button
                            className="recalculate-levels-btn"
                            onClick={handleRecalculateLevels}
                            disabled={isRecalculatingLevels}
                        >
                            {isRecalculatingLevels ? 'Arvutan tasemeid...' : 'Arvuta kõik tasemed uuesti (9% süsteem)'}
                        </button>
                        <small className="tool-note">
                            Arvutab kõigi mängijate tasemed uuesti lähtudes nende hetkelisest kogemusest ja uuest 9% kasvusüsteemist
                        </small>
                    </div>
                </div>

                <div className="tool-card">
                    <div className="tool-header">
                        <h3>Tulevased tööriistad</h3>
                        <p>Siin kuvatakse täiendavad admin tööriistad</p>
                    </div>

                    <div className="tool-actions">
                        <div className="placeholder-content">
                            <p>Planeeritavad funktsioonid:</p>
                            <ul>
                                <li>Mängijate haldus</li>
                                <li>Sündmuste haldus</li>
                                <li>Seadete konfigureerimine</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};