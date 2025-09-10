// src/components/admin/vehicle-management/modals/EngineModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { VehicleEngine, CreateVehicleEngineData } from '../../../../types/vehicleDatabase';
import { createVehicleEngine, updateVehicleEngine, getAllVehicleBrands } from '../../../../services/VehicleDatabaseService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';

interface EngineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    engine?: VehicleEngine;
}

export const EngineModal: React.FC<EngineModalProps> = ({
                                                            isOpen,
                                                            onClose,
                                                            onSave,
                                                            engine
                                                        }) => {
    const [formData, setFormData] = useState<CreateVehicleEngineData>({
        code: '',
        brandName: '',
        basePower: 100
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const isEditing = !!engine;

    // Load available brands
    useEffect(() => {
        const loadBrands = async () => {
            try {
                const brands = await getAllVehicleBrands();
                setAvailableBrands(brands.map(b => b.name).sort());
            } catch (error) {
                console.error('Failed to load brands:', error);
            }
        };

        if (isOpen) {
            loadBrands();
        }
    }, [isOpen]);

    // Reset form when modal opens/closes or engine changes
    useEffect(() => {
        if (isOpen) {
            if (engine) {
                setFormData({
                    code: engine.code,
                    brandName: engine.brandName,
                    basePower: engine.basePower
                });
            } else {
                setFormData({
                    code: '',
                    brandName: '',
                    basePower: 100
                });
            }
            setErrors({});
        }
    }, [isOpen, engine]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Mootori kood on kohustuslik';
        } else if (formData.code.trim().length < 2) {
            newErrors.code = 'Mootori kood peab olema vähemalt 2 tähemärki';
        } else if (formData.code.trim().length > 20) {
            newErrors.code = 'Mootori kood ei tohi olla pikem kui 20 tähemärki';
        }

        if (!formData.brandName) {
            newErrors.brandName = 'Mark on kohustuslik';
        }

        if (!formData.basePower || formData.basePower < 10) {
            newErrors.basePower = 'Võimsus peab olema vähemalt 10 HP';
        } else if (formData.basePower > 2000) {
            newErrors.basePower = 'Võimsus ei tohi olla üle 2000 HP';
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
                code: formData.code.trim().toUpperCase(),
                brandName: formData.brandName,
                basePower: formData.basePower
            };

            if (isEditing && engine) {
                await updateVehicleEngine(engine.id, cleanData);
                showToast('Mootor uuendatud', 'success');
            } else {
                await createVehicleEngine(cleanData, currentUser.uid);
                showToast('Mootor loodud', 'success');
            }

            onSave();
            onClose();
        } catch (error: any) {
            showToast(`Viga: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: keyof CreateVehicleEngineData, value: string | number) => {
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? `Muuda mootorit: ${engine?.code}` : 'Lisa uus mootor'}
            size="medium"
        >
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label required">
                            Mootori kood
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => handleInputChange('code', e.target.value)}
                            placeholder="nt. M50B25, SR20DET, 2JZ-GE..."
                            maxLength={20}
                            autoFocus
                            style={{ textTransform: 'uppercase' }}
                        />
                        {errors.code && <div className="form-error">{errors.code}</div>}
                        <div className="form-help">
                            Unikaalne mootori tähis (automaatselt suurtähtedeks)
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">
                            Mark
                        </label>
                        <select
                            className="form-select"
                            value={formData.brandName}
                            onChange={(e) => handleInputChange('brandName', e.target.value)}
                        >
                            <option value="">Vali mark...</option>
                            {availableBrands.map(brand => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>
                        {errors.brandName && <div className="form-error">{errors.brandName}</div>}
                        <div className="form-help">
                            Mootori tootja mark
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label required">
                        Baas võimsus (KW)
                    </label>
                    <input
                        type="number"
                        className="form-input"
                        value={formData.basePower}
                        onChange={(e) => handleInputChange('basePower', parseInt(e.target.value) || 0)}
                        min={10}
                        max={2000}
                        placeholder="nt. 150"
                    />
                    {errors.basePower && <div className="form-error">{errors.basePower}</div>}
                    <div className="form-help">
                        Mootori algne võimsus kilovattides (10-2000 KW)
                    </div>
                </div>

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
                        disabled={isSaving || !formData.code.trim() || !formData.brandName}
                    >
                        {isSaving ? 'Salvestan...' : (isEditing ? 'Uuenda' : 'Loo mootor')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};