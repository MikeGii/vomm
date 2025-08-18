// src/components/shop/ShopHeader.tsx - Updated version
import React from 'react';
import '../../styles/components/shop/ShopHeader.css';

interface ShopHeaderProps {
    playerMoney: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
                                                          playerMoney,
                                                          onRefresh,
                                                          isRefreshing = false
                                                      }) => {
    return (
        <div className="shop-header">
            <div className="shop-header-content">
                <h1 className="shop-title">Pood</h1>
                <div className="shop-header-info">
                    <div className="player-money">
                        <span className="money-label">Sinu raha:</span>
                        <span className="money-amount">€{playerMoney.toFixed(2)}</span>
                    </div>
                    {onRefresh && (
                        <button
                            className={`refresh-button ${isRefreshing ? 'spinning' : ''}`}
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            title="Värskenda hindu ja laoseisu"
                        >
                            ↻
                        </button>
                    )}
                </div>
            </div>
            <div className="shop-info-bar">
                <span className="info-item">
                    💡 Hinnad muutuvad vastavalt laoseisule
                </span>
                <span className="info-item">
                    📦 Ladu täieneb 5% tunnis
                </span>
            </div>
        </div>
    );
};