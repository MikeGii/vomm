// src/components/shop/ShopPurchaseModal.tsx
import React from 'react';
import { ShopItem } from '../../types/shop';
import { calculateFinalPrice } from '../../services/ShopService';
import '../../styles/components/shop/ShopPurchaseModal.css';

interface ShopPurchaseModalProps {
    item: ShopItem | null;
    isOpen: boolean;
    playerMoney: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ShopPurchaseModal: React.FC<ShopPurchaseModalProps> = ({
                                                                        item,
                                                                        isOpen,
                                                                        playerMoney,
                                                                        onConfirm,
                                                                        onCancel
                                                                    }) => {
    if (!isOpen || !item) return null;

    const finalPrice = calculateFinalPrice(item);
    const canAfford = playerMoney >= finalPrice;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Kinnita ost</h2>

                <div className="modal-item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>

                    {item.stats && (
                        <div className="item-stats">
                            {item.stats.strength && <span className="stat">+{item.stats.strength} Jõud</span>}
                            {item.stats.agility && <span className="stat">+{item.stats.agility} Kiirus</span>}
                            {item.stats.dexterity && <span className="stat">+{item.stats.dexterity} Osavus</span>}
                            {item.stats.intelligence && <span className="stat">+{item.stats.intelligence} Intel</span>}
                            {item.stats.endurance && <span className="stat">+{item.stats.endurance} Vastup</span>}
                        </div>
                    )}
                </div>

                <div className="modal-price-info">
                    <div className="price-row">
                        <span>Hind:</span>
                        <span className="price">€{finalPrice}</span>
                    </div>
                    <div className="price-row">
                        <span>Sinu raha:</span>
                        <span className={canAfford ? 'balance' : 'balance insufficient'}>€{playerMoney}</span>
                    </div>
                    <div className="price-row total">
                        <span>Peale ostu:</span>
                        <span className="remaining">€{playerMoney - finalPrice}</span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onCancel}>
                        Tühista
                    </button>
                    <button
                        className="confirm-button"
                        onClick={onConfirm}
                        disabled={!canAfford}
                    >
                        {canAfford ? 'Osta' : 'Ebapiisav raha'}
                    </button>
                </div>
            </div>
        </div>
    );
};