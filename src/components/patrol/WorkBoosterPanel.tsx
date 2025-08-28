// src/components/patrol/WorkBoosterPanel.tsx
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { getWorkTimeBoosters, applyWorkTimeBooster } from '../../services/WorkBoosterService';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/patrol/WorkBoosterPanel.css';

interface WorkBoosterPanelProps {
    inventory: InventoryItem[];
    currentUserId: string;
    activeWorkEndTime: Date;
    onBoosterApplied: () => void;
    boosterAlreadyUsed?: boolean;
}

export const WorkBoosterPanel: React.FC<WorkBoosterPanelProps> = ({
                                                                      inventory,
                                                                      currentUserId,
                                                                      activeWorkEndTime,
                                                                      onBoosterApplied,
                                                                      boosterAlreadyUsed = false
                                                                  }) => {
    const [isApplying, setIsApplying] = useState(false);
    const { showToast } = useToast();

    const workBoosters = getWorkTimeBoosters(inventory);

    const handleApplyBooster = async (boosterItemId: string) => {
        if (isApplying) return;

        setIsApplying(true);
        try {
            const result = await applyWorkTimeBooster(currentUserId, boosterItemId);

            if (result.success) {
                showToast(result.message, 'success');
                onBoosterApplied(); // Refresh parent component
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga boosteri rakendamisel', 'error');
        } finally {
            setIsApplying(false);
        }
    };

    const formatTimeRemaining = (endTime: Date): string => {
        const now = new Date();
        const timeDiff = endTime.getTime() - now.getTime();

        if (timeDiff <= 0) return 'Lõppenud';

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        } else {
            return `${minutes}min`;
        }
    };

    // Check if booster was already used for this work
    if (boosterAlreadyUsed) {
        return (
            <div className="work-booster-panel">
                <h3 className="booster-title">🚀 Tööaja Kiirendajad</h3>
                <div className="work-status">
                    <p className="time-remaining">
                        Aega jäänud: <span className="time-value">{formatTimeRemaining(activeWorkEndTime)}</span>
                    </p>
                </div>
                <div className="no-boosters">
                    <p style={{ color: '#9c27b0' }}>✅ Kiirendaja juba kasutatud selle tööülesande jaoks!</p>
                    <p className="booster-hint">Iga tööülesande kohta saab kasutada ainult ühe kiirendaja.</p>
                </div>
            </div>
        );
    }

    // If no boosters in inventory
    if (workBoosters.length === 0) {
        return (
            <div className="work-booster-panel">
                <h3 className="booster-title">🚀 Tööaja Kiirendajad</h3>
                <div className="work-status">
                    <p className="time-remaining">
                        Aega jäänud: <span className="time-value">{formatTimeRemaining(activeWorkEndTime)}</span>
                    </p>
                </div>
                <div className="no-boosters">
                    <p>Sul pole tööaja kiirendajaid.</p>
                    <p className="booster-hint">Osta VIP pooest Pollidega või valmista Köök/Labor ruumis!</p>
                </div>
            </div>
        );
    }

    // Show available boosters
    return (
        <div className="work-booster-panel">
            <h3 className="booster-title">🚀 Tööaja Kiirendajad</h3>
            <div className="work-status">
                <p className="time-remaining">
                    Aega jäänud: <span className="time-value">{formatTimeRemaining(activeWorkEndTime)}</span>
                </p>
            </div>

            <div className="boosters-list">
                {workBoosters.map((booster) => (
                    <div key={booster.id} className="booster-item">
                        <div className="booster-info">
                            <h4 className="booster-name">{booster.name} ({booster.quantity}x)</h4>
                            <p className="booster-description">{booster.description}</p>
                            <div className="booster-effect">
                                -{booster.consumableEffect?.value}% tööaeg
                            </div>
                        </div>
                        <button
                            className="apply-booster-btn"
                            onClick={() => handleApplyBooster(booster.id)}
                            disabled={isApplying}
                        >
                            {isApplying ? 'Rakendab...' : 'Kasuta'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};