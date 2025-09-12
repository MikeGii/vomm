// src/components/admin/estate-management/modals/EstateModal.tsx (UPDATED - removed sortOrder)
import React, { useState, useEffect } from 'react';
import { DatabaseEstate, CreateEstateData, EstateFormErrors } from '../../../../types/estateDatabase';
import { createEstate, updateEstate } from '../../../../services/EstateDatabaseService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import '../../../../styles/components/admin/estate-management/modals/EstateModal.css';

interface EstateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    estate?: DatabaseEstate;
}

export const EstateModal: React.FC<EstateModalProps> = ({
                                                            isOpen,
                                                            onClose,
                                                            onSave,
                                                            estate
                                                        }) => {
    // ✅ UPDATED: Removed sortOrder from initial state
    const [formData, setFormData] = useState<CreateEstateData>({
        name: '',
        description: '',
        price: 0,
        hasGarage: false,
        garageCapacity: 0,
        hasWorkshop: false,
        kitchenSpace: 'medium',
        isActive: true
        // sortOrder removed
    });

    const [errors, setErrors] = useState<EstateFormErrors>({});
    const [isSaving, setIsSaving] = useState(false);

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const isEditing = !!estate;

    // ✅ UPDATED: Initialize form data without sortOrder
    useEffect(() => {
        if (estate) {
            setFormData({
                name: estate.name,
                description: estate.description,
                price: estate.price,
                hasGarage: estate.hasGarage,
                garageCapacity: estate.garageCapacity,
                hasWorkshop: estate.hasWorkshop,
                kitchenSpace: estate.kitchenSpace,
                isActive: estate.isActive
                // sortOrder removed
            });
        } else {
            // Reset form for creating new estate
            setFormData({
                name: '',
                description: '',
                price: 0,
                hasGarage: false,
                garageCapacity: 0,
                hasWorkshop: false,
                kitchenSpace: 'medium',
                isActive: true
                // sortOrder removed
            });
        }
        setErrors({});
    }, [estate]);

    // ✅ UPDATED: Form validation without sortOrder
    const validateForm = (): boolean => {
        const newErrors: EstateFormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nimi on kohustuslik';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Nimi peab olema vähemalt 3 tähemärki';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Nimi ei tohi olla pikem kui 100 tähemärki';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Kirjeldus on kohustuslik';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Kirjeldus peab olema vähemalt 10 tähemärki';
        } else if (formData.description.length > 500) {
            newErrors.description = 'Kirjeldus ei tohi olla pikem kui 500 tähemärki';
        }

        if (formData.price <= 0) {
            newErrors.price = 'Hind peab olema positiivne number';
        } else if (formData.price > 10000000) {
            newErrors.price = 'Hind ei tohi olla suurem kui 10,000,000€';
        }

        if (formData.hasGarage) {
            if (formData.garageCapacity < 1) {
                newErrors.garageCapacity = 'Garaaži mahutavus peab olema vähemalt 1';
            } else if (formData.garageCapacity > 50) {
                newErrors.garageCapacity = 'Garaaži mahutavus ei tohi olla suurem kui 50';
            }
        }

        // ✅ REMOVED: sortOrder validation

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission (unchanged)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !currentUser) return;

        setIsSaving(true);

        try {
            let result;
            if (isEditing && estate) {
                result = await updateEstate(estate.id, {
                    ...formData,
                    updatedBy: currentUser.uid
                });
            } else {
                result = await createEstate(formData, currentUser.uid);
            }

            if (result.success) {
                showToast(result.message, 'success');
                onSave();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'Tundmatu viga',
                'error'
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Handle input changes (unchanged)
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked,
                ...(name === 'hasGarage' && !checked ? { garageCapacity: 0 } : {})
            }));
        } else if (type === 'number') {
            const numValue = parseFloat(value) || 0;
            setFormData(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        if (errors[name as keyof EstateFormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <>
            {isOpen && (
                <div className="estate-modal__overlay" onClick={onClose}>
                    <div className="estate-modal__container" onClick={(e) => e.stopPropagation()}>
                        <div className="estate-modal__header">
                            <h2 className="estate-modal__title">
                                {isEditing ? 'Muuda kinnisasja' : 'Lisa uus kinnisvara'}
                            </h2>
                            <button
                                type="button"
                                className="estate-modal__close"
                                onClick={onClose}
                                disabled={isSaving}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="estate-modal">
                            <div className="estate-modal__content">
                                {/* Basic Information */}
                                <div className="estate-modal__section">
                                    <h3 className="estate-modal__section-title">Põhiandmed</h3>

                                    <div className="estate-modal__field">
                                        <label htmlFor="name" className="estate-modal__label">
                                            Nimi *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`estate-modal__input ${errors.name ? 'estate-modal__input--error' : ''}`}
                                            placeholder="Kinnisvara nimi"
                                            disabled={isSaving}
                                        />
                                        {errors.name && (
                                            <span className="estate-modal__error">{errors.name}</span>
                                        )}
                                    </div>

                                    <div className="estate-modal__field">
                                        <label htmlFor="description" className="estate-modal__label">
                                            Kirjeldus *
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className={`estate-modal__textarea ${errors.description ? 'estate-modal__textarea--error' : ''}`}
                                            placeholder="Kinnisvara kirjeldus"
                                            rows={4}
                                            disabled={isSaving}
                                        />
                                        {errors.description && (
                                            <span className="estate-modal__error">{errors.description}</span>
                                        )}
                                    </div>

                                    <div className="estate-modal__field">
                                        <label htmlFor="price" className="estate-modal__label">
                                            Hind (€) *
                                        </label>
                                        <input
                                            type="number"
                                            id="price"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className={`estate-modal__input ${errors.price ? 'estate-modal__input--error' : ''}`}
                                            placeholder="0"
                                            min="1"
                                            max="10000000"
                                            disabled={isSaving}
                                        />
                                        {errors.price && (
                                            <span className="estate-modal__error">{errors.price}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="estate-modal__section">
                                    <h3 className="estate-modal__section-title">Omadused</h3>

                                    <div className="estate-modal__field">
                                        <label className="estate-modal__checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="hasGarage"
                                                checked={formData.hasGarage}
                                                onChange={handleInputChange}
                                                className="estate-modal__checkbox"
                                                disabled={isSaving}
                                            />
                                            <span className="estate-modal__checkbox-text">Garaaž</span>
                                        </label>
                                    </div>

                                    {formData.hasGarage && (
                                        <div className="estate-modal__field">
                                            <label htmlFor="garageCapacity" className="estate-modal__label">
                                                Garaaži mahutavus *
                                            </label>
                                            <input
                                                type="number"
                                                id="garageCapacity"
                                                name="garageCapacity"
                                                value={formData.garageCapacity}
                                                onChange={handleInputChange}
                                                className={`estate-modal__input ${errors.garageCapacity ? 'estate-modal__input--error' : ''}`}
                                                placeholder="1"
                                                min="1"
                                                max="50"
                                                disabled={isSaving}
                                            />
                                            {errors.garageCapacity && (
                                                <span className="estate-modal__error">{errors.garageCapacity}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="estate-modal__field">
                                        <label className="estate-modal__checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="hasWorkshop"
                                                checked={formData.hasWorkshop}
                                                onChange={handleInputChange}
                                                className="estate-modal__checkbox"
                                                disabled={isSaving}
                                            />
                                            <span className="estate-modal__checkbox-text">Töökoda</span>
                                        </label>
                                    </div>

                                    <div className="estate-modal__field">
                                        <label htmlFor="kitchenSpace" className="estate-modal__label">
                                            Köögi suurus
                                        </label>
                                        <select
                                            id="kitchenSpace"
                                            name="kitchenSpace"
                                            value={formData.kitchenSpace}
                                            onChange={handleInputChange}
                                            className="estate-modal__select"
                                            disabled={isSaving}
                                        >
                                            <option value="small">Väike</option>
                                            <option value="medium">Keskmine</option>
                                            <option value="large">Suur</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="estate-modal__section">
                                    <h3 className="estate-modal__section-title">Seaded</h3>

                                    <div className="estate-modal__field">
                                        <label className="estate-modal__checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="estate-modal__checkbox"
                                                disabled={isSaving}
                                            />
                                            <span className="estate-modal__checkbox-text">Aktiivne (mängijatele nähtav)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="estate-modal__footer">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="estate-modal__btn estate-modal__btn--cancel"
                                    disabled={isSaving}
                                >
                                    Tühista
                                </button>
                                <button
                                    type="submit"
                                    className="estate-modal__btn estate-modal__btn--save"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Salvestamine...' : (isEditing ? 'Uuenda' : 'Lisa')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};