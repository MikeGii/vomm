// src/components/shop/ShopTable.tsx - Fixed version
import React from 'react';
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
    // Group items by category
    const groupedItems = items.reduce((acc, { item, currentStock, dynamicPrice }) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push({ item, currentStock, dynamicPrice });
        return acc;
    }, {} as Record<string, typeof items>);

    const getCategoryName = (category: string): string => {
        const names: { [key: string]: string } = {
            protection: 'Kaitsevahendid',
            trainingBooster: 'Sporditarbed',
            medical: 'Meditsiinitarbed',
            vip: 'VIP Pood'
        };
        return names[category] || category;
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
            case 'health':
                return <span className="effect-text">+{consumable.value === 9999 ? 'Täielik' : consumable.value} HP</span>;
            case 'workTimeReduction':
                return <span className="effect-text vip-effect">-{consumable.value}% tööaeg</span>;
            case 'courseTimeReduction':
                return <span className="effect-text vip-effect">-{consumable.value}% kursuse aeg</span>;
            default:
                return <span>-</span>;
        }
    };

    const getStockStatus = (current: number, max: number): string => {
        const percentage = (current / max) * 100;
        if (percentage === 0) return 'stock-empty';
        if (percentage < 20) return 'stock-critical';
        if (percentage < 50) return 'stock-low';
        if (percentage < 80) return 'stock-medium';
        return 'stock-high';
    };

    const getPriceStatus = (basePrice: number, dynamicPrice: number): boolean => {
        return dynamicPrice > basePrice * 1.1; // Show if price is 10% higher
    };

    return (
        <div className="shop-table-container">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="category-section">
                    <h3 className="category-title">{getCategoryName(category)}</h3>
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
                        {categoryItems.map(({ item, currentStock, dynamicPrice }) => {
                            const canAfford = item.currency === 'pollid'
                                ? playerPollid >= (item.pollidPrice || 0)
                                : playerMoney >= dynamicPrice;

                            const hasStock = currentStock > 0;
                            const stockClass = getStockStatus(currentStock, item.maxStock);
                            const priceIncreased = getPriceStatus(item.basePrice, dynamicPrice);

                            return (
                                <tr key={item.id} className={!hasStock ? 'out-of-stock' : ''}>
                                    <td>
                                        <div className="item-name">{item.name}</div>
                                    </td>
                                    <td>
                                        <div className="item-description">{item.description}</div>
                                    </td>
                                    <td>
                                        {item.stats ? formatStats(item.stats) : formatEffect(item.effect)}
                                    </td>
                                    <td>
                                        <div className="price-wrapper">
                                            {item.currency === 'money' && (
                                                <>
                                                    <span className={`price money-price ${priceIncreased ? 'price-increased' : ''}`}>
                                                        €{dynamicPrice.toFixed(2)}
                                                    </span>
                                                    {priceIncreased && <span className="price-indicator">↑</span>}
                                                </>
                                            )}
                                            {item.currency === 'pollid' && (
                                                <span className="price pollid-price">
                                                    💎 {item.pollidPrice}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`stock-display ${stockClass}`}>
                                            <span className="stock-number">{currentStock}/{item.maxStock}</span>
                                            <div className="stock-bar">
                                                <div
                                                    className="stock-fill"
                                                    style={{ width: `${(currentStock / item.maxStock) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className={`buy-button ${item.currency === 'pollid' ? 'pollid-buy' : ''}`}
                                            onClick={() => onPurchase(item.id)}
                                            disabled={!canAfford || !hasStock}
                                        >
                                            {!hasStock ? 'Otsas' :
                                                !canAfford ? (item.currency === 'pollid' ? 'Pole Pollide' : 'Pole raha') :
                                                    'Osta'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};