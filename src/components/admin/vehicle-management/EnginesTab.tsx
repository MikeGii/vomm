// src/components/admin/vehicle-management/EnginesTab.tsx
import React, {useState, useEffect, useCallback} from 'react';
import { VehicleEngine, VehicleModel } from '../../../types/vehicleDatabase';
import {
    getAllVehicleEngines,
    getAllVehicleModels,
    deleteVehicleEngine
} from '../../../services/VehicleDatabaseService';
import { cacheManager } from '../../../services/CacheManager';
import { useToast } from '../../../contexts/ToastContext';
import { EngineModal } from './modals/EngineModal';
import '../../../styles/components/admin/vehicle-management/EnginesTab.css';

interface ExtendedVehicleEngine extends VehicleEngine {
    compatibleModels: VehicleModel[];
    usageCount: number;
}

interface EngineCacheData {
    engines: VehicleEngine[];
    models: VehicleModel[];
}

const ITEMS_PER_PAGE = 20;
const ENGINE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function for date formatting (same as BrandsModelsTab)
const formatDate = (timestamp: any): string => {
    try {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('et-EE');
        }

        if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
            const date = new Date(timestamp.seconds * 1000);
            return date.toLocaleDateString('et-EE');
        }

        if (timestamp) {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('et-EE');
            }
        }

        return 'N/A';
    } catch (error) {
        console.warn('Error formatting date:', error);
        return 'N/A';
    }
};

export const EnginesTab: React.FC = () => {
    const [engines, setEngines] = useState<ExtendedVehicleEngine[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isFromCache, setIsFromCache] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [engineModalOpen, setEngineModalOpen] = useState(false);
    const [editingEngine, setEditingEngine] = useState<VehicleEngine | undefined>();

    const { showToast } = useToast();

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBrand]);

    const loadData = useCallback(async (forceRefresh: boolean = false) => {
        try {
            setIsLoading(true);
            setIsFromCache(false);

            const cacheKey = 'engine_admin_data';

            // Try to get cached data first (unless force refresh)
            if (!forceRefresh) {
                const cachedData = cacheManager.get<EngineCacheData>(cacheKey, ENGINE_CACHE_DURATION);
                if (cachedData) {
                    console.log('📦 Using cached engine data');
                    await processEngineData(cachedData.engines, cachedData.models);
                    setIsFromCache(true);
                    setIsLoading(false);
                    return;
                }
            }

            // Load fresh data from database
            console.log('🔄 Loading fresh engine data from database');
            const [enginesData, modelsData] = await Promise.all([
                getAllVehicleEngines(),
                getAllVehicleModels()
            ]);

            // Cache the fresh data
            const dataToCache: EngineCacheData = {
                engines: enginesData,
                models: modelsData
            };

            cacheManager.set(cacheKey, dataToCache, ENGINE_CACHE_DURATION);

            await processEngineData(enginesData, modelsData);
            setIsFromCache(false);

            if (forceRefresh) {
                showToast('Mootori andmed värskendatud', 'success');
            }

        } catch (error: any) {
            showToast(`Viga andmete laadimisel: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const processEngineData = async (enginesData: VehicleEngine[], modelsData: VehicleModel[]) => {
        // Enhance engines with usage data
        const enhancedEngines = enginesData.map(engine => {
            // Find models that use this engine as default or compatible
            const compatibleModels = modelsData.filter(model =>
                model.defaultEngineId === engine.id ||
                model.compatibleEngineIds.includes(engine.id)
            );

            return {
                ...engine,
                compatibleModels,
                usageCount: compatibleModels.length
            };
        });

        // Sort by brand, then by code
        enhancedEngines.sort((a, b) => {
            const brandCompare = a.brandName.localeCompare(b.brandName);
            if (brandCompare !== 0) return brandCompare;
            return a.code.localeCompare(b.code);
        });

        setEngines(enhancedEngines);
    };

    const handleRefresh = () => {
        loadData(true); // Force refresh
    };

    const handleDeleteEngine = async (engineId: string, engineCode: string) => {
        const engine = engines.find(e => e.id === engineId);

        if (engine && engine.usageCount > 0) {
            showToast(`Ei saa kustutada mootorit "${engineCode}" - seda kasutab ${engine.usageCount} mudelit`, 'error');
            return;
        }

        const confirmed = window.confirm(`Kustuta mootor "${engineCode}"?`);
        if (!confirmed) return;

        try {
            await deleteVehicleEngine(engineId);
            showToast(`Mootor "${engineCode}" kustutatud`, 'success');

            // Clear cache and reload to ensure consistency
            cacheManager.clearByPattern('engine');
            loadData(true);
        } catch (error: any) {
            showToast(`Viga mootori kustutamisel: ${error.message}`, 'error');
        }
    };

    // Get filtered data
    const getFilteredEngines = () => {
        if (selectedBrand === 'all') {
            return engines;
        }
        return engines.filter(engine => engine.brandName === selectedBrand);
    };

    // Calculate pagination
    const filteredEngines = getFilteredEngines();
    const totalItems = filteredEngines.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageData = filteredEngines.slice(startIndex, endIndex);

    // Get unique brands for filter
    const uniqueBrands = [...new Set(engines.map(engine => engine.brandName))].sort();

    // Pagination component
    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="pagination">
                <div className="pagination-info">
                    Leht {currentPage} / {totalPages} (kokku {totalItems} mootorit)
                    {isFromCache && <span className="cache-indicator">📦 Cache</span>}
                </div>
                <div className="pagination-controls">
                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="Esimene leht"
                    >
                        ⟪
                    </button>
                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        title="Eelmine leht"
                    >
                        ‹
                    </button>

                    {startPage > 1 && (
                        <>
                            <button className="page-btn" onClick={() => setCurrentPage(1)}>1</button>
                            {startPage > 2 && <span className="page-ellipsis">...</span>}
                        </>
                    )}

                    {pages.map(page => (
                        <button
                            key={page}
                            className={`page-btn ${page === currentPage ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="page-ellipsis">...</span>}
                            <button className="page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                        </>
                    )}

                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        title="Järgmine leht"
                    >
                        ›
                    </button>
                    <button
                        className="page-btn"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Viimane leht"
                    >
                        ⟫
                    </button>
                </div>
            </div>
        );
    };

    const handleAddEngine = () => {
        setEditingEngine(undefined);
        setEngineModalOpen(true);
    };

    const handleEditEngine = (engine: ExtendedVehicleEngine) => {
        setEditingEngine(engine);
        setEngineModalOpen(true);
    };

    const handleModalSave = () => {
        // Clear cache and reload data
        cacheManager.clearByPattern('engine');
        cacheManager.clearByPattern('vehicle');
        loadData(true);
    };

    if (isLoading) {
        return <div className="loading">Laadimine...</div>;
    }

    return (
        <div className="engines-tab">
            {/* Compact Header */}
            <div className="compact-header">
                <div className="header-title">
                    <h3>Mootorid ({engines.length})</h3>
                </div>
                <div className="header-actions">
                    <button className="btn-add" onClick={handleAddEngine}>+ Lisa Mootor</button>                    <button
                        className="btn-refresh"
                        onClick={handleRefresh}
                        title={isFromCache ? 'Andmed cache-st (kliki värskendamiseks)' : 'Värskenda andmeid'}
                    >
                        ↻ {isFromCache ? '📦' : ''}
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="brand-select"
                >
                    <option value="all">Kõik margid</option>
                    {uniqueBrands.map(brand => {
                        const count = engines.filter(e => e.brandName === brand).length;
                        return (
                            <option key={brand} value={brand}>
                                {brand} ({count})
                            </option>
                        );
                    })}
                </select>
                <span className="results-count">
                    {totalItems} mootorit
                    {isFromCache && <span className="cache-indicator">📦</span>}
                </span>
            </div>

            {/* Engines Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Kood</th>
                        <th>Mark</th>
                        <th>Võimsus (KW)</th>
                        <th>Kasutavaid mudeleid</th>
                        <th>Loodud</th>
                        <th>Toimingud</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentPageData.map(engine => (
                        <tr key={engine.id}>
                            <td className="engine-code">{engine.code}</td>
                            <td className="brand-name">{engine.brandName}</td>
                            <td className="power-value">{engine.basePower}</td>
                            <td>
                                <div className="usage-info">
                                    <span className="usage-count">{engine.usageCount}</span>
                                    {engine.usageCount > 0 && (
                                        <div className="model-preview">
                                            {engine.compatibleModels.slice(0, 3).map(model => (
                                                <span key={model.id} className="model-tag">
                                                        {model.brandName} {model.model}
                                                    </span>
                                            ))}
                                            {engine.compatibleModels.length > 3 && (
                                                <span className="more-models">
                                                        +{engine.compatibleModels.length - 3} veel
                                                    </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>{formatDate(engine.createdAt)}</td>
                            <td>
                                <div className="action-buttons">
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditEngine(engine)}
                                        title="Muuda mootorit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteEngine(engine.id, engine.code)}
                                        disabled={engine.usageCount > 0}
                                        title={engine.usageCount > 0 ? 'Ei saa kustutada - mootor on kasutusel' : 'Kustuta'}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Pagination />

            {totalItems === 0 && (
                <div className="no-data">Mootoreid ei leitud</div>
            )}

            {/* Modal */}
            <EngineModal
                isOpen={engineModalOpen}
                onClose={() => setEngineModalOpen(false)}
                onSave={handleModalSave}
                engine={editingEngine}
            />
        </div>
    );
};