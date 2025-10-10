// src/components/admin/user-management/hooks/useSmartSave.ts
import { useState, useCallback } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../../config/firebase';
import { PlayerStats } from '../../../../types';
import { useToast } from '../../../../contexts/ToastContext';
import { getChangedFields, convertToFirestoreUpdate, validateChanges } from '../utils/dataUpdateUtils';

interface UseSmartSaveOptions {
    userId: string;
    onSuccess?: (updatedData: PlayerStats) => void;
    globalData?: { pollid: number; isVip: boolean };
}

export const useSmartSave = ({ userId, onSuccess, globalData }: UseSmartSaveOptions) => {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const saveChanges = useCallback(async (
        originalData: PlayerStats,
        editedData: PlayerStats,
        updatedGlobalData?: { pollid: number; isVip: boolean }
    ) => {
        setIsSaving(true);

        try {
            // Get only changed fields for playerStats
            const changes = getChangedFields(originalData, editedData);

            // Check for global data changes
            const globalChanges: any = {};
            if (updatedGlobalData && globalData) {
                if (updatedGlobalData.pollid !== globalData.pollid) {
                    globalChanges.pollid = updatedGlobalData.pollid;
                }
                if (updatedGlobalData.isVip !== globalData.isVip) {
                    globalChanges.isVip = updatedGlobalData.isVip;
                }
            }

            // If no changes at all, don't update
            if (Object.keys(changes).length === 0 && Object.keys(globalChanges).length === 0) {
                showToast('Muudatusi ei tuvastatud', 'info');
                setIsSaving(false);
                return { success: true, message: 'No changes' };
            }

            // Validate playerStats changes
            if (Object.keys(changes).length > 0) {
                const validation = validateChanges(changes);
                if (!validation.valid) {
                    showToast(`Valideerimise viga: ${validation.errors.join(', ')}`, 'error');
                    setIsSaving(false);
                    return { success: false, errors: validation.errors };
                }
            }

            // Save playerStats changes if any
            if (Object.keys(changes).length > 0) {
                const updateData = convertToFirestoreUpdate(changes);
                updateData.lastModified = Timestamp.now();
                updateData.lastModifiedBy = 'admin';

                console.log('Updating playerStats fields:', updateData);
                const statsRef = doc(firestore, 'playerStats', userId);
                await updateDoc(statsRef, updateData);
            }

            // Save global data changes if any
            if (Object.keys(globalChanges).length > 0) {
                console.log('Updating global user fields:', globalChanges);
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, globalChanges);
            }

            // Call success callback
            onSuccess?.(editedData);

            // Create combined success message
            const allChangedFields = [
                ...Object.keys(changes),
                ...Object.keys(globalChanges)
            ];

            showToast(
                `Salvestatud ${allChangedFields.length} muudatust: ${allChangedFields.slice(0, 3).join(', ')}${allChangedFields.length > 3 ? '...' : ''}`,
                'success'
            );

            return { success: true, changedFields: allChangedFields };

        } catch (error) {
            console.error('Error saving changes:', error);
            showToast('Viga andmete salvestamisel', 'error');
            return { success: false, error };
        } finally {
            setIsSaving(false);
        }
    }, [userId, onSuccess, showToast, globalData]);

    return {
        saveChanges,
        isSaving
    };
};