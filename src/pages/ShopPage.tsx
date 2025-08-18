// src/pages/ShopPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ShopHeader } from '../components/shop/ShopHeader';
import { ShopCategories } from '../components/shop/ShopCategories';
import { ShopItemGrid } from '../components/shop/ShopItemGrid';
import { ShopPurchaseModal } from '../components/shop/ShopPurchaseModal';
import { ShopItem } from '../types/shop';
import { PlayerStats } from '../types';
import { ALL_SHOP_ITEMS, getItemsByCategory } from '../data/shop';
import { purchaseItem, sortShopItems } from '../services/ShopService';
import '../styles/pages/Shop.css';

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [playerMoney, setPlayerMoney] = useState(0);
    const [activeCategory, setActiveCategory] = useState('all');
    const [displayedItems, setDisplayedItems] = useState<ShopItem[]>(ALL_SHOP_ITEMS);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Listen to player stats for money updates
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const unsubscribe = onSnapshot(
            doc(firestore, 'playerStats', currentUser.uid),
            (doc) => {
                if (doc.exists()) {
                    const stats = doc.data() as PlayerStats;
                    setPlayerMoney(stats.money || 0);
                }
                setIsLoading(false);
            },
            (error) => {
                console.error('Error fetching player stats:', error);
                showToast('Viga andmete laadimisel', 'error');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser, navigate, showToast]);

    // Update displayed items when category changes
    useEffect(() => {
        if (activeCategory === 'all') {
            setDisplayedItems(sortShopItems(ALL_SHOP_ITEMS, 'price_asc'));
        } else {
            const categoryItems = getItemsByCategory(activeCategory);
            setDisplayedItems(sortShopItems(categoryItems, 'price_asc'));
        }
    }, [activeCategory]);

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
    };

    const handlePurchase = (item: ShopItem) => {
        setSelectedItem(item);
        setIsPurchaseModalOpen(true);
    };

    const handleViewDetails = (item: ShopItem) => {
        setSelectedItem(item);
        setIsPurchaseModalOpen(true);
    };

    const confirmPurchase = async () => {
        if (!selectedItem || !currentUser) return;

        const result = await purchaseItem(currentUser.uid, selectedItem.id);

        if (result.success) {
            showToast(result.message, 'success');
            setIsPurchaseModalOpen(false);
            setSelectedItem(null);
        } else {
            showToast(result.message, 'error');
        }
    };

    const cancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedItem(null);
    };

    // Calculate item counts for categories
    const getItemCounts = () => {
        const counts: Record<string, number> = {
            all: ALL_SHOP_ITEMS.length
        };

        ['uniforms', 'protection', 'weapons', 'equipment', 'consumables', 'documents'].forEach(category => {
            counts[category] = getItemsByCategory(category).length;
        });

        return counts;
    };

    if (isLoading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="shop-container">
                    <div className="loading-state">Laadin poodi...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="shop-container">
                <ShopHeader
                    playerMoney={playerMoney}
                    onBack={() => navigate('/dashboard')}
                />

                <ShopCategories
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                    itemCounts={getItemCounts()}
                />

                <ShopItemGrid
                    items={displayedItems}
                    playerMoney={playerMoney}
                    onPurchase={handlePurchase}
                    onViewDetails={handleViewDetails}
                />

                <ShopPurchaseModal
                    item={selectedItem}
                    isOpen={isPurchaseModalOpen}
                    playerMoney={playerMoney}
                    onConfirm={confirmPurchase}
                    onCancel={cancelPurchase}
                />
            </main>
        </div>
    );
};

export default ShopPage;