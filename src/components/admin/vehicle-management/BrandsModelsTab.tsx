// src/components/admin/vehicle-management/BrandsModelsTab.tsx
import React, { useState, useEffect } from 'react';
import { VehicleBrand, VehicleModel, VehicleEngine } from '../../../types/vehicleDatabase';
import {
    getAllVehicleBrands,
    getAllVehicleModels,
    getAllVehicleEngines,
    deleteVehicleBrand,
    deleteVehicleModel
} from '../../../services/VehicleDatabaseService';
import { cacheManager } from '../../../services/CacheManager';
import { useToast } from '../../../contexts/ToastContext';
import { BrandModal } from './modals/BrandModal';
import { ModelModal } from './modals/ModelModal';
import '../../../styles/components/admin/vehicle-management/BrandsModelsTab.css';

interface ExtendedVehicleModel extends VehicleModel {
    defaultEngine?: VehicleEngine;
    compatibleEngineCount: number;
}

interface VehicleCacheData {
    brands: VehicleBrand[];
    models: VehicleModel[];
    engines: VehicleEngine[];
}

const formatDate = (timestamp: any): string => {
    try {
        // If it's a Firestore Timestamp object
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('et-EE');
        }

        // If it's a serialized timestamp object with seconds/nanoseconds
        if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
            const date = new Date(timestamp.seconds * 1000);
            return date.toLocaleDateString('et-EE');
        }

        // If it's already a date string or timestamp number
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

const ITEMS_PER_PAGE = 20;
const VEHICLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const BrandsModelsTab: React.FC = () => {
    const [brands, setBrands] = useState<VehicleBrand[]>([]);
    const [models, setModels] = useState<ExtendedVehicleModel[]>([]);
    const [engines, setEngines] = useState<VehicleEngine[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'brands' | 'models'>('models');
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isFromCache, setIsFromCache] = useState(false);

    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [modelModalOpen, setModelModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<VehicleBrand | undefined>();
    const [editingModel, setEditingModel] = useState<VehicleModel | undefined>();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    // Reset to page 1 when view mode or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, selectedBrand]);

    const loadData = async (forceRefresh: boolean = false) => {
        try {
            setIsLoading(true);
            setIsFromCache(false);

            const cacheKey = 'vehicle_admin_data';

            // Try to get cached data first (unless force refresh)
            if (!forceRefresh) {
                const cachedData = cacheManager.get<VehicleCacheData>(cacheKey, VEHICLE_CACHE_DURATION);
                if (cachedData) {
                    console.log('📦 Using cached vehicle data');
                    await processVehicleData(cachedData.brands, cachedData.models, cachedData.engines);
                    setLastRefresh(new Date());
                    setIsFromCache(true);
                    setIsLoading(false);
                    return;
                }
            }

            // Load fresh data from database
            console.log('🔄 Loading fresh vehicle data from database');
            const [brandsData, modelsData, enginesData] = await Promise.all([
                getAllVehicleBrands(),
                getAllVehicleModels(),
                getAllVehicleEngines()
            ]);

            // Cache the fresh data
            const dataToCache: VehicleCacheData = {
                brands: brandsData,
                models: modelsData,
                engines: enginesData
            };

            cacheManager.set(cacheKey, dataToCache, VEHICLE_CACHE_DURATION);

            await processVehicleData(brandsData, modelsData, enginesData);
            setLastRefresh(new Date());
            setIsFromCache(false);

            if (forceRefresh) {
                showToast('Andmed värskendatud', 'success');
            }

        } catch (error: any) {
            showToast(`Viga andmete laadimisel: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const processVehicleData = async (brandsData: VehicleBrand[], modelsData: VehicleModel[], enginesData: VehicleEngine[]) => {
        setBrands(brandsData);
        setEngines(enginesData);

        // Enhance models with engine data
        const enhancedModels = modelsData.map(model => {
            const defaultEngine = enginesData.find(e => e.id === model.defaultEngineId);
            return {
                ...model,
                defaultEngine,
                compatibleEngineCount: model.compatibleEngineIds.length
            };
        });

        setModels(enhancedModels);
    };

    const handleRefresh = () => {
        loadData(true); // Force refresh
    };

    const handleDeleteBrand = async (brandId: string, brandName: string) => {
        const modelsForBrand = models.filter(m => m.brandId === brandId);

        if (modelsForBrand.length > 0) {
            showToast(`Ei saa kustutada marki "${brandName}" - sellel on ${modelsForBrand.length} mudelit`, 'error');
            return;
        }

        const confirmed = window.confirm(`Kustuta mark "${brandName}"?`);
        if (!confirmed) return;

        try {
            await deleteVehicleBrand(brandId);
            showToast(`Mark "${brandName}" kustutatud`, 'success');

            // Clear vehicle cache and reload to ensure consistency
            cacheManager.clearByPattern('vehicle');
            loadData(true);
        } catch (error: any) {
            showToast(`Viga margi kustutamisel: ${error.message}`, 'error');
        }
    };

    const handleDeleteModel = async (modelId: string, brandName: string, modelName: string) => {
        const confirmed = window.confirm(`Kustuta mudel "${brandName} ${modelName}"?`);
        if (!confirmed) return;

        try {
            await deleteVehicleModel(modelId);
            showToast(`Mudel kustutatud`, 'success');

            // Clear vehicle cache and reload to ensure consistency
            cacheManager.clearByPattern('vehicle');
            loadData(true);
        } catch (error: any) {
            showToast(`Viga mudeli kustutamisel: ${error.message}`, 'error');
        }
    };

    // Get filtered data
    const getFilteredData = () => {
        if (viewMode === 'brands') {
            return brands;
        } else {
            return selectedBrand === 'all'
                ? models
                : models.filter(m => m.brandId === selectedBrand);
        }
    };

    // Calculate pagination
    const filteredData = getFilteredData();
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageData = filteredData.slice(startIndex, endIndex);

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
                    Leht {currentPage} / {totalPages} (kokku {totalItems} kirjet)
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

    if (isLoading) {
        return <div className="loading">Laadimine...</div>;
    }

    const handleAddBrand = () => {
        setEditingBrand(undefined);
        setBrandModalOpen(true);
    };

    const handleEditBrand = (brand: VehicleBrand) => {
        setEditingBrand(brand);
        setBrandModalOpen(true);
    };

    const handleAddModel = () => {
        setEditingModel(undefined);
        setModelModalOpen(true);
    };

    const handleEditModel = (model: ExtendedVehicleModel) => {
        setEditingModel(model);
        setModelModalOpen(true);
    };

    const handleModalSave = () => {
        // Clear cache and reload data
        cacheManager.clearByPattern('vehicle');
        cacheManager.clearByPattern('engine');
        loadData(true);
    };

    return (
        <div className="brands-models-tab">
            {/* Compact Header */}
            <div className="compact-header">
                <div className="view-tabs">
                    <button
                        className={`tab ${viewMode === 'brands' ? 'active' : ''}`}
                        onClick={() => setViewMode('brands')}
                    >
                        Margid ({brands.length})
                    </button>
                    <button
                        className={`tab ${viewMode === 'models' ? 'active' : ''}`}
                        onClick={() => setViewMode('models')}
                    >
                        Mudelid ({models.length})
                    </button>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-add"
                        onClick={viewMode === 'brands' ? handleAddBrand : handleAddModel}
                    >
                        + Lisa {viewMode === 'brands' ? 'Mark' : 'Mudel'}
                    </button>
                    <button
                        className="btn-refresh"
                        onClick={handleRefresh}
                        title={isFromCache ? 'Andmed cache-st (kliki värskendamiseks)' : 'Värskenda andmeid'}
                    >
                        ↻ {isFromCache ? '📦' : ''}
                    </button>
                </div>
            </div>

            {/* Brands Table View */}
            {viewMode === 'brands' && (
                <>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Mark</th>
                                <th>Mudeleid</th>
                                <th>Loodud</th>
                                <th>Toimingud</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(currentPageData as VehicleBrand[]).map(brand => {
                                const brandModels = models.filter(m => m.brandId === brand.id);
                                return (
                                    <tr key={brand.id}>
                                        <td className="brand-name">{brand.name}</td>
                                        <td>{brandModels.length}</td>
                                        <td>{formatDate(brand.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEditBrand(brand)}
                                                    title="Muuda marki"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteBrand(brand.id, brand.name)}
                                                    disabled={brandModels.length > 0}
                                                    title={brandModels.length > 0 ? 'Ei saa kustutada - on mudeleid' : 'Kustuta'}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination />
                </>
            )}

            {/* Models Table View */}
            {viewMode === 'models' && (
                <>
                    {/* Filter */}
                    <div className="filter-bar">
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="brand-select"
                        >
                            <option value="all">Kõik margid</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        <span className="results-count">
                            {totalItems} mudelit
                            {isFromCache && <span className="cache-indicator">📦</span>}
                        </span>
                    </div>

                    {/* Models Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Mark</th>
                                <th>Mudel</th>
                                <th>Mass (kg)</th>
                                <th>Hind ($)</th>
                                <th>Vaikimisi mootor</th>
                                <th>Võimsus (HP)</th>
                                <th>Ühilduvaid</th>
                                <th>Toimingud</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(currentPageData as ExtendedVehicleModel[]).map(model => (
                                <tr key={model.id}>
                                    <td className="brand-name">{model.brandName}</td>
                                    <td className="model-name">{model.model}</td>
                                    <td>{model.mass.toLocaleString()}</td>
                                    <td>{model.basePrice.toLocaleString()}</td>
                                    <td className="engine-code">{model.defaultEngine?.code || 'N/A'}</td>
                                    <td>{model.defaultEngine?.basePower || 'N/A'}</td>
                                    <td>{model.compatibleEngineCount}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEditModel(model)}
                                                title="Muuda mudelit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteModel(model.id, model.brandName, model.model)}
                                                title="Kustuta"
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
                        <div className="no-data">Mudeleid ei leitud</div>
                    )}
                </>
            )}

            {/* Modals */}
            <BrandModal
                isOpen={brandModalOpen}
                onClose={() => setBrandModalOpen(false)}
                onSave={handleModalSave}
                brand={editingBrand}
            />

            <ModelModal
                isOpen={modelModalOpen}
                onClose={() => setModelModalOpen(false)}
                onSave={handleModalSave}
                model={editingModel}
            />
        </div>
    );
};