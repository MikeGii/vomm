// src/components/estate/OwnedEstateTab.tsx
import React, { useState, useEffect } from 'react';
import { useEstate } from '../../contexts/EstateContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { scanInventoryForWorkshopDevices, equipWorkshopDevice, unequipWorkshopDevice } from '../../services/EstateService';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/estate/OwnedEstateTab.css';

export const OwnedEstateTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerEstate, hasWorkshop, canUse3DPrinter, canUseLaserCutter, refreshEstate } = useEstate();
    const { playerStats } = usePlayerStats();
    const { showToast } = useToast();
    const [isEquipping, setIsEquipping] = useState<string | null>(null);

    // Scan inventory for available devices
    const [availableDevices, setAvailableDevices] = useState({ threeDPrinters: 0, laserCutters: 0 });

    useEffect(() => {
        if (playerStats?.inventory) {
            const devices = scanInventoryForWorkshopDevices(playerStats.inventory);
            setAvailableDevices(devices);
        }
    }, [playerStats?.inventory]);

    const handleEquipDevice = async (deviceType: '3d_printer' | 'laser_cutter') => {
        if (!currentUser?.uid) return;

        setIsEquipping(deviceType);
        try {
            await equipWorkshopDevice(currentUser.uid, deviceType);
            await refreshEstate();
            showToast(`Seade paigaldatud!`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Paigaldamine ebaõnnestus', 'error');
        } finally {
            setIsEquipping(null);
        }
    };

    const handleUnequipDevice = async (deviceType: '3d_printer' | 'laser_cutter') => {
        if (!currentUser?.uid) return;

        setIsEquipping(deviceType);
        try {
            await unequipWorkshopDevice(currentUser.uid, deviceType);
            await refreshEstate();
            showToast(`Seade eemaldatud!`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Eemaldamine ebaõnnestus', 'error');
        } finally {
            setIsEquipping(null);
        }
    };

    if (!playerEstate?.currentEstate) {
        return (
            <div className="owned-estate-tab">
                <div className="no-estate-message">
                    <div className="no-estate-icon">🏠</div>
                    <h2>Kinnisvara puudub</h2>
                    <p>Sul ei ole veel kinnisasja. Mine "Osta kinnisvara" sakki, et oma esimene kodu osta!</p>
                </div>
            </div>
        );
    }

    const estate = playerEstate.currentEstate;

    return (
        <div className="owned-estate-tab">
            {/* Current Estate Display */}
            <div className="current-estate-card">
                <div className="estate-header">
                    <h2 className="estate-name">{estate.name}</h2>
                    <div className="estate-value">💰 {estate.price.toLocaleString()} raha</div>
                </div>

                <div className="estate-description">
                    <p>{estate.description}</p>
                </div>

                <div className="estate-features">
                    <h3>Omadused:</h3>
                    <div className="features-grid">
                        <div className={`feature-card ${estate.hasGarage ? 'active' : 'inactive'}`}>
                            <span className="feature-icon">🚗</span>
                            <div className="feature-content">
                                <span className="feature-name">Garaaž</span>
                                <span className="feature-value">
                                    {estate.hasGarage ? `${estate.garageCapacity} kohta` : 'Puudub'}
                                </span>
                            </div>
                        </div>

                        <div className={`feature-card ${estate.hasWorkshop ? 'active' : 'inactive'}`}>
                            <span className="feature-icon">🔧</span>
                            <div className="feature-content">
                                <span className="feature-name">Töökoda</span>
                                <span className="feature-value">
                                    {estate.hasWorkshop ? 'Saadaval' : 'Puudub'}
                                </span>
                            </div>
                        </div>

                        <div className="feature-card active">
                            <span className="feature-icon">🍳</span>
                            <div className="feature-content">
                                <span className="feature-name">Köök</span>
                                <span className="feature-value">
                                    {estate.kitchenSpace === 'small' && 'Väike'}
                                    {estate.kitchenSpace === 'medium' && 'Keskmine'}
                                    {estate.kitchenSpace === 'large' && 'Suur'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workshop Management */}
            {hasWorkshop() && (
                <div className="workshop-management">
                    <h2>🔧 Töökoja haldamine</h2>

                    <div className="workshop-devices">
                        {/* 3D Printer Management */}
                        <div className="device-management-card">
                            <div className="device-header">
                                <span className="device-icon">🖨️</span>
                                <h3>3D Printer</h3>
                            </div>

                            <div className="device-status">
                                <div className={`status-indicator ${canUse3DPrinter() ? 'active' : 'inactive'}`}>
                                    {canUse3DPrinter() ? '✅ Paigaldatud' : '❌ Paigaldamata'}
                                </div>

                                <div className="device-inventory">
                                    Laos: {availableDevices.threeDPrinters} tk
                                </div>
                            </div>

                            <div className="device-actions">
                                {!canUse3DPrinter() && availableDevices.threeDPrinters > 0 && (
                                    <button
                                        className="equip-button"
                                        onClick={() => handleEquipDevice('3d_printer')}
                                        disabled={isEquipping === '3d_printer'}
                                    >
                                        {isEquipping === '3d_printer' ? 'Paigaldan...' : 'Paigalda'}
                                    </button>
                                )}

                                {canUse3DPrinter() && (
                                    <button
                                        className="unequip-button"
                                        onClick={() => handleUnequipDevice('3d_printer')}
                                        disabled={isEquipping === '3d_printer'}
                                    >
                                        {isEquipping === '3d_printer' ? 'Eemaldan...' : 'Eemalda'}
                                    </button>
                                )}

                                {!canUse3DPrinter() && availableDevices.threeDPrinters === 0 && (
                                    <div className="no-device-message">
                                        Osta 3D printer poest, et selle paigaldada
                                    </div>
                                )}
                            </div>

                            {canUse3DPrinter() && (
                                <div className="unlocked-feature">
                                    🎯 Avatud oskus: 3D Printimine
                                </div>
                            )}
                        </div>

                        {/* Laser Cutter Management */}
                        <div className="device-management-card">
                            <div className="device-header">
                                <span className="device-icon">⚡</span>
                                <h3>Laser Cutter</h3>
                            </div>

                            <div className="device-status">
                                <div className={`status-indicator ${canUseLaserCutter() ? 'active' : 'inactive'}`}>
                                    {canUseLaserCutter() ? '✅ Paigaldatud' : '❌ Paigaldamata'}
                                </div>

                                <div className="device-inventory">
                                    Laos: {availableDevices.laserCutters} tk
                                </div>
                            </div>

                            <div className="device-actions">
                                {!canUseLaserCutter() && availableDevices.laserCutters > 0 && (
                                    <button
                                        className="equip-button"
                                        onClick={() => handleEquipDevice('laser_cutter')}
                                        disabled={isEquipping === 'laser_cutter'}
                                    >
                                        {isEquipping === 'laser_cutter' ? 'Paigaldan...' : 'Paigalda'}
                                    </button>
                                )}

                                {canUseLaserCutter() && (
                                    <button
                                        className="unequip-button"
                                        onClick={() => handleUnequipDevice('laser_cutter')}
                                        disabled={isEquipping === 'laser_cutter'}
                                    >
                                        {isEquipping === 'laser_cutter' ? 'Eemaldan...' : 'Eemalda'}
                                    </button>
                                )}

                                {!canUseLaserCutter() && availableDevices.laserCutters === 0 && (
                                    <div className="no-device-message">
                                        Osta laser cutter poest, et selle paigaldada
                                    </div>
                                )}
                            </div>

                            {canUseLaserCutter() && (
                                <div className="unlocked-feature">
                                    🎯 Avatud oskus: Laserilõikus
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};