// src/components/department/DepartmentManagement.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { DepartmentUnitData, UpgradeType, UPGRADE_CONFIGS, getUpgradeInfo, getNextLevelCost } from '../../types/departmentUnit';
import { DepartmentUnitService } from '../../services/DepartmentUnitService';
import { isUnitLeader, canDonateToUnitWallet } from '../../utils/playerStatus';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/department/DepartmentManagement.css';

interface DepartmentManagementProps {
    playerStats: PlayerStats;
    onMoneyUpdate?: () => void;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
                                                                              playerStats,
                                                                              onMoneyUpdate
                                                                          }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [unitData, setUnitData] = useState<DepartmentUnitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [donationAmount, setDonationAmount] = useState<string>('');
    const [processingDonation, setProcessingDonation] = useState(false);
    const [purchasingUpgrade, setPurchasingUpgrade] = useState<string | null>(null);

    const isLeader = isUnitLeader(playerStats);
    const canDonate = canDonateToUnitWallet(playerStats);

    // Load department unit data
    useEffect(() => {
        const loadUnitData = async () => {
            if (!playerStats.department || !playerStats.departmentUnit) {
                setLoading(false);
                return;
            }

            try {
                const data = await DepartmentUnitService.getUnit(
                    playerStats.department,
                    playerStats.departmentUnit
                );
                setUnitData(data);
            } catch (error) {
                console.error('Error loading unit data:', error);
                showToast('Viga üksuse andmete laadimisel', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadUnitData();
    }, [playerStats.department, playerStats.departmentUnit, showToast]);

    const handleDonation = async () => {
        if (!playerStats.username) {
            showToast('Kasutajanimi puudub', 'error');
            return;
        }

        const amount = parseInt(donationAmount);

        if (isNaN(amount) || amount <= 0) {
            showToast('Palun sisesta kehtiv summa', 'warning');
            return;
        }

        if (amount > (playerStats.money || 0)) {
            showToast('Sul pole piisavalt raha', 'error');
            return;
        }

        setProcessingDonation(true);

        try {
            await DepartmentUnitService.processDonation(
                playerStats.department!,
                playerStats.departmentUnit!,
                {
                    amount,
                    donorId: currentUser!.uid,
                    donorUsername: playerStats.username || 'Unknown',
                    donorPosition: playerStats.policePosition || 'unknown'
                }
            );

            showToast(`Annetasid ${amount}€ üksuse rahakotti!`, 'success');
            setDonationAmount('');

            // Reload unit data
            const updated = await DepartmentUnitService.getUnit(
                playerStats.department!,
                playerStats.departmentUnit!
            );
            setUnitData(updated);

            // Trigger money update in parent
            if (onMoneyUpdate) onMoneyUpdate();

        } catch (error) {
            console.error('Error processing donation:', error);
            showToast('Viga annetuse tegemisel', 'error');
        } finally {
            setProcessingDonation(false);
        }
    };

    const handlePurchaseUpgrade = async (upgradeType: UpgradeType) => {
        if (!playerStats.username) {
            showToast('Kasutajanimi puudub', 'error');
            return;
        }

        if (!isLeader) {
            showToast('Ainult üksuse juht saab osta uuendusi', 'warning');
            return;
        }

        if (!unitData) return;

        const upgrade = unitData.wallet.upgrades.find(u => u.type === upgradeType);
        if (!upgrade) return;

        const upgradeInfo = getUpgradeInfo(upgradeType);
        if (!upgradeInfo || upgrade.level >= upgradeInfo.maxLevel) {
            showToast('Maksimaalne tase juba saavutatud', 'info');
            return;
        }

        const cost = getNextLevelCost(upgradeType, upgrade.level);
        if (!cost || cost > unitData.wallet.balance) {
            showToast('Üksuse rahakotis pole piisavalt raha', 'error');
            return;
        }

        setPurchasingUpgrade(upgradeType);

        try {
            const success = await DepartmentUnitService.purchaseUpgrade(
                playerStats.department!,
                playerStats.departmentUnit!,
                upgradeType,
                playerStats.username,
                currentUser!.uid
            );

            if (success) {
                showToast(`Uuendus ostetud! Tase ${upgrade.level + 1}`, 'success');

                // Reload unit data
                const updated = await DepartmentUnitService.getUnit(
                    playerStats.department!,
                    playerStats.departmentUnit!
                );
                setUnitData(updated);
            } else {
                showToast('Uuenduse ostmine ebaõnnestus', 'error');
            }
        } catch (error) {
            console.error('Error purchasing upgrade:', error);
            showToast('Viga uuenduse ostmisel', 'error');
        } finally {
            setPurchasingUpgrade(null);
        }
    };

    if (loading) {
        return <div className="dept-mgmt-loading">Laadin üksuse andmeid...</div>;
    }

    if (!unitData || !canDonate) {
        return null; // Don't show component if not in a unit or can't donate
    }

    return (
        <div className="dept-mgmt-container">
            <div className="dept-mgmt-header">
                <h3>🏦 Üksuse Rahakott - {unitData.unitName}</h3>
                <div className="dept-mgmt-wallet-balance">
                    <span className="dept-mgmt-balance-label">Saldo:</span>
                    <span className="dept-mgmt-balance-amount">{unitData.wallet.balance.toLocaleString()}€</span>
                </div>
            </div>

            {/* Donation Section */}
            <div className="dept-mgmt-donation-section">
                <h4>💰 Anneta üksusele</h4>
                <div className="dept-mgmt-donation-form">
                    <input
                        type="number"
                        className="dept-mgmt-donation-input"
                        placeholder="Summa (€)"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        disabled={processingDonation}
                        min="1"
                        max={playerStats.money || 0}
                    />
                    <button
                        onClick={handleDonation}
                        disabled={processingDonation || !donationAmount}
                        className="dept-mgmt-donate-btn"
                    >
                        {processingDonation ? 'Annetan...' : 'Anneta'}
                    </button>
                </div>
                <div className="dept-mgmt-player-balance">
                    Sinu raha: {(playerStats.money || 0).toLocaleString()}€
                </div>
            </div>

            {/* Upgrades Section */}
            <div className="dept-mgmt-upgrades-section">
                <h4>🚀 Uuendused</h4>
                {UPGRADE_CONFIGS.map(config => {
                    const upgrade = unitData.wallet.upgrades.find(u => u.type === config.type);
                    if (!upgrade) return null;

                    const nextCost = getNextLevelCost(config.type, upgrade.level);
                    const isMaxLevel = upgrade.level >= config.maxLevel;
                    const currentBonus = upgrade.level > 0
                        ? config.levels[upgrade.level - 1].bonus
                        : 0;

                    return (
                        <div key={config.type} className="dept-mgmt-upgrade-card">
                            <div className="dept-mgmt-upgrade-header">
                                <h5>{config.name}</h5>
                                <span className="dept-mgmt-upgrade-level">
                                    Tase {upgrade.level}/{config.maxLevel}
                                </span>
                            </div>

                            <p className="dept-mgmt-upgrade-description">{config.description}</p>

                            {currentBonus > 0 && (
                                <div className="dept-mgmt-current-bonus">
                                    Praegune boonus: <strong>+{currentBonus}%</strong>
                                </div>
                            )}

                            {!isMaxLevel && (
                                <div className="dept-mgmt-next-level">
                                    <span>Järgmine tase: +{config.levels[upgrade.level].bonus}%</span>
                                    <span className="dept-mgmt-upgrade-cost">Hind: {nextCost?.toLocaleString()}€</span>
                                </div>
                            )}

                            {isLeader && !isMaxLevel && (
                                <button
                                    className="dept-mgmt-purchase-btn"
                                    onClick={() => handlePurchaseUpgrade(config.type)}
                                    disabled={
                                        purchasingUpgrade === config.type ||
                                        !nextCost ||
                                        nextCost > unitData.wallet.balance
                                    }
                                >
                                    {purchasingUpgrade === config.type ? 'Ostan...' : 'Osta uuendus'}
                                </button>
                            )}

                            {isMaxLevel && (
                                <div className="dept-mgmt-max-level">
                                    ✅ Maksimaalne tase saavutatud
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};