// src/components/admin/vehicle-management/modals/ModelModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import {
    VehicleModel,
    VehicleBrand,
    VehicleEngine,
    CreateVehicleModelData
} from '../../../../types/vehicleDatabase';
import {
    createVehicleModel,
    updateVehicleModel,
    getAllVehicleBrands,
    getAllVehicleEngines
} from '../../../../services/VehicleDatabaseService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';

interface ModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    model?: VehicleModel;
}

export const ModelModal: React.FC<ModelModalProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          onSave,
                                                          model
                                                      }) => {
    const [formData, setFormData] = useState<CreateVehicleModelData>({
        brandId: '',
        model: '',
        mass: 1000,
        basePrice: 5000,
        basePollidPrice: undefined,
        currency: 'money',
        defaultEngineId: '',
        compatibleEngineIds: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [availableBrands, setAvailableBrands] = useState<VehicleBrand[]>([]);
    const [availableEngines, setAvailableEngines] = useState<VehicleEngine[]>([]);
    const [filteredEngines, setFilteredEngines] = useState<VehicleEngine[]>([]);

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const isEditing = !!model;

    // Load available brands and engines
    useEffect(() => {
        const loadData = async () => {
            try {
                const [brands, engines] = await Promise.all([
                    getAllVehicleBrands(),
                    getAllVehicleEngines()
                ]);
                setAvailableBrands(brands.sort((a, b) => a.name.localeCompare(b.name)));
                setAvailableEngines(engines.sort((a, b) => a.code.localeCompare(b.code)));
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };

        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    // Filter engines based on selected brand
    useEffect(() => {
        if (formData.brandId && availableBrands.length > 0) {
            const selectedBrand = availableBrands.find(b => b.id === formData.brandId);
            if (selectedBrand) {
                const brandEngines = availableEngines.filter(e => e.brandName === selectedBrand.name);
                setFilteredEngines(brandEngines);

                // Clear default engine if it's not compatible with new brand
                if (formData.defaultEngineId) {
                    const isDefaultEngineValid = brandEngines.some(e => e.id === formData.defaultEngineId);
                    if (!isDefaultEngineValid) {
                        setFormData(prev => ({
                            ...prev,
                            defaultEngineId: '',
                            compatibleEngineIds: prev.compatibleEngineIds.filter(id =>
                                brandEngines.some(e => e.id === id)
                            )
                        }));
                    }
                }
            }
        } else {
            setFilteredEngines([]);
        }
    }, [formData.brandId, availableBrands, availableEngines, formData.defaultEngineId]);

    // Reset form when modal opens/closes or model changes
    useEffect(() => {
        if (isOpen) {
            if (model) {
                setFormData({
                    brandId: model.brandId,
                    model: model.model,
                    mass: model.mass,
                    basePrice: model.basePrice,
                    basePollidPrice: model.basePollidPrice,
                    currency: model.currency,
                    defaultEngineId: model.defaultEngineId,
                    compatibleEngineIds: [...model.compatibleEngineIds]
                });
            } else {
                setFormData({
                    brandId: '',
                    model: '',
                    mass: 1000,
                    basePrice: 5000,
                    basePollidPrice: undefined,
                    currency: 'money',
                    defaultEngineId: '',
                    compatibleEngineIds: []
                });
            }
            setErrors({});
        }
    }, [isOpen, model]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.brandId) {
            newErrors.brandId = 'Mark on kohustuslik';
        }

        if (!formData.model.trim()) {
            newErrors.model = 'Mudeli nimi on kohustuslik';
        } else if (formData.model.trim().length < 2) {
            newErrors.model = 'Mudeli nimi peab olema vähemalt 2 tähemärki';
        } else if (formData.model.trim().length > 100) {
            newErrors.model = 'Mudeli nimi ei tohi olla pikem kui 100 tähemärki';
        }

        if (!formData.mass || formData.mass < 500) {
            newErrors.mass = 'Mass peab olema vähemalt 500 kg';
        } else if (formData.mass > 10000) {
            newErrors.mass = 'Mass ei tohi olla üle 10000 kg';
        }

        if (formData.currency === 'pollid') {
            if (!formData.basePollidPrice || formData.basePollidPrice < 1) {
                newErrors.basePollidPrice = 'Pollid hind peab olema vähemalt 1';
            } else if (formData.basePollidPrice > 2000) {
                newErrors.basePollidPrice = 'Pollid hind ei tohi olla üle 2000';
            }
        }

        if (formData.currency === 'money') {
            if (!formData.basePrice || formData.basePrice < 100) {
                newErrors.basePrice = 'Hind peab olema vähemalt €100';
            } else if (formData.basePrice > 10000000) {
                newErrors.basePrice = 'Hind ei tohi olla üle €10,000,000';
            }
        }

        if (!formData.defaultEngineId) {
            newErrors.defaultEngineId = 'Vaikimisi mootor on kohustuslik';
        }

        if (formData.compatibleEngineIds.length === 0) {
            newErrors.compatibleEngineIds = 'Vähemalt üks ühilduv mootor on kohustuslik';
        }

        // Ensure default engine is in compatible engines
        if (formData.defaultEngineId && !formData.compatibleEngineIds.includes(formData.defaultEngineId)) {
            newErrors.defaultEngineId = 'Vaikimisi mootor peab olema ühilduvate mootoritega nimekirjas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !currentUser) return;

        setIsSaving(true);

        try {
            const cleanData = {
                brandId: formData.brandId,
                model: formData.model.trim(),
                mass: formData.mass,
                basePrice: formData.basePrice,
                basePollidPrice: formData.basePollidPrice,
                currency: formData.currency,
                defaultEngineId: formData.defaultEngineId,
                compatibleEngineIds: formData.compatibleEngineIds
            };

            if (isEditing && model) {
                await updateVehicleModel(model.id, cleanData);
                showToast('Mudel uuendatud', 'success');
            } else {
                await createVehicleModel(cleanData, currentUser.uid);
                showToast('Mudel loodud', 'success');
            }

            onSave();
            onClose();
        } catch (error: any) {
            showToast(`Viga: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: keyof CreateVehicleModelData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleEngineToggle = (engineId: string, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                compatibleEngineIds: [...prev.compatibleEngineIds, engineId]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                compatibleEngineIds: prev.compatibleEngineIds.filter(id => id !== engineId),
                // Clear default engine if it's being unchecked
                defaultEngineId: prev.defaultEngineId === engineId ? '' : prev.defaultEngineId
            }));
        }
    };

    const selectedBrand = availableBrands.find(b => b.id === formData.brandId);
    const selectedCompatibleEngines = filteredEngines.filter(e =>
        formData.compatibleEngineIds.includes(e.id)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? `Muuda mudelit: ${model?.brandName} ${model?.model}` : 'Lisa uus mudel'}
            size="large"
        >
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label required">
                            Mark
                        </label>
                        <select
                            className="form-select"
                            value={formData.brandId}
                            onChange={(e) => handleInputChange('brandId', e.target.value)}
                        >
                            <option value="">Vali mark...</option>
                            {availableBrands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                        {errors.brandId && <div className="form-error">{errors.brandId}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label required">
                            Mudeli nimi
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.model}
                            onChange={(e) => handleInputChange('model', e.target.value)}
                            placeholder="nt. E36 318i, Corolla AE86, 200SX S13..."
                            maxLength={100}
                        />
                        {errors.model && <div className="form-error">{errors.model}</div>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label required">
                            Mass (kg)
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.mass}
                            onChange={(e) => handleInputChange('mass', parseInt(e.target.value) || 0)}
                            min={500}
                            max={10000}
                            placeholder="nt. 1200"
                        />
                        {errors.mass && <div className="form-error">{errors.mass}</div>}
                        <div className="form-help">Auto mass kilogrammides</div>
                    </div>

                    {/* Currency selection */}
                    <div className="form-group">
                        <label className="form-label required">
                            Valuuta
                        </label>
                        <select
                            className="form-select"
                            value={formData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value as 'money' | 'pollid')}
                        >
                            <option value="money">Raha (€)</option>
                            <option value="pollid">Pollid (💎)</option>
                        </select>
                        <div className="form-help">Millises valuutas auto müüakse</div>
                    </div>
                </div>

                <div className="form-row">
                    {/* Money price field - show when currency is money */}
                    {formData.currency === 'money' && (
                        <div className="form-group">
                            <label className="form-label required">
                                Hind (€)
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.basePrice}
                                onChange={(e) => handleInputChange('basePrice', parseInt(e.target.value) || 0)}
                                min={100}
                                max={10000000}
                                placeholder="nt. 15000"
                            />
                            {errors.basePrice && <div className="form-error">{errors.basePrice}</div>}
                            <div className="form-help">Auto hind eurodes</div>
                        </div>
                    )}

                    {/* Pollid price field - show when currency is pollid */}
                    {formData.currency === 'pollid' && (
                        <div className="form-group">
                            <label className="form-label required">
                                Pollid hind (💎)
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.basePollidPrice || ''}
                                onChange={(e) => handleInputChange('basePollidPrice', parseInt(e.target.value) || undefined)}
                                min={1}
                                max={2000}
                                placeholder="nt. 50"
                            />
                            {errors.basePollidPrice && <div className="form-error">{errors.basePollidPrice}</div>}
                            <div className="form-help">Auto hind pollidites (100 pollid = 1M€ tuunimiseks)</div>
                        </div>
                    )}
                </div>

                {selectedBrand && (
                    <>
                        <div className="form-group">
                            <label className="form-label required">
                                Ühilduvad mootorid ({selectedBrand.name})
                            </label>
                            {filteredEngines.length > 0 ? (
                                <div className="multi-select">
                                    {filteredEngines.map(engine => (
                                        <div key={engine.id} className="multi-select-item">
                                            <input
                                                type="checkbox"
                                                id={`engine-${engine.id}`}
                                                checked={formData.compatibleEngineIds.includes(engine.id)}
                                                onChange={(e) => handleEngineToggle(engine.id, e.target.checked)}
                                            />
                                            <label htmlFor={`engine-${engine.id}`}>
                                                {engine.code} ({engine.basePower} KW)
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="form-help">
                                    Valitud margil pole mootoreid. Lisa esmalt {selectedBrand.name} mootoreid.
                                </div>
                            )}
                            {errors.compatibleEngineIds && <div className="form-error">{errors.compatibleEngineIds}</div>}

                            {selectedCompatibleEngines.length > 0 && (
                                <div className="selected-items">
                                    {selectedCompatibleEngines.map(engine => (
                                        <div key={engine.id} className="selected-item">
                                            {engine.code} ({engine.basePower}KW)
                                            <button
                                                type="button"
                                                onClick={() => handleEngineToggle(engine.id, false)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">
                                Vaikimisi mootor
                            </label>
                            <select
                                className="form-select"
                                value={formData.defaultEngineId}
                                onChange={(e) => handleInputChange('defaultEngineId', e.target.value)}
                                disabled={formData.compatibleEngineIds.length === 0}
                            >
                                <option value="">Vali vaikimisi mootor...</option>
                                {selectedCompatibleEngines.map(engine => (
                                    <option key={engine.id} value={engine.id}>
                                        {engine.code} ({engine.basePower} KW)
                                    </option>
                                ))}
                            </select>
                            {errors.defaultEngineId && <div className="form-error">{errors.defaultEngineId}</div>}
                            <div className="form-help">
                                Mootor, millega auto vaikimisi tuleb (peab olema ühilduvate mootoritega nimekirjas)
                            </div>
                        </div>
                    </>
                )}

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-modal btn-modal-cancel"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Tühista
                    </button>
                    <button
                        type="submit"
                        className="btn-modal btn-modal-save"
                        disabled={isSaving || !formData.brandId || !formData.model.trim()}
                    >
                        {isSaving ? 'Salvestan...' : (isEditing ? 'Uuenda' : 'Loo mudel')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};