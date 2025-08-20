// src/pages/ShopPage.tsx - Updated with pagination
import React, { useState, useEffect, useCallback } from 'react';
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
import { TabNavigation } from '../components/ui/TabNavigation';
import { SHOP_CATEGORIES } from '../types/shop';
import {
    initializeShopStock,
    getAllItemsWithStock
} from '../services/ShopStockService';
import '../styles/pages/Shop.css';

const ITEMS_PER_PAGE = 10; // Add pagination constant

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const {currentUser} = useAuth();
    const {showToast} = useToast();

    const [playerMoney, setPlayerMoney] = useState(0);
    const [playerPollid, setPlayerPollid] = useState(0);
    const [itemsWithStock, setItemsWithStock] = useState<Array<{
        item: any;
        currentStock: number;
        dynamicPrice: number;
    }>>([]);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [selectedItemStock, setSelectedItemStock] = useState(0);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('crafting');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1); // Add pagination state

    // Create tabs from SHOP_CATEGORIES
    const tabs = [
        { id: 'crafting', label: SHOP_CATEGORIES.crafting.name },
        { id: 'trainingBooster', label: SHOP_CATEGORIES.trainingBooster.name },
        { id: 'medical', label: SHOP_CATEGORIES.medical.name },
        { id: 'protection', label: SHOP_CATEGORIES.protection.name },
        { id: 'vip', label: SHOP_CATEGORIES.vip.name }
    ];

    // Reset to page 1 when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Update filteredItems to use pagination
    const getFilteredItems = useCallback(() => {
        let filtered = itemsWithStock
            .filter(({ item }) => item.category === activeTab)
            .filter(({ item }) =>
                searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort(({ item: a, currentStock: stockA }, { item: b, currentStock: stockB }) => {
                // Out of stock items go to bottom
                if (stockA === 0 && stockB > 0) return 1;
                if (stockB === 0 && stockA > 0) return -1;

                // Alphabetical sorting for items with same stock status
                return a.name.localeCompare(b.name, 'et');
            });

        // Calculate pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        return {
            items: paginatedItems,
            totalPages,
            totalItems
        };
    }, [itemsWithStock, activeTab, searchQuery, currentPage]);

    const { items: filteredItems, totalPages } = getFilteredItems();

    // Add page change handler
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

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
                    setPlayerPollid(stats.pollid || 0);
                }
            },
            (error) => {
                console.error('Error fetching player stats:', error);
                showToast('Viga andmete laadimisel', 'error');
            }
        );

        return () => unsubscribe();
    }, [currentUser, navigate, showToast]);

    // Load items with stock - wrapped in useCallback
    const loadItemsWithStock = useCallback(async () => {
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
    }, [showToast]);

    // Load items on mount and set up periodic refresh
    useEffect(() => {
        loadItemsWithStock();

        // Refresh stock every 30 seconds
        const interval = setInterval(loadItemsWithStock, 30000);
        return () => clearInterval(interval);
    }, [loadItemsWithStock]);

    const handlePurchase = async (itemId: string) => {
        const itemData = itemsWithStock.find(i => i.item.id === itemId);
        if (!itemData) return;

        const {item, currentStock} = itemData;

        setSelectedItem(item);
        setSelectedItemStock(currentStock);
        setIsPurchaseModalOpen(true);
    };

    const confirmPurchase = async (quantity: number) => {
        if (!selectedItem || !currentUser) return;

        // Update the purchaseItem call to include quantity
        const result = await purchaseItem(currentUser.uid, selectedItem.id, quantity);

        if (result.success) {
            showToast(result.message, 'success');
            setIsPurchaseModalOpen(false);
            setSelectedItem(null);
            setSelectedItemStock(0);

            // Reload items to update stock
            loadItemsWithStock();
        } else {
            showToast(result.message, 'error');
        }
    };

    const cancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedItem(null);
        setSelectedItemStock(0);
    };

    if (isLoading) {
        return (
            <div className="shop-page">
                <AuthenticatedHeader/>
                <div className="shop-container">
                    <div className="loading">Laadin poodi...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-page">
            <AuthenticatedHeader/>
            <div className="shop-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <ShopHeader
                    playerMoney={playerMoney}
                    playerPollid={playerPollid}
                    onRefresh={loadItemsWithStock}
                    isRefreshing={isRefreshing}
                />

                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Otsi esemeid..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="clear-search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <ShopTable
                    items={filteredItems}
                    playerMoney={playerMoney}
                    playerPollid={playerPollid}
                    onPurchase={handlePurchase}
                    isLoading={isRefreshing}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <ShopPurchaseModal
                    item={selectedItem}
                    isOpen={isPurchaseModalOpen}
                    playerMoney={playerMoney}
                    playerPollid={playerPollid}
                    currentStock={selectedItemStock}
                    onConfirm={confirmPurchase}
                    onCancel={cancelPurchase}
                />
            </div>
        </div>
    );
}

export default ShopPage;