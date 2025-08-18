// src/components/health/HealthModal.tsx
import React, { useState, useEffect } from 'react';
import { InventoryItem, PlayerStats } from '../../types';
import { getMedicalItems, consumeMedicalItem, getHealthPercentage } from '../../services/MedicalService';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/health/HealthModal.css';

interface HealthModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerStats: PlayerStats;
    onHealthUpdate: () => void;
}

export const HealthModal: React.FC<HealthModalProps> = ({
                                                            isOpen,
                                                            onClose,
                                                            playerStats,
                                                            onHealthUpdate
                                                        }) => {
    const { currentUser } = useAuth();
    const [medicalItems, setMedicalItems] = useState<InventoryItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [isHealing, setIsHealing] = useState(false);
    const [recoveryTime, setRecoveryTime] = useState<string>('');

    useEffect(() => {
        if (isOpen && playerStats.inventory) {
            const items = getMedicalItems(playerStats.inventory);
            setMedicalItems(items);
            setSelectedItemId('');
        }
    }, [isOpen, playerStats.inventory]);

    // Calculate recovery timer
    useEffect(() => {
        if (!playerStats.health || playerStats.health.current >= playerStats.health.max) {
            setRecoveryTime('');
            return;
        }

        const calculateTime = () => {
            if (!playerStats.lastHealthUpdate) {
                setRecoveryTime('60:00');
                return;
            }

            let lastUpdateDate: Date;
            if (playerStats.lastHealthUpdate instanceof Date) {
                lastUpdateDate = playerStats.lastHealthUpdate;
            } else if (playerStats.lastHealthUpdate && typeof playerStats.lastHealthUpdate === 'object' && 'seconds' in playerStats.lastHealthUpdate) {
                lastUpdateDate = new Date((playerStats.lastHealthUpdate as any).seconds * 1000);
            } else {
                lastUpdateDate = new Date(playerStats.lastHealthUpdate);
            }

            const now = new Date();
            const timeSinceLastUpdate = now.getTime() - lastUpdateDate.getTime();
            const msPerHour = 60 * 60 * 1000;
            const timeToNextRecovery = msPerHour - (timeSinceLastUpdate % msPerHour);

            const minutes = Math.floor(timeToNextRecovery / 60000);
            const seconds = Math.floor((timeToNextRecovery % 60000) / 1000);
            setRecoveryTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [playerStats.health, playerStats.lastHealthUpdate]);

    if (!isOpen || !playerStats.health) return null;

    const health = playerStats.health;
    const healthPercentage = getHealthPercentage(health);
    const missingHealth = health.max - health.current;
    const isFullHealth = health.current >= health.max;

    const handleUseItem = async () => {
        if (!selectedItemId || isHealing || !currentUser) return;  // Check currentUser

        setIsHealing(true);
        // Use currentUser.uid instead of playerStats.id
        const result = await consumeMedicalItem(currentUser.uid, selectedItemId);

        if (result.success) {
            // Refresh the parent component
            onHealthUpdate();

            // Update local medical items list
            const updatedItems = getMedicalItems(playerStats.inventory || []);
            setMedicalItems(updatedItems);
            setSelectedItemId('');

            // Show success message (you can add a toast here)
            console.log(result.message);

            // Close modal if health is now full
            if (result.newHealth && result.newHealth >= health.max) {
                setTimeout(() => onClose(), 1500);
            }
        } else {
            // Show error message (you can add a toast here)
            console.error(result.message);
        }

        setIsHealing(false);
    };

    const getHealthStatusClass = () => {
        if (healthPercentage >= 75) return 'health-good';
        if (healthPercentage >= 50) return 'health-medium';
        if (healthPercentage >= 25) return 'health-low';
        return 'health-critical';
    };

    const getItemEffectText = (item: InventoryItem) => {
        if (item.consumableEffect?.value === 9999) {
            return `Taastab täielikult (${missingHealth} HP)`;
        }
        const healAmount = Math.min(item.consumableEffect?.value || 0, missingHealth);
        return `Taastab ${healAmount} HP`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="health-modal" onClick={(e) => e.stopPropagation()}>
                <div className="health-modal-header">
                    <h2>Tervise seisund</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="health-status-section">
                    <div className={`health-bar-large ${getHealthStatusClass()}`}>
                        <div className="health-bar-fill" style={{ width: `${healthPercentage}%` }}>
                            <span className="health-text">
                                {health.current} / {health.max} HP
                            </span>
                        </div>
                    </div>

                    <div className="health-details">
                        <div className="health-detail-row">
                            <span className="label">Praegune tervis:</span>
                            <span className={`value ${getHealthStatusClass()}`}>
                                {health.current} HP ({healthPercentage}%)
                            </span>
                        </div>
                        <div className="health-detail-row">
                            <span className="label">Maksimaalne tervis:</span>
                            <span className="value">{health.max} HP</span>
                        </div>
                        {!isFullHealth && (
                            <>
                                <div className="health-detail-row">
                                    <span className="label">Puuduv tervis:</span>
                                    <span className="value missing">{missingHealth} HP</span>
                                </div>
                                <div className="health-detail-row">
                                    <span className="label">Loomulik taastumine:</span>
                                    <span className="value recovery">
                                        5 HP / tund (järgmine {recoveryTime})
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {health.baseHealth && (
                        <div className="health-bonuses">
                            <div className="bonus-row">
                                <span className="label">Baastervis:</span>
                                <span className="value">{health.baseHealth} HP</span>
                            </div>
                            {health.strengthBonus > 0 && (
                                <div className="bonus-row">
                                    <span className="label">Jõu boonus:</span>
                                    <span className="value bonus">+{health.strengthBonus} HP</span>
                                </div>
                            )}
                            {health.enduranceBonus > 0 && (
                                <div className="bonus-row">
                                    <span className="label">Vastupidavuse boonus:</span>
                                    <span className="value bonus">+{health.enduranceBonus} HP</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isFullHealth && (
                    <div className="medical-items-section">
                        <h3>Kasuta meditsiinitarvet</h3>

                        {medicalItems.length > 0 ? (
                            <>
                                <select
                                    className="medical-item-select"
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    disabled={isHealing}
                                >
                                    <option value="">-- Vali ese --</option>
                                    {medicalItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} - {getItemEffectText(item)}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    className="use-medical-button"
                                    onClick={handleUseItem}
                                    disabled={!selectedItemId || isHealing}
                                >
                                    {isHealing ? 'Kasutan...' : 'Kasuta'}
                                </button>

                                <div className="inventory-count">
                                    <span>Meditsiinitarbeid inventaaris: {medicalItems.length}</span>
                                </div>
                            </>
                        ) : (
                            <div className="no-medical-items">
                                <p>Sul ei ole ühtegi meditsiinitarvet!</p>
                                <p className="hint">Osta neid poest "Meditsiinitarbed" kategooriast.</p>
                            </div>
                        )}
                    </div>
                )}

                {isFullHealth && (
                    <div className="full-health-message">
                        <p>✅ Tervis on maksimaalne!</p>
                        <p className="hint">Meditsiinitarbeid pole vaja kasutada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};