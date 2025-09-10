// src/components/admin/vehicle-management/modals/BrandModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../ui/Modal';
import { VehicleBrand, CreateVehicleBrandData } from '../../../../types/vehicleDatabase';
import { createVehicleBrand, updateVehicleBrand } from '../../../../services/VehicleDatabaseService';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';

interface BrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    brand?: VehicleBrand; // If provided, we're editing; if not, we're creating
}

export const BrandModal: React.FC<BrandModalProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          onSave,
                                                          brand
                                                      }) => {
    const [formData, setFormData] = useState<CreateVehicleBrandData>({
        name: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const isEditing = !!brand;

    // Reset form when modal opens/closes or brand changes
    useEffect(() => {
        if (isOpen) {
            if (brand) {
                setFormData({
                    name: brand.name
                });
            } else {
                setFormData({
                    name: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, brand]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Margi nimi on kohustuslik';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Margi nimi peab olema vähemalt 2 tähemärki';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'Margi nimi ei tohi olla pikem kui 50 tähemärki';
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
                name: formData.name.trim()
            };

            if (isEditing && brand) {
                await updateVehicleBrand(brand.id, cleanData);
                showToast('Mark uuendatud', 'success');
            } else {
                await createVehicleBrand(cleanData, currentUser.uid);
                showToast('Mark loodud', 'success');
            }

            onSave();
            onClose();
        } catch (error: any) {
            showToast(`Viga: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: keyof CreateVehicleBrandData, value: string) => {
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
            title={isEditing ? `Muuda marki: ${brand?.name}` : 'Lisa uus mark'}
            size="small"
        >
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                    <label className="form-label required">
                        Margi nimi
                    </label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="nt. BMW, Toyota, Ford..."
                        maxLength={50}
                        autoFocus
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                    <div className="form-help">
                        Sisesta auto margi nimi. See peab olema unikaalne.
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
                        disabled={isSaving || !formData.name.trim()}
                    >
                        {isSaving ? 'Salvestan...' : (isEditing ? 'Uuenda' : 'Loo mark')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};