// src/components/shop/ShopTable.tsx - COMPACT VERSION with all data preserved
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
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const ShopTable: React.FC<ShopTableProps> = ({
                                                        items,
                                                        playerMoney,
                                                        playerPollid = 0,
                                                        onPurchase,
                                                        isLoading = false,
                                                        currentPage,
                                                        totalPages,
                                                        onPageChange
                                                    }) => {

    // Check if item is player-dependent (produced items with maxStock = 0)
    const isPlayerDependent = (item: any): boolean => {
        return item.maxStock === 0;
    };

    const formatStats = (stats: any): React.ReactElement => {
        if (!stats) return <span className="no-data">-</span>;
        const statParts = [];
        if (stats.strength) statParts.push(`Jõud +${stats.strength}`);
        if (stats.agility) statParts.push(`Kiirus ${stats.agility > 0 ? '+' : ''}${stats.agility}`);
        if (stats.dexterity) statParts.push(`Osavus +${stats.dexterity}`);
        if (stats.intelligence) statParts.push(`Intel ${stats.intelligence > 0 ? '+' : ''}${stats.intelligence}`);
        if (stats.endurance) statParts.push(`Vastup ${stats.endurance > 0 ? '+' : ''}${stats.endurance}`);

        if (statParts.length === 0) return <span className="no-data">-</span>;

        return (
            <div className="stat-list-compact">
                {statParts.map((stat, index) => (
                    <span key={index} className="stat-item-compact">{stat}</span>
                ))}
            </div>
        );
    };

    const formatEffect = (effect?: any): React.ReactElement => {
        if (!effect || !effect.consumableEffect) return <span className="no-data">-</span>;

        const consumable = effect.consumableEffect;
        switch (consumable.type) {
            case 'trainingClicks':
                return <span className="effect-compact">+{consumable.value} spordiklõpsu</span>;
            case 'kitchenClicks':
                return <span className="effect-compact">+{consumable.value} köök/labor</span>;
            case 'handicraftClicks':
                return <span className="effect-compact">+{consumable.value} käsitöö</span>;

            case 'heal':
                if (consumable.value === 100) {
                    return <span className="effect-compact">+100 HP</span>;
                }
                return <span className="effect-compact">+{consumable.value === 100 ? 'Täielik' : consumable.value} HP</span>;
            case 'workTimeReduction':
                return <span className="vip-effect-compact">-{consumable.value}% tööaeg</span>;
            case 'courseTimeReduction':
                return <span className="vip-effect-compact">-{consumable.value}% kursus</span>;
            default:
                return <span className="no-data">-</span>;
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
                {totalPages > 1 && (
                    <div className="pagination-container">
                        <button
                            className="pagination-btn"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Eelmine
                        </button>
                        <div className="pagination-info">
                            Lehekülg {currentPage} / {totalPages}
                        </div>
                        <button
                            className="pagination-btn"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Järgmine →
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="shop-table-container">
            <table className="shop-table compact">
                <thead>
                <tr>
                    <th className="th-item">Ese</th>
                    <th className="th-desc">Kirjeldus</th>
                    <th className="th-bonus">Boonused</th>
                    <th className="th-price">Hind</th>
                    <th className="th-stock">Laoseis</th>
                    <th className="th-action">Tegevus</th>
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
                        <tr key={item.id} className={`compact-row ${!hasStock ? 'out-of-stock' : ''}`}>
                            <td className="td-item">
                                <div className="item-name-compact">
                                    {item.name}
                                </div>
                            </td>
                            <td className="td-desc">
                                <div className="item-desc-compact">
                                    {item.description}
                                </div>
                                {playerDependent && (
                                    <div className="player-warning-compact">
                                        ⚠ Ei täiene auto
                                    </div>
                                )}
                            </td>
                            <td className="td-bonus">
                                {item.stats ? formatStats(item.stats) : formatEffect(item)}
                            </td>
                            <td className="td-price">
                                <div className="price-compact">
                                        <span className={`price-amount ${item.currency === 'pollid' ? 'pollid' :
                                            priceIncreased ? 'increased' : ''}`}>
                                            {item.currency === 'pollid' ?
                                                `💎${item.pollidPrice}` :
                                                formatMoney(dynamicPrice)}
                                        </span>
                                    {priceIncreased && item.currency !== 'pollid' && (
                                        <span className="base-price">
                                                €{item.basePrice.toFixed(2)}
                                            </span>
                                    )}
                                </div>
                            </td>
                            <td className="td-stock">
                                <div className={`stock-compact ${stockClass}`}>
                                        <span className="stock-text">
                                            {playerDependent ?
                                                `${currentStock}` :
                                                `${currentStock}/${item.maxStock}`
                                            }
                                        </span>
                                    {!playerDependent && (
                                        <div className="stock-bar-compact">
                                            <div
                                                className="stock-fill"
                                                style={{ width: `${(currentStock / item.maxStock) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="td-action">
                                <button
                                    className={`buy-btn-compact ${item.currency === 'pollid' ? 'pollid' : ''}`}
                                    onClick={() => onPurchase(item.id)}
                                    disabled={!canAfford || !hasStock || isLoading}
                                >
                                    {!hasStock ? 'Otsas' : !canAfford ? 'Raha' : 'Osta'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            {/* Mobile Cards - Compact Version */}
            <div className="mobile-shop-grid">
                {items.map(({ item, currentStock, dynamicPrice }) => {
                    const canAfford = item.currency === 'pollid'
                        ? playerPollid >= (item.pollidPrice || 0)
                        : playerMoney >= dynamicPrice;

                    const hasStock = currentStock > 0;
                    const stockClass = getStockStatus(currentStock, item.maxStock);
                    const stockPercentage = item.maxStock > 0 ? (currentStock / item.maxStock) * 100 : 0;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const priceIncreased = getPriceStatus(item.basePrice, dynamicPrice);
                    const playerDependent = isPlayerDependent(item);

                    return (
                        <div key={item.id} className={`mobile-card-compact ${!hasStock ? 'out-of-stock' : ''}`}>
                            <div className="mobile-header">
                                <span className="mobile-name">{item.name}</span>
                                <span className={`mobile-price ${item.currency === 'pollid' ? 'pollid' : ''}`}>
                                    {item.currency === 'pollid' ?
                                        `💎${item.pollidPrice}` :
                                        formatMoney(dynamicPrice)}
                                </span>
                            </div>

                            <div className="mobile-type">
                                {playerDependent ? 'Mängijad' : 'Auto'}
                            </div>

                            <div className="mobile-desc">
                                {item.description}
                                {playerDependent && <span className="mobile-warning"> ⚠</span>}
                            </div>

                            <div className="mobile-stats">
                                {item.stats ? (
                                    <div className="mobile-stat-list">
                                        {item.stats.strength && <span>J+{item.stats.strength}</span>}
                                        {item.stats.agility && <span>K{item.stats.agility > 0 ? '+' : ''}{item.stats.agility}</span>}
                                        {item.stats.dexterity && <span>O+{item.stats.dexterity}</span>}
                                        {item.stats.intelligence && <span>I{item.stats.intelligence > 0 ? '+' : ''}{item.stats.intelligence}</span>}
                                        {item.stats.endurance && <span>V{item.stats.endurance > 0 ? '+' : ''}{item.stats.endurance}</span>}
                                    </div>
                                ) : item.consumableEffect ? (
                                    <div className="mobile-effect">
                                        {item.consumableEffect.type === 'trainingClicks' && `+${item.consumableEffect.value} klõps`}
                                        {item.consumableEffect.type === 'heal' && `+${item.consumableEffect.value === 9999 ? 'Full' : item.consumableEffect.value} HP`}
                                        {item.consumableEffect.type === 'workTimeReduction' && `-${item.consumableEffect.value}% töö`}
                                        {item.consumableEffect.type === 'courseTimeReduction' && `-${item.consumableEffect.value}% kursus`}
                                    </div>
                                ) : '-'}
                            </div>

                            <div className="mobile-footer">
                                <div className={`mobile-stock ${stockClass}`}>
                                    {playerDependent ? currentStock : `${currentStock}/${item.maxStock}`}
                                    {!playerDependent && (
                                        <div className="mobile-stock-bar">
                                            <div className="mobile-stock-fill" style={{ width: `${stockPercentage}%` }} />
                                        </div>
                                    )}
                                </div>
                                <button
                                    className={`mobile-buy-btn ${item.currency === 'pollid' ? 'pollid' : ''}`}
                                    onClick={() => onPurchase(item.id)}
                                    disabled={!canAfford || !hasStock || isLoading}
                                >
                                    {!hasStock ? '✗' : !canAfford ? '€' : '✓'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls - Keep existing */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    {/* Keep your existing pagination code */}
                    <button
                        className="pagination-btn"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        ← Eelmine
                    </button>
                    <div className="pagination-info">
                        Lehekülg {currentPage} / {totalPages}
                    </div>
                    <button
                        className="pagination-btn"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Järgmine →
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShopTable;