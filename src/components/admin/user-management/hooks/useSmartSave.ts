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
}

export const useSmartSave = ({ userId, onSuccess }: UseSmartSaveOptions) => {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const saveChanges = useCallback(async (originalData: PlayerStats, editedData: PlayerStats) => {
        setIsSaving(true);

        try {
            // Get only changed fields
            const changes = getChangedFields(originalData, editedData);

            // If no changes, don't update
            if (Object.keys(changes).length === 0) {
                showToast('Muudatusi ei tuvastatud', 'info');
                setIsSaving(false);
                return { success: true, message: 'No changes' };
            }

            // Validate changes
            const validation = validateChanges(changes);
            if (!validation.valid) {
                showToast(`Valideerimise viga: ${validation.errors.join(', ')}`, 'error');
                setIsSaving(false);
                return { success: false, errors: validation.errors };
            }

            // Convert to Firestore update format
            const updateData = convertToFirestoreUpdate(changes);

            // Add metadata
            updateData.lastModified = Timestamp.now();
            updateData.lastModifiedBy = 'admin'; // You can pass admin info here

            console.log('Updating only changed fields:', updateData);

            // Perform the update
            const userRef = doc(firestore, 'playerStats', userId);
            await updateDoc(userRef, updateData);

            // Call success callback with the edited data
            onSuccess?.(editedData);

            const changedFieldNames = Object.keys(changes);
            showToast(
                `Salvestatud ${changedFieldNames.length} muudatust: ${changedFieldNames.slice(0, 3).join(', ')}${changedFieldNames.length > 3 ? '...' : ''}`,
                'success'
            );

            return { success: true, changedFields: changedFieldNames };

        } catch (error) {
            console.error('Error saving changes:', error);
            showToast('Viga andmete salvestamisel', 'error');
            return { success: false, error };
        } finally {
            setIsSaving(false);
        }
    }, [userId, onSuccess, showToast]);

    return {
        saveChanges,
        isSaving
    };
};