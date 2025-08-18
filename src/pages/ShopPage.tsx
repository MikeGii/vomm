// src/pages/ShopPage.tsx - Updated version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ShopHeader } from '../components/shop/ShopHeader';
import { ShopTable } from '../components/shop/ShopTable';
import { ShopPurchaseModal } from '../components/shop/ShopPurchaseModal';
import { ShopItem } from '../types/shop';
import { PlayerStats } from '../types';
import { purchaseItem } from '../services/ShopService';
import {
    initializeShopStock,
    getAllItemsWithStock,
    getItemStock,
    calculateDynamicPrice
} from '../services/ShopStockService';
import { ALL_SHOP_ITEMS } from '../data/shop';
import '../styles/pages/Shop.css';

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [playerMoney, setPlayerMoney] = useState(0);
    const [itemsWithStock, setItemsWithStock] = useState<Array<{
        item: any;
        currentStock: number;
        dynamicPrice: number;
    }>>([]);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [selectedItemStock, setSelectedItemStock] = useState(0);
    const [selectedItemPrice, setSelectedItemPrice] = useState(0);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Initialize shop stock on first load
    useEffect(() => {
        const initStock = async () => {
            try {
                await initializeShopStock();
            } catch (error) {
                console.error('Error initializing shop stock:', error);
            }
        };
        initStock();
    }, []);

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
            },
            (error) => {
                console.error('Error fetching player stats:', error);
                showToast('Viga andmete laadimisel', 'error');
            }
        );

        return () => unsubscribe();
    }, [currentUser, navigate, showToast]);

    // Load items with stock
    const loadItemsWithStock = async () => {
        setIsRefreshing(true);
        try {
            const items = await getAllItemsWithStock();
            setItemsWithStock(items);
        } catch (error) {
            console.error('Error loading items:', error);
            showToast('Viga esemete laadimisel', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Load items on mount and set up periodic refresh
    useEffect(() => {
        loadItemsWithStock();

        // Refresh stock every 30 seconds
        const interval = setInterval(loadItemsWithStock, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePurchase = async (itemId: string) => {
        const itemData = itemsWithStock.find(i => i.item.id === itemId);
        if (!itemData) return;

        const { item, currentStock, dynamicPrice } = itemData;

        setSelectedItem(item);
        setSelectedItemStock(currentStock);
        setSelectedItemPrice(dynamicPrice);
        setIsPurchaseModalOpen(true);
    };

    const confirmPurchase = async () => {
        if (!selectedItem || !currentUser) return;

        const result = await purchaseItem(currentUser.uid, selectedItem.id);

        if (result.success) {
            showToast(result.message, 'success');
            setIsPurchaseModalOpen(false);
            setSelectedItem(null);

            // Reload items to update stock
            loadItemsWithStock();
        } else {
            showToast(result.message, 'error');
        }
    };

    const cancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedItem(null);
    };

    if (isLoading) {
        return (
            <div className="shop-page">
                <AuthenticatedHeader />
                <div className="shop-container">
                    <div className="loading">Laadin poodi...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-page">
            <AuthenticatedHeader />
            <div className="shop-container">
                <ShopHeader
                    playerMoney={playerMoney}
                    onRefresh={loadItemsWithStock}
                    isRefreshing={isRefreshing}
                />

                <ShopTable
                    items={itemsWithStock}
                    playerMoney={playerMoney}
                    onPurchase={handlePurchase}
                    isLoading={isRefreshing}
                />

                <ShopPurchaseModal
                    item={selectedItem}
                    isOpen={isPurchaseModalOpen}
                    playerMoney={playerMoney}
                    onConfirm={confirmPurchase}
                    onCancel={cancelPurchase}
                />
            </div>
        </div>
    );
};

export default ShopPage;