// src/components/shop/ShopTable.tsx - UPDATED with notifications
import React from 'react';
import { formatMoney } from '../../utils/currencyUtils';
import '../../styles/components/shop/ShopTable.css';

interface ShopTableProps {
    items: Array<{
        item: any;
        currentStock: number;
        dynamicPrice: number;
    }>;
    playerMoney: number;
    playerPollid?: number;
    onPurchase: (itemId: string) => void;
    isLoading?: boolean;
}

export const ShopTable: React.FC<ShopTableProps> = ({
                                                        items,
                                                        playerMoney,
                                                        playerPollid = 0,
                                                        onPurchase,
                                                        isLoading = false
                                                    }) => {

    // Check if item is player-dependent (produced items with maxStock = 0)
    const isPlayerDependent = (item: any): boolean => {
        return item.maxStock === 0;
    };

    const formatStats = (stats: any): React.ReactElement => {
        if (!stats) return <span>-</span>;
        const statParts = [];
        if (stats.strength) statParts.push(`Jõud +${stats.strength}`);
        if (stats.agility) statParts.push(`Kiirus ${stats.agility > 0 ? '+' : ''}${stats.agility}`);
        if (stats.dexterity) statParts.push(`Osavus +${stats.dexterity}`);
        if (stats.intelligence) statParts.push(`Intel ${stats.intelligence > 0 ? '+' : ''}${stats.intelligence}`);
        if (stats.endurance) statParts.push(`Vastup ${stats.endurance > 0 ? '+' : ''}${stats.endurance}`);

        if (statParts.length === 0) return <span>-</span>;

        return (
            <div className="stat-list">
                {statParts.map((stat, index) => (
                    <div key={index} className="stat-item">{stat}</div>
                ))}
            </div>
        );
    };

    const formatEffect = (effect?: any): React.ReactElement => {
        if (!effect || !effect.consumableEffect) return <span>-</span>;

        const consumable = effect.consumableEffect;
        switch (consumable.type) {
            case 'trainingClicks':
                return <span className="effect-text">+{consumable.value} klõpsu</span>;
            case 'heal':
                return <span className="effect-text">+{consumable.value === 9999 ? 'Täielik' : consumable.value} HP</span>;
            case 'workTimeReduction':
                return <span className="vip-effect">-{consumable.value}% tööaeg</span>;
            case 'courseTimeReduction':
                return <span className="vip-effect">-{consumable.value}% kursuse aeg</span>;
            default:
                return <span>-</span>;
        }
    };

    const getStockStatus = (current: number, max: number): string => {
        if (max === 0) return 'player-dependent';
        const percentage = (current / max) * 100;
        if (percentage <= 10) return 'critical';
        if (percentage <= 30) return 'low';
        if (percentage <= 70) return 'medium';
        return 'high';
    };

    const getPriceStatus = (basePrice: number, currentPrice: number): boolean => {
        return currentPrice > basePrice;
    };

    if (!items || items.length === 0) {
        return (
            <div className="shop-table-container">
                <div className="no-items-message">
                    <p>Selles kategoorias pole hetkel esemeid saadaval.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-table-container">
            <table className="shop-table">
                <thead>
                <tr>
                    <th>Ese</th>
                    <th>Kirjeldus</th>
                    <th>Boonused</th>
                    <th>Hind</th>
                    <th>Laoseis</th>
                    <th>Tegevus</th>
                </tr>
                </thead>
                <tbody>
                {items.map(({ item, currentStock, dynamicPrice }) => {
                    const canAfford = item.currency === 'pollid'
                        ? playerPollid >= (item.pollidPrice || 0)
                        : playerMoney >= dynamicPrice;

                    const hasStock = currentStock > 0;
                    const stockClass = getStockStatus(currentStock, item.maxStock);
                    const priceIncreased = getPriceStatus(item.basePrice, dynamicPrice);
                    const playerDependent = isPlayerDependent(item);

                    return (
                        <tr key={item.id} className={!hasStock ? 'out-of-stock' : ''}>
                            <td>
                                <div className="item-name">
                                    {item.name}
                                    <span className={`stock-type-indicator ${
                                        playerDependent ? 'player-made-indicator' : 'auto-replenish-indicator'
                                    }`}>
                                        {playerDependent ? 'Mängijad' : 'Auto'}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div className="item-description">
                                    {item.description}
                                    {playerDependent && (
                                        <div className="player-dependent-warning">
                                            <span className="player-dependent-warning-icon">⚠</span>
                                            <span className="player-dependent-warning-text">
                                                Ei täiene automaatselt
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>
                                {item.stats ? formatStats(item.stats) : formatEffect(item)}
                            </td>
                            <td>
                                <div className="price-wrapper">
                                    <span className={`price ${item.currency === 'pollid' ? 'pollid-price' :
                                        priceIncreased ? 'price-increased money-price' : 'money-price'}`}>
                                        {item.currency === 'pollid' ?
                                            `💎${item.pollidPrice}` :
                                            formatMoney(dynamicPrice)}
                                    </span>
                                    {priceIncreased && item.currency !== 'pollid' && (
                                        <span style={{ fontSize: '0.7rem', color: '#f44336' }}>
                                            (Baas: €{item.basePrice.toFixed(2)})
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={`stock-info ${stockClass}`}>
        <span className="stock-number">
            {playerDependent ?
                `${currentStock} saadaval` :
                `${currentStock}/${item.maxStock}`
            }
        </span>
                                    {!playerDependent && (
                                        <div className="stock-bar">
                                            <div
                                                className="stock-fill"
                                                style={{ width: `${(currentStock / item.maxStock) * 100}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>
                                <button
                                    className={`buy-button ${item.currency === 'pollid' ? 'pollid-buy' : ''}`}
                                    onClick={() => onPurchase(item.id)}
                                    disabled={!canAfford || !hasStock || isLoading}
                                >
                                    {!hasStock ? 'Laost otsas' : !canAfford ? 'Pole raha' : 'Osta'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-shop-list">
                {items.map(({ item, currentStock, dynamicPrice }) => {
                    const canAfford = item.currency === 'pollid'
                        ? playerPollid >= (item.pollidPrice || 0)
                        : playerMoney >= dynamicPrice;

                    const hasStock = currentStock > 0;
                    const stockClass = getStockStatus(currentStock, item.maxStock);
                    const stockPercentage = item.maxStock > 0 ? (currentStock / item.maxStock) * 100 : 0;
                    const priceIncreased = getPriceStatus(item.basePrice, dynamicPrice);
                    const playerDependent = isPlayerDependent(item);

                    return (
                        <div key={item.id} className={`mobile-shop-card ${!hasStock ? 'out-of-stock' : ''}`}>
                            <div className="mobile-item-header">
                                <div className="mobile-item-name">
                                    {item.name}
                                    <span className={`stock-type-indicator ${
                                        playerDependent ? 'player-made-indicator' : 'auto-replenish-indicator'
                                    }`}>
        {playerDependent ? 'Mängijad' : 'Auto'}
    </span>
                                </div>
                                <span className={`mobile-price ${item.currency === 'pollid' ? 'pollid-price' :
                                    priceIncreased ? 'price-increased money-price' : 'money-price'}`}>
                                    {item.currency === 'pollid' ?
                                        `💎${item.pollidPrice}` :
                                        formatMoney(dynamicPrice)}
                                </span>
                            </div>

                            <div className="mobile-item-description">
                                <div className="mobile-description-text">
                                    {item.description}
                                </div>
                                {playerDependent && (
                                    <div className="player-dependent-warning">
                                        <span className="player-dependent-warning-icon">⚠️</span>
                                        <span className="player-dependent-warning-text">
                Ei täiene automaatselt. Sõltub mängijate müügist.
            </span>
                                    </div>
                                )}
                            </div>

                            <div className="mobile-item-stats">
                                <div className="mobile-stats-title">Boonused</div>
                                <div className="mobile-stats-content">
                                    {item.stats ? (
                                        <>
                                            {item.stats.strength && <span className="mobile-stat-item">Jõud +{item.stats.strength}</span>}
                                            {item.stats.agility && <span className="mobile-stat-item">Kiirus {item.stats.agility > 0 ? '+' : ''}{item.stats.agility}</span>}
                                            {item.stats.dexterity && <span className="mobile-stat-item">Osavus +{item.stats.dexterity}</span>}
                                            {item.stats.intelligence && <span className="mobile-stat-item">Intel {item.stats.intelligence > 0 ? '+' : ''}{item.stats.intelligence}</span>}
                                            {item.stats.endurance && <span className="mobile-stat-item">Vastup {item.stats.endurance > 0 ? '+' : ''}{item.stats.endurance}</span>}
                                        </>
                                    ) : item.consumableEffect ? (
                                        <>
                                            {item.consumableEffect.type === 'trainingClicks' && <span className="mobile-stat-item">+{item.consumableEffect.value} klõpsu</span>}
                                            {item.consumableEffect.type === 'heal' && <span className="mobile-stat-item">+{item.consumableEffect.value === 9999 ? 'Täielik' : item.consumableEffect.value} HP</span>}
                                            {item.consumableEffect.type === 'workTimeReduction' && <span className="mobile-vip-effect">-{item.consumableEffect.value}% tööaeg</span>}
                                            {item.consumableEffect.type === 'courseTimeReduction' && <span className="mobile-vip-effect">-{item.consumableEffect.value}% kursuse aeg</span>}
                                        </>
                                    ) : (
                                        <span className="mobile-stat-item">Puuduvad</span>
                                    )}
                                </div>
                            </div>

                            <div className="mobile-item-stock">
                                <div className="mobile-stock-title">Laoseis</div>
                                <div className={`mobile-stock-display ${stockClass}`}>
                                    <span className="mobile-stock-number">
                                        {playerDependent ? currentStock : `${currentStock}/${item.maxStock}`}
                                    </span>
                                    {!playerDependent && (
                                        <div className="mobile-stock-bar">
                                            <div className="mobile-stock-fill" style={{ width: `${stockPercentage}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mobile-item-action">
                                <button
                                    className={`mobile-buy-button ${item.currency === 'pollid' ? 'pollid-buy' : ''}`}
                                    onClick={() => onPurchase(item.id)}
                                    disabled={!canAfford || !hasStock || isLoading}
                                >
                                    {!hasStock ? 'Laost otsas' : !canAfford ? 'Pole raha' : 'Osta'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ShopTable;