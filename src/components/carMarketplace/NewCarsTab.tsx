// src/components/carMarketplace/NewCarsTab.tsx
import React, {useState, useMemo, useEffect, useCallback} from 'react';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import CarListItem from './CarListItem';
import { purchaseNewCar } from '../../services/VehicleService';
import {
    getAllVehicleBrands,
    getAllVehicleModels,
    getAllVehicleEngines
} from '../../services/VehicleDatabaseService';
import { VehicleBrand, VehicleModel, VehicleEngine} from "../../types/vehicleDatabase";
import { cacheManager} from "../../services/CacheManager";
import '../../styles/components/carMarketplace/NewCarsTab.css';

// Cache kestus
const MARKETPLACE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutit

interface MarketplaceData {
    brands: VehicleBrand[];
    models: VehicleModel[];
    engines: VehicleEngine[];
}

const NewCarsTab: React.FC = () => {
    const { playerStats, refreshStats } = usePlayerStats();
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // Andmete laadimise state
    const [isLoading, setIsLoading] = useState(true);
    const [brands, setBrands] = useState<VehicleBrand[]>([]);
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [engines, setEngines] = useState<VehicleEngine[]>([]);

    // Filtrite state
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'power' | 'brand'>('price');
    const [isPurchasing, setIsPurchasing] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const loadMarketplaceData = useCallback (async () => {
        try {
            setIsLoading(true);

            const cacheKey = 'new_cars_marketplace_data';

            // Proovi cache'st
            const cachedData = cacheManager.get<MarketplaceData>(
                cacheKey,
                MARKETPLACE_CACHE_DURATION
            );

            if (cachedData) {
                console.log('📦 Using cached marketplace data');
                setBrands(cachedData.brands);
                setModels(cachedData.models);
                setEngines(cachedData.engines);
                setIsLoading(false);
                return;
            }

            // Laadi andmebaasist
            console.log('🔄 Loading fresh marketplace data');
            const [brandsData, modelsData, enginesData] = await Promise.all([
                getAllVehicleBrands(),
                getAllVehicleModels(),
                getAllVehicleEngines()
            ]);

            // Salvesta cache'i
            const dataToCache: MarketplaceData = {
                brands: brandsData,
                models: modelsData,
                engines: enginesData
            };

            cacheManager.set(cacheKey, dataToCache, MARKETPLACE_CACHE_DURATION);

            setBrands(brandsData);
            setModels(modelsData);
            setEngines(enginesData);

        } catch (error: any) {
            console.error('Error loading marketplace data:', error);
            showToast(`Viga andmete laadimisel: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);
    
    useEffect(() => {
        loadMarketplaceData();
    }, [loadMarketplaceData]);

    // FIXED: Rename and fix the pagination logic
    const paginationData = useMemo(() => {
        let filteredList = selectedBrand === 'all'
            ? models
            : models.filter(model => model.brandName === selectedBrand);

        // Sort the list
        const sortedList = filteredList.sort((a, b) => {
            if (sortBy === 'price') {
                return a.basePrice - b.basePrice;
            } else if (sortBy === 'brand') {
                return a.brandName.localeCompare(b.brandName);
            } else if (sortBy === 'power') {
                const engineA = engines.find(e => e.id === a.defaultEngineId);
                const engineB = engines.find(e => e.id === b.defaultEngineId);
                return (engineB?.basePower || 0) - (engineA?.basePower || 0);
            }
            return 0;
        });

        // Calculate pagination
        const totalPages = Math.ceil(sortedList.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedList = sortedList.slice(startIndex, endIndex);

        return {
            items: paginatedList,
            totalItems: sortedList.length,
            totalPages: totalPages
        };
    }, [models, selectedBrand, sortBy, engines, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBrand, sortBy]);

    const handlePurchase = async (model: VehicleModel) => {
        if (!currentUser || !playerStats) {
            showToast('Palun logi sisse', 'error');
            return;
        }

        if (playerStats.money < model.basePrice) {
            showToast('Sul pole piisavalt raha!', 'error');
            return;
        }

        setIsPurchasing(true);
        try {
            const result = await purchaseNewCar(currentUser.uid, model);

            if (result.success) {
                showToast(`Ostsid ${model.brandName} ${model.model}!`, 'success');
                await refreshStats();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error: any) {
            console.error('Purchase failed:', error);
            showToast('Viga auto ostmisel', 'error');
        } finally {
            setIsPurchasing(false);
        }
    };

    // FIXED: Use correct variable name
    const renderPaginationControls = () => {
        const { totalPages } = paginationData;

        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    ««
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ‹
                </button>

                {pages.map(page => (
                    <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                    >
                        {page}
                    </button>
                ))}

                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    ›
                </button>
                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    »»
                </button>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="new-cars-tab">
                <div className="loading-state">
                    <h2>Laadib autosid...</h2>
                    <p>Palun oota, andmed laadivad</p>
                </div>
            </div>
        );
    }

    if (models.length === 0) {
        return (
            <div className="new-cars-tab">
                <div className="empty-state">
                    <h2>Autosid ei ole saadaval</h2>
                    <p>Hetkel pole turule uusi autosid lisatud.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="new-cars-tab">
            <div className="filters-section">
                <div className="filter-group">
                    <label htmlFor="brand-filter">Bränd:</label>
                    <select
                        id="brand-filter"
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Kõik margid</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="sort-filter">Sorteeri:</label>
                    <select
                        id="sort-filter"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="filter-select"
                    >
                        <option value="price">Hinna järgi</option>
                        <option value="power">Võimsuse järgi</option>
                        <option value="brand">Margi järgi</option>
                    </select>
                </div>

                <div className="results-info">
                    <span className="results-count">
                        Kokku {paginationData.totalItems} autot
                        {paginationData.totalPages > 1 && (
                            <span className="page-info">
                                (lehekülg {currentPage}/{paginationData.totalPages})
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Add pagination above table */}
            {renderPaginationControls()}

            <div className="cars-table-container">
                <table className="cars-table">
                    <thead>
                    <tr>
                        <th>Bränd</th>
                        <th>Mudel</th>
                        <th>Mootor</th>
                        <th>Võimsus</th>
                        <th>Mass</th>
                        <th>0-100km/h</th>
                        <th>Hind</th>
                        <th>Tegevus</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* FIXED: Use paginated items */}
                    {paginationData.items.map(model => (
                        <CarListItem
                            key={model.id}
                            model={model}
                            engines={engines}
                            onPurchase={handlePurchase}
                            playerMoney={playerStats?.money || 0}
                            isPurchasing={isPurchasing}
                        />
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Add pagination below table */}
            {renderPaginationControls()}
        </div>
    );
};

export default NewCarsTab;