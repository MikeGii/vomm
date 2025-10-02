// src/components/department/PrefectureTransfer.tsx
import React, { useState } from 'react';
import { PREFECTURES } from '../../data/prefectures';
import { DepartmentUnitService } from '../../services/DepartmentUnitService';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/department/PrefectureTransfer.css';

export const PrefectureTransfer: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [selectedPrefecture, setSelectedPrefecture] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);

    if (!playerStats) return null;

    const transferCheck = DepartmentUnitService.canTransferPrefecture(playerStats);

    // Update available departments when prefecture changes
    const handlePrefectureChange = (prefectureName: string) => {
        setSelectedPrefecture(prefectureName);
        setSelectedDepartment(''); // Reset department selection

        // Get departments for selected prefecture
        const prefecture = PREFECTURES.find(p => p.name === prefectureName);
        if (prefecture) {
            setAvailableDepartments(prefecture.departments);
        }
    };

    const handleTransfer = async () => {
        if (!selectedPrefecture || !selectedDepartment || !currentUser) return;

        setIsTransferring(true);
        try {
            await DepartmentUnitService.transferPrefectureWithDepartment(
                currentUser.uid,
                playerStats.username || 'Unknown',
                playerStats.prefecture!,
                selectedPrefecture,
                selectedDepartment,
                playerStats.department
            );

            showToast('Prefektuur ja osakond vahetatud edukalt!', 'success');
            await refreshStats();
            setShowModal(false);

        } catch (error) {
            console.error('Prefecture transfer error:', error);
            showToast('Viga prefektuuri vahetamisel', 'error');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="prefecture-transfer-container">
            <div className="transfer-header">
                <h3>📍 Prefektuuri vahetus</h3>
                <p className="current-location">
                    <span>Praegune prefektuur: <strong>{playerStats.prefecture}</strong></span>
                    {playerStats.department && (
                        <span> | Osakond: <strong>{playerStats.department}</strong></span>
                    )}
                </p>
            </div>

            {!transferCheck.canTransfer ? (
                <div className="transfer-restricted">
                    <p className="restriction-message">
                        ⏳ {transferCheck.reason}
                    </p>
                    {transferCheck.daysRemaining && (
                        <p className="days-remaining">
                            Oodata veel: {transferCheck.daysRemaining} päeva
                        </p>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setShowModal(true)}
                    className="open-transfer-btn"
                >
                    Vaheta prefektuuri
                </button>
            )}

            {showModal && (
                <>
                    <div className="modal-overlay" onClick={() => setShowModal(false)} />
                    <div className="transfer-modal">
                        <h3>Prefektuuri ja osakonna vahetamine</h3>

                        <div className="transfer-warning">
                            <h4>⚠️ Tähelepanu!</h4>
                            <ul>
                                <li>Kaotad kõik praegused juhipositsioonid</li>
                                <li>Sinu ametikoht lähtestatakse: <strong>Patrullpolitseinik</strong></li>
                                <li>Sinu üksus lähtestatakse: <strong>Patrullitalitus</strong></li>
                                <li>Järgmine vahetus on võimalik 7 päeva pärast</li>
                            </ul>
                        </div>

                        <div className="selection-container">
                            <div className="prefecture-selection">
                                <label>1. Vali uus prefektuur:</label>
                                <select
                                    value={selectedPrefecture}
                                    onChange={(e) => handlePrefectureChange(e.target.value)}
                                    disabled={isTransferring}
                                >
                                    <option value="">-- Vali prefektuur --</option>
                                    {PREFECTURES
                                        .filter(p => p.name !== playerStats.prefecture)
                                        .map(prefecture => (
                                            <option key={prefecture.id} value={prefecture.name}>
                                                {prefecture.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {selectedPrefecture && availableDepartments.length > 0 && (
                                <div className="department-selection">
                                    <label>2. Vali osakond:</label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        disabled={isTransferring}
                                    >
                                        <option value="">-- Vali jaoskond --</option>
                                        {availableDepartments.map(dept => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={handleTransfer}
                                disabled={!selectedPrefecture || !selectedDepartment || isTransferring}
                                className="confirm-transfer-btn"
                            >
                                {isTransferring ? 'Vahetan...' : 'Kinnita vahetus'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedPrefecture('');
                                    setSelectedDepartment('');
                                    setAvailableDepartments([]);
                                }}
                                disabled={isTransferring}
                                className="cancel-btn"
                            >
                                Tühista
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};