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
    const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
    const [isHealing, setIsHealing] = useState(false);
    const [recoveryTime, setRecoveryTime] = useState<string>('');

    useEffect(() => {
        if (isOpen && playerStats.inventory) {
            const items = getMedicalItems(playerStats.inventory);
            setMedicalItems(items);
            setSelectedItemId('');
            setSelectedQuantity(1);
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

    // Update quantity when item selection changes
    useEffect(() => {
        if (selectedItemId && playerStats.health) {
            const item = medicalItems.find(i => i.id === selectedItemId);
            if (item) {
                const healthNeeded = playerStats.health.max - playerStats.health.current;
                const healPerItem = item.consumableEffect?.value || 0;

                if (healPerItem >= 9999) {
                    // Full heal items only need 1
                    setSelectedQuantity(1);
                } else {
                    // Calculate optimal quantity
                    const optimal = Math.ceil(healthNeeded / healPerItem);
                    setSelectedQuantity(Math.min(optimal, item.quantity));
                }
            }
        }
    }, [selectedItemId, medicalItems, playerStats.health]);

    if (!isOpen || !playerStats.health) return null;

    const health = playerStats.health;
    const healthPercentage = getHealthPercentage(health);
    const missingHealth = health.max - health.current;
    const isFullHealth = health.current >= health.max;

    const selectedItem = medicalItems.find(i => i.id === selectedItemId);
    const maxQuantity = selectedItem?.quantity || 1;
    const isFullHealItem = selectedItem?.consumableEffect?.value && selectedItem.consumableEffect.value >= 9999;

    const handleQuantityChange = (newQuantity: number) => {
        const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
        setSelectedQuantity(validQuantity);
    };

    const calculateHealthPreview = () => {
        if (!selectedItem || !selectedItem.consumableEffect) return 0;

        const healPerItem = selectedItem.consumableEffect.value;
        if (healPerItem >= 9999) return missingHealth;

        return Math.min(healPerItem * selectedQuantity, missingHealth);
    };

    const handleUseItem = async () => {
        if (!selectedItemId || isHealing || !currentUser) return;

        setIsHealing(true);
        const result = await consumeMedicalItem(currentUser.uid, selectedItemId, selectedQuantity);

        if (result.success) {
            // Refresh the parent component
            onHealthUpdate();

            // Update local medical items list
            const updatedItems = getMedicalItems(playerStats.inventory || []);
            setMedicalItems(updatedItems);
            setSelectedItemId('');
            setSelectedQuantity(1);

            // Close modal if health is now full
            if (result.newHealth && result.newHealth >= health.max) {
                setTimeout(() => onClose(), 1500);
            }
        } else {
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
        return `Taastab ${healAmount} HP | Laos: ${item.quantity}`;
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
                        {selectedItem && (
                            <div
                                className="health-bar-preview"
                                style={{
                                    left: `${healthPercentage}%`,
                                    width: `${(calculateHealthPreview() / health.max) * 100}%`
                                }}
                            />
                        )}
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

                                {selectedItem && !isFullHealItem && (
                                    <div className="quantity-selector">
                                        <label className="quantity-label">Kogus:</label>
                                        <div className="quantity-controls">
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleQuantityChange(selectedQuantity - 1)}
                                                disabled={selectedQuantity <= 1 || isHealing}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                className="quantity-input"
                                                value={selectedQuantity}
                                                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                                min="1"
                                                max={maxQuantity}
                                                disabled={isHealing}
                                            />
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleQuantityChange(selectedQuantity + 1)}
                                                disabled={selectedQuantity >= maxQuantity || isHealing}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="quantity-info">
                                            <span>Taastab: +{calculateHealthPreview()} HP</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="use-medical-button"
                                    onClick={handleUseItem}
                                    disabled={!selectedItemId || isHealing}
                                >
                                    {isHealing ? 'Kasutan...' : `Kasuta ${selectedQuantity > 1 ? `${selectedQuantity}x` : ''}`}
                                </button>

                                <div className="inventory-count">
                                    <span>Meditsiinitarbeid inventaaris: {medicalItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
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