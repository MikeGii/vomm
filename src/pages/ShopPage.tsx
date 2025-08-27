// src/pages/ShopPage.tsx - UPDATED FOR HYBRID SYSTEM
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ShopHeader } from '../components/shop/ShopHeader';
import { ShopTable } from '../components/shop/ShopTable';
import { ShopPurchaseModal } from '../components/shop/ShopPurchaseModal';
import { ShopItem } from '../types/shop';
import { purchaseItem } from '../services/ShopService';
import { TabNavigation } from '../components/ui/TabNavigation';
import { SHOP_CATEGORIES } from '../types/shop';
import {
    initializeShopStock,
    getAllItemsWithStock,
    clearAllStockCaches
} from '../services/ShopStockService';
import '../styles/pages/Shop.css';

const ITEMS_PER_PAGE = 20;
const REFRESH_INTERVAL = 300000; // 5 minutes - longer since most items are unlimited now

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading: statsLoading, refreshStats } = usePlayerStats();

    // Updated state structure for hybrid system
    const [itemsWithStock, setItemsWithStock] = useState<Array<{
        item: any;
        currentStock: number;
        staticPrice: number;
        hasUnlimitedStock: boolean;
    }>>([]);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [selectedItemStock, setSelectedItemStock] = useState(0);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('crafting');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [stockInitialized, setStockInitialized] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

    // Get money values from playerStats
    const playerMoney = playerStats?.money || 0;
    const playerPollid = playerStats?.pollid || 0;

    // Create tabs from SHOP_CATEGORIES
    const tabs = [
        { id: 'crafting', label: SHOP_CATEGORIES.crafting.name },
        { id: 'trainingBooster', label: SHOP_CATEGORIES.trainingBooster.name },
        { id: 'medical', label: SHOP_CATEGORIES.medical.name },
        { id: 'protection', label: SHOP_CATEGORIES.protection.name },
        { id: 'vip', label: SHOP_CATEGORIES.vip.name }
    ];

    // Reset to page 1 when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    // Optimized filtering with memoization for hybrid system
    const getFilteredItems = useCallback(() => {
        let filtered = itemsWithStock
            .filter(({ item }) => item.category === activeTab)
            .filter(({ item }) =>
                searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Sort by stock availability: unlimited first, then by stock amount, then alphabetically
                if (a.hasUnlimitedStock && !b.hasUnlimitedStock) return -1;
                if (!a.hasUnlimitedStock && b.hasUnlimitedStock) return 1;

                // If both have limited stock, sort by availability
                if (!a.hasUnlimitedStock && !b.hasUnlimitedStock) {
                    if (a.currentStock === 0 && b.currentStock > 0) return 1;
                    if (b.currentStock === 0 && a.currentStock > 0) return -1;
                }

                // Alphabetical sorting for items with same stock status
                return a.item.name.localeCompare(b.item.name, 'et');
            });

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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Initialize shop stock once on first load (only for player-craftable items)
    useEffect(() => {
        if (stockInitialized) return;

        const initStock = async () => {
            try {
                await initializeShopStock();
                setStockInitialized(true);
            } catch (error) {
                console.error('Error initializing shop stock:', error);
                showToast('Viga poe seadistamisel', 'error');
            }
        };

        initStock();
    }, [stockInitialized, showToast]);

    // Load items with stock - updated for hybrid system
    const loadItemsWithStock = useCallback(async (forceRefresh = false) => {
        if (!stockInitialized && !forceRefresh) return;

        const now = Date.now();
        // Skip if last refresh was less than 10 seconds ago (unless forced)
        if (!forceRefresh && now - lastRefreshTime < 10000) {
            return;
        }

        try {
            if (forceRefresh) {
                setIsRefreshing(true);
                clearAllStockCaches();
            }

            const items = await getAllItemsWithStock();
            setItemsWithStock(items);
            setLastRefreshTime(now);
        } catch (error) {
            console.error('Error loading items:', error);
            showToast('Viga esemete laadimisel', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [stockInitialized, lastRefreshTime, showToast]);

    // Initial load
    useEffect(() => {
        if (stockInitialized) {
            loadItemsWithStock();
        }
    }, [stockInitialized, loadItemsWithStock]);

    // Automatic refresh - reduced frequency since most items are unlimited
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadItemsWithStock(true);
            }
        };

        if (stockInitialized) {
            // Set up interval for automatic refresh (less frequent now)
            interval = setInterval(() => {
                loadItemsWithStock();
            }, REFRESH_INTERVAL);

            // Refresh when tab becomes visible
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadItemsWithStock, lastRefreshTime]);

    const handlePurchase = async (itemId: string) => {
        const itemData = itemsWithStock.find(i => i.item.id === itemId);
        if (!itemData) return;

        const { item, currentStock } = itemData;
        setSelectedItem(item);
        setSelectedItemStock(currentStock);
        setIsPurchaseModalOpen(true);
    };

    const confirmPurchase = async (quantity: number) => {
        if (!selectedItem || !currentUser) return;

        const result = await purchaseItem(currentUser.uid, selectedItem.id, quantity);

        if (result.success) {
            showToast(result.message, 'success');
            setIsPurchaseModalOpen(false);
            setSelectedItem(null);
            setSelectedItemStock(0);

            // Force refresh after purchase to show updated stock (only affects player-craftable items)
            await Promise.all([
                loadItemsWithStock(true),
                refreshStats()
            ]);
        } else {
            showToast(result.message, 'error');
        }
    };

    const cancelPurchase = () => {
        setIsPurchaseModalOpen(false);
        setSelectedItem(null);
        setSelectedItemStock(0);
    };

    // Manual refresh handler
    const handleManualRefresh = useCallback(async () => {
        await loadItemsWithStock(true);
    }, [loadItemsWithStock]);

    // Combined loading state
    if (isLoading || statsLoading) {
        return (
            <div className="shop-page">
                <AuthenticatedHeader />
                <div className="shop-container">
                    <div className="loading">Laadin poodi...</div>
                </div>
            </div>
        );
    }

    // Redirect if not logged in
    if (!currentUser) {
        navigate('/login');
        return null;
    }

    return (
        <div className="shop-page">
            <AuthenticatedHeader />
            <div className="shop-container">
                <ShopHeader
                    playerMoney={playerMoney}
                    playerPollid={playerPollid}
                    onRefresh={handleManualRefresh}
                    isRefreshing={isRefreshing}
                />

                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="shop-controls">
                    <input
                        type="text"
                        placeholder="Otsi esemeid..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
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

                {isPurchaseModalOpen && selectedItem && (
                    <ShopPurchaseModal
                        item={selectedItem}
                        currentStock={selectedItemStock}
                        playerMoney={playerMoney}
                        playerPollid={playerPollid}
                        onConfirm={confirmPurchase}
                        onCancel={cancelPurchase}
                        isLoading={false}
                    />
                )}
            </div>
        </div>
    );
};

export default ShopPage;