// src/pages/ShopPage.tsx
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
    clearAllStockCaches // NEW IMPORT
} from '../services/ShopStockService';
import '../styles/pages/Shop.css';

const ITEMS_PER_PAGE = 20;
const REFRESH_INTERVAL = 120000; // CHANGED: From 30 seconds to 120 seconds (2 minutes)

const ShopPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { playerStats, loading: statsLoading, refreshStats } = usePlayerStats();

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
    const [currentPage, setCurrentPage] = useState(1);
    const [stockInitialized, setStockInitialized] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0); // NEW STATE

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

    // Optimized filtering with memoization
    const getFilteredItems = useCallback(() => {
        let filtered = itemsWithStock
            .filter(({ item }) => item.category === activeTab)
            .filter(({ item }) =>
                searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                // Out of stock items go to bottom
                if (a.currentStock === 0 && b.currentStock > 0) return 1;
                if (b.currentStock === 0 && a.currentStock > 0) return -1;
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

    // Initialize shop stock once on first load
    useEffect(() => {
        if (stockInitialized) return;

        const initStock = async () => {
            try {
                await initializeShopStock();
                setStockInitialized(true);
            } catch (error) {
                console.error('Error initializing shop stock:', error);
            }
        };
        initStock();
    }, [stockInitialized]);

    // OPTIMIZED: Load items with smart caching
    const loadItemsWithStock = useCallback(async (forceRefresh: boolean = false) => {
        // NEW: Prevent too frequent refreshes (minimum 5 seconds between refreshes)
        const now = Date.now();
        if (!forceRefresh && now - lastRefreshTime < 5000) {
            console.log('Skipping refresh - too soon');
            return;
        }

        setIsRefreshing(true);
        try {
            // If forcing refresh, clear cache first
            if (forceRefresh) {
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
    }, [showToast, lastRefreshTime]);

    // OPTIMIZED: Smart refresh on mount and periodic updates
    useEffect(() => {
        // Initial load
        loadItemsWithStock(false);

        // CHANGED: Less frequent automatic refresh (2 minutes instead of 30 seconds)
        const interval = setInterval(() => {
            // Only refresh if the page is visible
            if (document.visibilityState === 'visible') {
                loadItemsWithStock(false);
            }
        }, REFRESH_INTERVAL);

        // NEW: Refresh when tab becomes visible after being hidden
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                // Only refresh if it's been more than 30 seconds
                if (timeSinceLastRefresh > 30000) {
                    loadItemsWithStock(false);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
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

            // OPTIMIZED: Force refresh after purchase to show updated stock
            // The cache will be cleared automatically by the purchase
            await Promise.all([
                loadItemsWithStock(true), // Force refresh to get fresh data
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

    // NEW: Manual refresh handler for the refresh button
    const handleManualRefresh = useCallback(async () => {
        await loadItemsWithStock(true); // Force refresh with cache clear
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
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <ShopHeader
                    playerMoney={playerMoney}
                    playerPollid={playerPollid}
                    onRefresh={handleManualRefresh} // CHANGED: Use manual refresh handler
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
};

export default ShopPage;