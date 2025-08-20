// src/components/training/ProcessedItemsDisplay.tsx
import React from 'react';
import { InventoryItem } from '../../types';
import '../../styles/components/training/ProcessedItemsDisplay.css';

interface ProcessedItemsDisplayProps {
    items: InventoryItem[];
}

export const ProcessedItemsDisplay: React.FC<ProcessedItemsDisplayProps> = ({ items }) => {
    if (!items || items.length === 0) {
        return (
            <div className="processed-items-container">
                <h3 className="processed-items-title">Valmistatud tooted</h3>
                <div className="no-items-message">
                    <p>Sul pole veel ühtegi toodet valmistatud</p>
                </div>
            </div>
        );
    }

    return (
        <div className="processed-items-container">
            <h3 className="processed-items-title">Valmistatud tooted</h3>
            <div className="processed-items-grid">
                {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="processed-item-card">
                        <div className="item-name">{item.name}</div>
                        <div className="item-quantity">Kogus: {item.quantity}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};