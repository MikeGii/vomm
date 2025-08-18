// src/components/shop/ShopCategories.tsx
import React from 'react';
import { SHOP_CATEGORIES } from '../../types/shop';
import '../../styles/components/shop/ShopCategories.css';

interface ShopCategoriesProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    itemCounts?: Record<string, number>;
}

export const ShopCategories: React.FC<ShopCategoriesProps> = ({
                                                                  activeCategory,
                                                                  onCategoryChange,
                                                                  itemCounts = {}
                                                              }) => {
    return (
        <div className="shop-categories">
            <button
                className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => onCategoryChange('all')}
            >
                Kõik
                {itemCounts.all && <span className="item-count">{itemCounts.all}</span>}
            </button>

            {Object.values(SHOP_CATEGORIES).map(category => (
                <button
                    key={category.id}
                    className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => onCategoryChange(category.id)}
                >
                    {category.name}
                    {itemCounts[category.id] && (
                        <span className="item-count">{itemCounts[category.id]}</span>
                    )}
                </button>
            ))}
        </div>
    );
};