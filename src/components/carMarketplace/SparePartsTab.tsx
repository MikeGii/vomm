// src/components/carMarketplace/SparePartsTab.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useToast } from '../../contexts/ToastContext';
import { SPARE_PARTS, SparePart } from '../../data/vehicles/spareParts';
import { purchaseItem } from '../../services/InventoryService';
import '../../styles/components/carMarketplace/SparePartsTab.css';

const SparePartsTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, refreshStats } = usePlayerStats();
    const { showToast } = useToast();

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

    const filteredParts = selectedCategory === 'all'
        ? SPARE_PARTS
        : SPARE_PARTS.filter(part => part.category === selectedCategory);

    const handlePurchasePart = async (part: SparePart) => {
        if (!currentUser || !playerStats) return;

        if (playerStats.money < part.price) {
            showToast('Sul ei ole piisavalt raha selle osa ostmiseks!', 'error');
            return;
        }

        setPurchasingItemId(part.id);

        try {
            // UPDATED: Use the part's actual price, not a separate parameter
            await purchaseItem(currentUser.uid, {
                itemId: part.id, // This is the base part ID like "turbo_stage1"
                quantity: 1,
                price: part.price
            });

            await refreshStats();
            showToast(`Ostsid: ${part.name}`, 'success');
        } catch (error) {
            console.error('Viga varuosa ostmisel:', error);
            showToast('Viga varuosa ostmisel', 'error');
        } finally {
            setPurchasingItemId(null);
        }
    };

    const getCategoryName = (category: string): string => {
        switch (category) {
            case 'turbo': return 'Turbo';
            case 'ecu': return 'ECU';
            case 'intake': return 'Õhuvõtt';
            case 'exhaust': return 'Väljalase';
            default: return category;
        }
    };

    const getCategoryIcon = (category: string): string => {
        switch (category) {
            case 'turbo': return '/images/turbo.png';
            case 'ecu': return '/images/ecu.png';
            case 'intake': return '/images/intake.png';
            case 'exhaust': return '/images/exhaust.png';
            default: return '';
        }
    };

    return (
        <div className="parts-list-container">
            <div className="parts-list-header">
                <div className="parts-category-filters">
                    <button
                        className={`parts-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Kõik osad
                    </button>
                    <button
                        className={`parts-filter-btn ${selectedCategory === 'turbo' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('turbo')}
                    >
                        <img src="/images/turbo.png" alt="Turbo" className="filter-icon" />
                        Turbo
                    </button>
                    <button
                        className={`parts-filter-btn ${selectedCategory === 'ecu' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('ecu')}
                    >
                        <img src="/images/ecu.png" alt="ECU" className="filter-icon" />
                        ECU
                    </button>
                    <button
                        className={`parts-filter-btn ${selectedCategory === 'intake' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('intake')}
                    >
                        <img src="/images/intake.png" alt="Õhuvõtt" className="filter-icon" />
                        Õhuvõtt
                    </button>
                    <button
                        className={`parts-filter-btn ${selectedCategory === 'exhaust' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('exhaust')}
                    >
                        <img src="/images/exhaust.png" alt="Väljalase" className="filter-icon" />
                        Väljalase
                    </button>
                </div>

                <div className="player-money">
                    <span className="money-text">Sinu raha:</span>
                    <span className="money-value">
                        €{playerStats?.money.toLocaleString() || 0}
                    </span>
                </div>
            </div>

            <div className="parts-list-table-wrapper">
                <table className="parts-list-table">
                    <thead>
                    <tr>
                        <th>Osa</th>
                        <th>Tüüp</th>
                        <th>Tase</th>
                        <th>Võimsuse tõus</th>
                        <th>Hind</th>
                        <th>Tegevus</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredParts.map(part => {
                        const canAfford = (playerStats?.money || 0) >= part.price;
                        const isPurchasing = purchasingItemId === part.id;

                        return (
                            <tr key={part.id} className={`part-row ${!canAfford ? 'unaffordable' : ''}`}>
                                <td className="part-name-cell">
                                    <div className="part-name-wrapper">
                                        <img
                                            src={getCategoryIcon(part.category)}
                                            alt={getCategoryName(part.category)}
                                            className="part-list-icon"
                                        />
                                        <span>{part.name}</span>
                                    </div>
                                </td>
                                <td className="part-category-cell">
                                    {getCategoryName(part.category)}
                                </td>
                                <td className="part-level-cell">
                                    <span className={`level-badge level-${part.level}`}>
                                        {part.level.toUpperCase()}
                                    </span>
                                </td>
                                <td className="part-boost-cell">
                                    <span className="boost-value">+{part.powerBoost}%</span>
                                </td>
                                <td className="part-price-cell">
                                    <span className={`price-tag ${!canAfford ? 'price-red' : ''}`}>
                                        €{part.price.toLocaleString()}
                                    </span>
                                </td>
                                <td className="part-action-cell">
                                    <button
                                        className={`btn-buy-part ${!canAfford ? 'disabled' : ''} ${isPurchasing ? 'purchasing' : ''}`}
                                        onClick={() => handlePurchasePart(part)}
                                        disabled={!canAfford || isPurchasing}
                                    >
                                        {isPurchasing ? '...' :
                                            !canAfford ? '💰' : 'Osta'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {filteredParts.length === 0 && (
                <div className="no-parts-message">
                    <p>Selles kategoorias pole hetkel varuosi saadaval.</p>
                </div>
            )}
        </div>
    );
};

export default SparePartsTab;