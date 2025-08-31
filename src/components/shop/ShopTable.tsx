// src/components/shop/ShopTable.tsx - UPDATED FOR HYBRID SYSTEM
import React from 'react';
import { formatMoney } from '../../utils/currencyUtils';
import '../../styles/components/shop/ShopTable.css';

interface ShopTableProps {
    items: Array<{
        item: any;
        currentStock: number;
        staticPrice: number;
        hasUnlimitedStock: boolean;
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

    // Check if item is player-craftable (has limited stock from players)
    const isPlayerCraftableItem = (item: any): boolean => {
        return item.maxStock === 0;
    };

    const formatStats = (stats: any, workshopStats?: any): React.ReactElement => {
        if (!stats && !workshopStats) return <span className="no-data">-</span>;

        const statParts = [];

        // Traditional combat/training stats
        if (stats?.strength) statParts.push(`Jõud +${stats.strength}`);
        if (stats?.agility) statParts.push(`Kiirus ${stats.agility > 0 ? '+' : ''}${stats.agility}`);
        if (stats?.dexterity) statParts.push(`Osavus +${stats.dexterity}`);
        if (stats?.intelligence) statParts.push(`Intel ${stats.intelligence > 0 ? '+' : ''}${stats.intelligence}`);
        if (stats?.endurance) statParts.push(`Vastup ${stats.endurance > 0 ? '+' : ''}${stats.endurance}`);

        // Kitchen/lab stats (if you have them)
        if (stats?.cooking) statParts.push(`🍳 Toit +${stats.cooking}`);
        if (stats?.brewing) statParts.push(`🥤 Jook +${stats.brewing}`);
        if (stats?.chemistry) statParts.push(`🧪 Keemia +${stats.chemistry}`);

        // Handicraft stats (if you have them)
        if (stats?.sewing) statParts.push(`🪡 Õmbl +${stats.sewing}`);
        if (stats?.medicine) statParts.push(`🏥 Med +${stats.medicine}`);

        // NEW: Workshop success rates instead of bonuses
        if (workshopStats?.deviceType === 'printing') {
            statParts.push(`🖨️ Õnnestumise määr: ${workshopStats.successRate}%`);
        } else if (workshopStats?.deviceType === 'lasercutting') {
            statParts.push(`🔧 Õnnestumise määr: ${workshopStats.successRate}%`);
        }

        if (statParts.length === 0) {
            return <span className="no-data">Boonuseid pole</span>;
        }

        return (
            <div className="item-stats">
                {statParts.map((stat, index) => (
                    <span key={index} className="stat-bonus">
                    {stat}
                </span>
                ))}
            </div>
        );
    };

    const formatEffect = (item: any): React.ReactElement => {
        const consumable = item.consumableEffect;
        if (!consumable) return <span className="no-data">-</span>;

        switch (consumable.type) {
            case 'trainingClicks':
                return <span className="effect-compact">+{consumable.value} treening</span>;
            case 'kitchenClicks':
                return <span className="effect-compact">+{consumable.value} köök</span>;
            case 'handicraftClicks':
                return <span className="effect-compact">+{consumable.value} käsitöö</span>;
            case 'energy':
                return <span className="effect-compact">+{consumable.value} energia</span>;
            case 'experience':
                return <span className="effect-compact">+{consumable.value} kogemus</span>;
            case 'heal':
                return <span className="effect-compact">{consumable.value === 100 ? 'Täielik' : consumable.value} HP</span>;
            case 'workTimeReduction':
                return <span className="vip-effect-compact">-{consumable.value}% tööaeg</span>;
            case 'courseTimeReduction':
                return <span className="vip-effect-compact">-{consumable.value}% kursus</span>;
            default:
                return <span className="no-data">-</span>;
        }
    };

    const getStockStatus = (current: number, hasUnlimited: boolean, isPlayerCraftable: boolean): string => {
        if (hasUnlimited) return 'unlimited';
        if (isPlayerCraftable) {
            if (current === 0) return 'out-of-stock';
            if (current <= 5) return 'critical';
            if (current <= 20) return 'low';
            return 'available';
        }
        return 'unlimited';
    };

    const renderStockDisplay = (currentStock: number, hasUnlimitedStock: boolean, isPlayerCraftable: boolean) => {
        if (hasUnlimitedStock) {
            return (
                <div className="stock-compact unlimited">
                    <span className="stock-text">Alati saadaval</span>
                </div>
            );
        }

        if (isPlayerCraftable) {
            const stockStatus = getStockStatus(currentStock, hasUnlimitedStock, isPlayerCraftable);
            return (
                <div className={`stock-compact ${stockStatus}`}>
                    <span className="stock-text">
                        {currentStock === 0 ? 'Otsas' : `${currentStock} tk`}
                    </span>
                    {currentStock > 0 && (
                        <div className="stock-bar-compact">
                            <div
                                className="stock-fill"
                                style={{ width: `${Math.min(currentStock * 5, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="stock-compact unlimited">
                <span className="stock-text">Alati saadaval</span>
            </div>
        );
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
            {/* Desktop Table */}
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
                {items.map(({ item, currentStock, staticPrice, hasUnlimitedStock }) => {
                    const canAfford = item.currency === 'pollid'
                        ? playerPollid >= (item.basePollidPrice || item.pollidPrice || 0)
                        : playerMoney >= staticPrice;

                    const hasStock = hasUnlimitedStock || currentStock > 0;
                    const isPlayerCraftable = isPlayerCraftableItem(item);

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
                                {isPlayerCraftable && (
                                    <div className="player-warning-compact">
                                        ⚠ Mängijate poolt valmistatud
                                    </div>
                                )}
                            </td>
                            <td className="td-bonus">
                                {(item.stats || item.workshopStats) ? formatStats(item.stats, item.workshopStats) : formatEffect(item)}
                            </td>
                            <td className="td-price">
                                <div className="price-compact">
                                    <span className={`price-amount ${item.currency === 'pollid' ? 'pollid' : ''}`}>
                                        {item.currency === 'pollid' ?
                                            `💎${item.basePollidPrice || item.pollidPrice}` :
                                            formatMoney(staticPrice)}
                                    </span>
                                </div>
                            </td>
                            <td className="td-stock">
                                {renderStockDisplay(currentStock, hasUnlimitedStock, isPlayerCraftable)}
                            </td>
                            <td className="td-action">
                                <button
                                    className={`buy-btn-compact ${item.currency === 'pollid' ? 'pollid' : ''}`}
                                    onClick={() => onPurchase(item.id)}
                                    disabled={!canAfford || !hasStock || isLoading}
                                >
                                    {!hasStock ? 'Otsas' : !canAfford ? 'Kallis' : 'Osta'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            {/* Mobile Grid */}
            <div className="mobile-shop-grid">
                {items.map(({ item, currentStock, staticPrice, hasUnlimitedStock }) => {
                    const canAfford = item.currency === 'pollid'
                        ? playerPollid >= (item.basePollidPrice || item.pollidPrice || 0)
                        : playerMoney >= staticPrice;

                    const hasStock = hasUnlimitedStock || currentStock > 0;
                    const isPlayerCraftable = isPlayerCraftableItem(item);

                    return (
                        <div key={item.id} className={`mobile-card-compact ${!hasStock ? 'out-of-stock' : ''}`}>
                            <div className="mobile-header">
                                <div className="mobile-name">{item.name}</div>
                                <div className={`mobile-price ${item.currency === 'pollid' ? 'pollid' : ''}`}>
                                    {item.currency === 'pollid' ?
                                        `💎${item.basePollidPrice || item.pollidPrice}` :
                                        formatMoney(staticPrice)}
                                </div>
                            </div>

                            <div className="mobile-desc">
                                {item.description}
                                {isPlayerCraftable && (
                                    <div className="mobile-warning">
                                        ⚠ Mängijate poolt valmistatud
                                    </div>
                                )}
                            </div>

                            {(item.stats || item.workshopStats || item.consumableEffect) && (
                                <div className="mobile-stats">
                                    {(item.stats || item.workshopStats) ?
                                        formatStats(item.stats, item.workshopStats) : (
                                            <div className="mobile-effect">
                                                {formatEffect(item)}
                                            </div>
                                        )}
                                </div>
                            )}

                            <div className="mobile-footer">
                                <div className="mobile-stock">
                                    {hasUnlimitedStock ? 'Alati saadaval' :
                                        currentStock === 0 ? 'Otsas' : `${currentStock} tk`}
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

            {/* Pagination Controls */}
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
};

export default ShopTable;