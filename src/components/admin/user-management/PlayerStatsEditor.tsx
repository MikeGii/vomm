// src/components/admin/user-management/PlayerStatsEditor.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../../types';
import { useSmartSave } from './hooks/useSmartSave';
import { BasicInfoEditor } from './editors/BasicInfoEditor';
import { PoliceInfoEditor } from './editors/PoliceInfoEditor';
import { GameStatsEditor } from './editors/GameStatsEditor';
import { CoursesHistoryEditor } from './editors/CoursesHistoryEditor';
import { AdminPermissionsEditor } from './editors/AdminPermissionsEditor';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';

interface PlayerStatsEditorProps {
    user: PlayerStats;
    userId: string;
    onUserUpdated: (updatedUser: PlayerStats) => void;
}

export const PlayerStatsEditor: React.FC<PlayerStatsEditorProps> = ({
                                                                        user,
                                                                        userId,
                                                                        onUserUpdated
                                                                    }) => {
    const [editedUser, setEditedUser] = useState<PlayerStats>(user);
    const [globalData, setGlobalData] = useState({ pollid: 0, isVip: false });
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        basic: true,
        police: false,
        game: false,
        courses: false,
        adminPermissions: false
    });

    // Fetch global data
    useEffect(() => {
        const fetchGlobalData = async () => {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setGlobalData({
                    pollid: data.pollid || 0,
                    isVip: data.isVip || false
                });
            }
        };
        fetchGlobalData();
    }, [userId]);

    // Reset edited data when user changes
    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    const { saveChanges, isSaving } = useSmartSave({
        userId,
        onSuccess: onUserUpdated,
        globalData
    });

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const updateField = (path: string, value: any) => {
        setEditedUser(prev => {
            const newUser = { ...prev };
            const keys = path.split('.');
            let current = newUser as any;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newUser;
        });
    };

    // Handler for global fields
    const updateGlobalField = (field: 'pollid' | 'isVip', value: any) => {
        setGlobalData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        await saveChanges(user, editedUser, globalData);
    };

    const resetChanges = () => {
        setEditedUser(user);
    };

    const hasChanges = JSON.stringify(editedUser) !== JSON.stringify(user);

    return (
        <div className="player-stats-editor">
            {/* Save Controls */}
            {hasChanges && (
                <div className="save-controls">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="save-btn"
                    >
                        {isSaving ? 'Salvestame...' : 'Salvesta ainult muudatused'}
                    </button>
                    <button
                        onClick={resetChanges}
                        className="reset-btn"
                    >
                        Tühista muudatused
                    </button>
                    <div className="save-info">
                        💡 Salvestame ainult muudetud väljad - olemasolevad andmed jäävad puutumata
                    </div>
                </div>
            )}

            <div className="editor-sections">
                {/* Basic Information */}
                <BasicInfoEditor
                    user={editedUser}
                    globalData={globalData}  // ADD
                    isOpen={openSections.basic}
                    onToggle={() => toggleSection('basic')}
                    onFieldUpdate={updateField}
                    onGlobalFieldUpdate={updateGlobalField}
                />

                {/* Police Information */}
                <PoliceInfoEditor
                    user={editedUser}
                    isOpen={openSections.police}
                    onToggle={() => toggleSection('police')}
                    onFieldUpdate={updateField}
                />

                {/* Game Statistics */}
                <GameStatsEditor
                    user={editedUser}
                    isOpen={openSections.game}
                    onToggle={() => toggleSection('game')}
                    onFieldUpdate={updateField}
                />

                {/* Courses History */}
                <CoursesHistoryEditor
                    user={editedUser}
                    isOpen={openSections.courses}
                    onToggle={() => toggleSection('courses')}
                    onFieldUpdate={updateField}
                />

                {/* Admin Permissions */}
                <AdminPermissionsEditor
                    user={editedUser}
                    isOpen={openSections.adminPermissions}
                    onToggle={() => toggleSection('adminPermissions')}
                    onFieldUpdate={updateField}
                />
            </div>
        </div>
    );
};