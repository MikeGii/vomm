// src/components/shop/ShopHeader.tsx - Fixed version
import React from 'react';
import '../../styles/components/shop/ShopHeader.css';

interface ShopHeaderProps {
    playerMoney: number;
    onBack: () => void;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ playerMoney, onBack }) => {
    return (
        <div className="shop-header">
            <button className="shop-back-button" onClick={onBack}>
                <span className="arrow-icon">←</span> Tagasi
            </button>

            <h1 className="shop-title">Pood</h1>

            <div className="shop-money-display">
                <span className="money-icon">€</span>
                <span className="money-amount">{playerMoney}</span>
            </div>
        </div>
    );
};