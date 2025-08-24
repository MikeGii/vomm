// src/components/admin/ShopManagement.tsx - Highly Optimized Version
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShopItem } from '../../types/shop';
import {
    getAllItemsWithStock,
    clearAllStockCaches
} from '../../services/ShopStockService';
import {
    updateShopItemStock,
    setShopItemMaxStock
} from '../../services/AdminShopService';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/admin/ShopManagement.css';

interface ItemWithStock {
    item: ShopItem;
    currentStock: number;
    dynamicPrice: number;
}

const ITEMS_PER_PAGE = 10;

export const ShopManagement: React.FC = () => {
    const [items, setItems] = useState<ItemWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingItem, setUpdatingItem] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [editValues, setEditValues] = useState<{
        maxStock: number;
        currentStock: number;
    }>({ maxStock: 0, currentStock: 0 });
    const { showToast } = useToast();

    // Memoized filtered items for performance
    const filteredItems = useMemo(() => {
        let filtered = items;

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.item.name.toLowerCase().includes(term) ||
                item.item.category.toLowerCase().includes(term) ||
                item.item.description.toLowerCase().includes(term)
            );
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.item.category === categoryFilter);
        }

        return filtered;
    }, [items, searchTerm, categoryFilter]);

    // Memoized pagination
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentItems = filteredItems.slice(startIndex, endIndex);

        return { totalPages, currentItems, startIndex, endIndex };
    }, [filteredItems, currentPage]);

    // Get unique categories for filter
    const categories = useMemo(() => {
        const cats = new Set(items.map(item => item.item.category));
        return Array.from(cats).sort();
    }, [items]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter]);

    // Load shop data
    const loadShopData = useCallback(async () => {
        try {
            setLoading(true);
            const itemsWithStock = await getAllItemsWithStock();
            setItems(itemsWithStock);
        } catch (error) {
            console.error('Error loading shop data:', error);
            showToast('Viga poe andmete laadimisel', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadShopData();
    }, [loadShopData]);

    // Optimized local state update instead of full reload
    const updateItemInState = useCallback((itemId: string, updates: Partial<ItemWithStock>) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.item.id === itemId
                    ? { ...item, ...updates }
                    : item
            )
        );
    }, []);

    const startEditing = useCallback((item: ItemWithStock) => {
        setEditingItem(item.item.id);
        setEditValues({
            maxStock: item.item.maxStock,
            currentStock: item.currentStock
        });
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingItem(null);
        setEditValues({ maxStock: 0, currentStock: 0 });
    }, []);

    // Optimized save with local state update
    const saveChanges = useCallback(async (itemId: string) => {
        try {
            setUpdatingItem(itemId);

            // Update database
            await Promise.all([
                setShopItemMaxStock(itemId, editValues.maxStock),
                updateShopItemStock(itemId, editValues.currentStock)
            ]);

            // Update local state instead of full reload
            updateItemInState(itemId, {
                currentStock: editValues.currentStock,
                item: {
                    ...items.find(i => i.item.id === itemId)!.item,
                    maxStock: editValues.maxStock
                }
            });

            showToast('Ese edukalt uuendatud!', 'success');
            setEditingItem(null);

            // Clear cache for future loads (but don't reload now)
            setTimeout(() => clearAllStockCaches(), 1000);
        } catch (error: any) {
            console.error('Error updating item:', error);
            showToast(error.message || 'Viga ese uuendamisel', 'error');
        } finally {
            setUpdatingItem(null);
        }
    }, [editValues, updateItemInState, items, showToast]);

    const refillToMax = useCallback(async (itemId: string, maxStock: number) => {
        try {
            setUpdatingItem(itemId);
            await updateShopItemStock(itemId, maxStock);

            // Update local state
            updateItemInState(itemId, { currentStock: maxStock });

            showToast('Ladu täidetud!', 'success');
            setTimeout(() => clearAllStockCaches(), 1000);
        } catch (error: any) {
            console.error('Error refilling stock:', error);
            showToast(error.message || 'Viga lao täitmisel', 'error');
        } finally {
            setUpdatingItem(null);
        }
    }, [updateItemInState, showToast]);

    const refreshAllData = useCallback(async () => {
        await clearAllStockCaches();
        await loadShopData();
        showToast('Andmed värskendatud!', 'info');
    }, [loadShopData, showToast]);

    // Debounced search to avoid excessive filtering
    const debouncedSearch = useMemo(() => {
        const timeoutId = setTimeout(() => {
            // This effect handles the search automatically through useMemo
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        return debouncedSearch;
    }, [debouncedSearch]);

    if (loading) {
        return (
            <div className="shop-management">
                <h2>Poe haldus</h2>
                <div className="loading-state">Laadin poe andmeid...</div>
            </div>
        );
    }

    return (
        <div className="shop-management">
            <div className="shop-management-header">
                <h2>Poe haldus</h2>
                <div className="header-actions">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="category-filter"
                    >
                        <option value="all">Kõik kategooriad</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Otsi esemeid..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button
                        className="refresh-btn"
                        onClick={refreshAllData}
                    >
                        Värskenda
                    </button>
                </div>
            </div>

            <div className="shop-stats">
                <span>Kokku: {filteredItems.length} ese(t)</span>
                <span>Kuvan: {paginationData.currentItems.length} ese(t)</span>
                <span>Lehekülg: {currentPage} / {paginationData.totalPages}</span>
            </div>

            <div className="shop-table-container">
                <table className="shop-admin-table">
                    <thead>
                    <tr>
                        <th>Ese</th>
                        <th>Kategooria</th>
                        <th>Hind</th>
                        <th>Ladu</th>
                        <th>Max</th>
                        <th>Toimingud</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginationData.currentItems.map((itemData) => {
                        const isEditing = editingItem === itemData.item.id;
                        const isUpdating = updatingItem === itemData.item.id;

                        return (
                            <tr key={itemData.item.id} className={isUpdating ? 'updating' : ''}>
                                <td>
                                    <div className="item-info">
                                        <strong>{itemData.item.name}</strong>
                                        <small>{itemData.item.description}</small>
                                    </div>
                                </td>
                                <td>
                                        <span className={`category-tag ${itemData.item.category}`}>
                                            {itemData.item.category}
                                        </span>
                                </td>
                                <td>
                                        <span className={`price ${itemData.item.currency === 'pollid' ? 'pollid' : ''}`}>
                                            {itemData.item.currency === 'pollid'
                                                ? `${itemData.item.pollidPrice} P`
                                                : `${itemData.dynamicPrice}€`
                                            }
                                        </span>
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editValues.currentStock}
                                            onChange={(e) => setEditValues(prev => ({
                                                ...prev,
                                                currentStock: parseInt(e.target.value) || 0
                                            }))}
                                            className="stock-input"
                                        />
                                    ) : (
                                        <span className={`stock-display ${
                                            itemData.currentStock === 0 ? 'out-of-stock' :
                                                itemData.currentStock < itemData.item.maxStock * 0.2 ? 'low-stock' : ''
                                        }`}>
                                                {itemData.currentStock}
                                            </span>
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editValues.maxStock}
                                            onChange={(e) => setEditValues(prev => ({
                                                ...prev,
                                                maxStock: parseInt(e.target.value) || 0
                                            }))}
                                            className="stock-input"
                                        />
                                    ) : (
                                        itemData.item.maxStock
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    className="save-btn"
                                                    onClick={() => saveChanges(itemData.item.id)}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? '⏳' : '✓'}
                                                </button>
                                                <button
                                                    className="cancel-btn"
                                                    onClick={cancelEditing}
                                                    disabled={isUpdating}
                                                >
                                                    ✗
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => startEditing(itemData)}
                                                    disabled={isUpdating}
                                                >
                                                    ✏️
                                                </button>
                                                {itemData.item.maxStock > 0 && (
                                                    <button
                                                        className="refill-btn"
                                                        onClick={() => refillToMax(itemData.item.id, itemData.item.maxStock)}
                                                        disabled={isUpdating || itemData.currentStock >= itemData.item.maxStock}
                                                        title="Täida ladu maksimumini"
                                                    >
                                                        {isUpdating ? '⏳' : '🔄'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Optimized Pagination */}
            {paginationData.totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                    >
                        ⟪
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        ‹
                    </button>

                    <div className="pagination-info">
                        {currentPage} / {paginationData.totalPages}
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
                        disabled={currentPage === paginationData.totalPages}
                    >
                        ›
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(paginationData.totalPages)}
                        disabled={currentPage === paginationData.totalPages}
                    >
                        ⟫
                    </button>
                </div>
            )}
        </div>
    );
};