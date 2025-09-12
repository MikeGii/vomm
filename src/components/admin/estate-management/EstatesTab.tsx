// src/components/admin/estate-management/EstatesTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllEstatesForAdmin, deleteEstate, toggleEstateStatus } from '../../../services/EstateDatabaseService';
import { DatabaseEstate } from '../../../types/estateDatabase';
import { EstateModal } from './modals/EstateModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/admin/estate-management/EstatesTab.css';

export const EstatesTab: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [estates, setEstates] = useState<DatabaseEstate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEstate, setEditingEstate] = useState<DatabaseEstate | undefined>();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Load estates from database
    const loadEstates = useCallback(async () => {
        setIsLoading(true);
        try {
            const estatesData = await getAllEstatesForAdmin();
            setEstates(estatesData);
        } catch (error) {
            console.error('Error loading estates:', error);
            showToast('Viga kinnisvarade laadimisel', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadEstates();
    }, [loadEstates]);

    // Handle create/edit
    const handleAddEstate = () => {
        setEditingEstate(undefined);
        setModalOpen(true);
    };

    const handleEditEstate = (estate: DatabaseEstate) => {
        setEditingEstate(estate);
        setModalOpen(true);
    };

    // Handle delete
    const handleDeleteEstate = async (estate: DatabaseEstate) => {
        if (!window.confirm(`Kas oled kindel, et soovid kustutada kinnisvara "${estate.name}"?`)) {
            return;
        }

        setIsUpdating(estate.id);
        try {
            const result = await deleteEstate(estate.id);
            if (result.success) {
                showToast(result.message, 'success');
                await loadEstates();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga kinnisvara kustutamisel', 'error');
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle status toggle
    const handleToggleStatus = async (estate: DatabaseEstate) => {
        if (!currentUser) return;

        setIsUpdating(estate.id);
        try {
            const result = await toggleEstateStatus(estate.id, !estate.isActive, currentUser.uid);
            if (result.success) {
                showToast(result.message, 'success');
                await loadEstates();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Viga staatuse muutmisel', 'error');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleModalSave = () => {
        loadEstates();
        setModalOpen(false);
    };

    // Pagination logic
    const totalPages = Math.ceil(estates.length / itemsPerPage);
    const paginatedEstates = estates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isLoading) {
        return <div className="estates-tab__loading">Laadimine...</div>;
    }

    return (
        <div className="estates-tab">
            {/* Header */}
            <div className="estates-tab__header">
                <div className="estates-tab__header-title">
                    <h3>Kinnisvarad ({estates.length})</h3>
                    <p>Halda kinnisvarasid ja nende omadusi</p>
                </div>
                <div className="estates-tab__header-actions">
                    <button
                        className="estates-tab__btn estates-tab__btn--add"
                        onClick={handleAddEstate}
                        disabled={isLoading}
                    >
                        + Lisa kinnisvara
                    </button>
                    <button
                        className="estates-tab__btn estates-tab__btn--refresh"
                        onClick={loadEstates}
                        disabled={isLoading}
                    >
                        🔄 Värskenda
                    </button>
                </div>
            </div>

            {/* Estates Table */}
            {estates.length === 0 ? (
                <div className="estates-tab__no-data">
                    <h3>Kinnisvarasid ei leitud</h3>
                    <p>Alusta esimese kinnisvara loomisega</p>
                </div>
            ) : (
                <>
                    <div className="estates-tab__table-container">
                        <table className="estates-tab__table">
                            <thead>
                            <tr>
                                <th>Staatus</th>
                                <th>Nimi</th>
                                <th>Hind</th>
                                <th>Garaaž</th>
                                <th>Töökoda</th>
                                <th>Köök</th>
                                <th>Loodud</th>
                                <th>Toimingud</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedEstates.map(estate => (
                                <tr key={estate.id} className={!estate.isActive ? 'estates-tab__row--inactive' : ''}>
                                    <td>
                                        <button
                                            className={`estates-tab__status-toggle ${estate.isActive ? 'estates-tab__status-toggle--active' : 'estates-tab__status-toggle--inactive'}`}
                                            onClick={() => handleToggleStatus(estate)}
                                            disabled={isUpdating === estate.id}
                                            title={estate.isActive ? 'Deaktiveeri' : 'Aktiveeri'}
                                        >
                                            {isUpdating === estate.id ? '⏳' : (estate.isActive ? '✅' : '❌')}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="estates-tab__name-cell">
                                            <span className="estates-tab__name">{estate.name}</span>
                                            <span className="estates-tab__id">ID: {estate.id}</span>
                                        </div>
                                    </td>
                                    <td className="estates-tab__price-cell">€{estate.price.toLocaleString()}</td>
                                    <td>
                                            <span className={`estates-tab__feature-badge ${estate.hasGarage ? 'estates-tab__feature-badge--active' : 'estates-tab__feature-badge--inactive'}`}>
                                                {estate.hasGarage ? `🚗 ${estate.garageCapacity}` : '❌'}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`estates-tab__feature-badge ${estate.hasWorkshop ? 'estates-tab__feature-badge--active' : 'estates-tab__feature-badge--inactive'}`}>
                                                {estate.hasWorkshop ? '🔧' : '❌'}
                                            </span>
                                    </td>
                                    <td>
                                            <span className="estates-tab__kitchen-badge">
                                                🍳 {estate.kitchenSpace === 'small' ? 'S' : estate.kitchenSpace === 'medium' ? 'M' : 'L'}
                                            </span>
                                    </td>
                                    <td className="estates-tab__date-cell">
                                        {estate.createdAt.toLocaleDateString('et-EE')}
                                    </td>
                                    <td>
                                        <div className="estates-tab__actions">
                                            <button
                                                className="estates-tab__btn estates-tab__btn--edit"
                                                onClick={() => handleEditEstate(estate)}
                                                disabled={isUpdating === estate.id}
                                                title="Muuda"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="estates-tab__btn estates-tab__btn--delete"
                                                onClick={() => handleDeleteEstate(estate)}
                                                disabled={isUpdating === estate.id}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="estates-tab__pagination">
                            <div className="estates-tab__pagination-info">
                                Lehekülg {currentPage} / {totalPages} (kokku {estates.length} kinnisasja)
                            </div>
                            <div className="estates-tab__pagination-controls">
                                <button
                                    className="estates-tab__page-btn"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    ⟪
                                </button>
                                <button
                                    className="estates-tab__page-btn"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    return (
                                        <button
                                            key={page}
                                            className={`estates-tab__page-btn ${currentPage === page ? 'estates-tab__page-btn--active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    className="estates-tab__page-btn"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                                <button
                                    className="estates-tab__page-btn"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    ⟫
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Estate Modal */}
            {modalOpen && (
                <EstateModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleModalSave}
                    estate={editingEstate}
                />
            )}
        </div>
    );
};