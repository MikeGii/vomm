// src/components/admin/user-management/PlayerStatsEditor.tsx
import React, { useState, useCallback } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { PlayerStats } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';

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
    const { showToast } = useToast();
    const [editedUser, setEditedUser] = useState<PlayerStats>(user);
    const [isSaving, setIsSaving] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        basic: true,
        police: false,
        game: false,
        training: false,
        work: false,
        inventory: false,
        health: false
    });

    const toggleSection = (sectionId: string) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const updateField = useCallback((path: string, value: any) => {
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
    }, []);

    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const userRef = doc(firestore, 'playerStats', userId);
            await updateDoc(userRef, {
                ...editedUser,
                lastModified: Timestamp.now()
            });

            onUserUpdated(editedUser);
            showToast('Kasutaja andmed salvestatud', 'success');
        } catch (error) {
            console.error('Error saving user data:', error);
            showToast('Viga andmete salvestamisel', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const resetChanges = () => {
        setEditedUser(user);
        showToast('Muudatused tühistatud', 'info');
    };

    const hasChanges = JSON.stringify(editedUser) !== JSON.stringify(user);

    return (
        <div className="player-stats-editor">
            {hasChanges && (
                <div className="save-controls">
                    <button
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="save-btn"
                    >
                        {isSaving ? 'Salvestame...' : 'Salvesta muudatused'}
                    </button>
                    <button
                        onClick={resetChanges}
                        className="reset-btn"
                    >
                        Tühista muudatused
                    </button>
                </div>
            )}

            <div className="editor-sections">
                {/* Basic Information Section */}
                <div className="editor-section">
                    <button
                        className="section-header"
                        onClick={() => toggleSection('basic')}
                    >
                        <span>Põhiandmed</span>
                        <span className={`section-toggle ${openSections.basic ? 'open' : ''}`}>▼</span>
                    </button>

                    {openSections.basic && (
                        <div className="section-content">
                            <div className="field-row">
                                <label>Kasutajanimi:</label>
                                <input
                                    type="text"
                                    value={editedUser.username || ''}
                                    onChange={(e) => updateField('username', e.target.value)}
                                />
                            </div>

                            <div className="field-row">
                                <label>Tase:</label>
                                <input
                                    type="number"
                                    value={editedUser.level || 1}
                                    onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                                    min="1"
                                    max="999"
                                />
                            </div>

                            <div className="field-row">
                                <label>Kogemus:</label>
                                <input
                                    type="number"
                                    value={editedUser.experience || 0}
                                    onChange={(e) => updateField('experience', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Raha:</label>
                                <input
                                    type="number"
                                    value={editedUser.money || 0}
                                    onChange={(e) => updateField('money', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Pollid:</label>
                                <input
                                    type="number"
                                    value={editedUser.pollid || 0}
                                    onChange={(e) => updateField('pollid', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Maine:</label>
                                <input
                                    type="number"
                                    value={editedUser.reputation || 0}
                                    onChange={(e) => updateField('reputation', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>VIP staatus:</label>
                                <input
                                    type="checkbox"
                                    checked={editedUser.isVip || false}
                                    onChange={(e) => updateField('isVip', e.target.checked)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Police Information Section */}
                <div className="editor-section">
                    <button
                        className="section-header"
                        onClick={() => toggleSection('police')}
                    >
                        <span>Politseiandmed</span>
                        <span className={`section-toggle ${openSections.police ? 'open' : ''}`}>▼</span>
                    </button>

                    {openSections.police && (
                        <div className="section-content">
                            <div className="field-row">
                                <label>Auaste:</label>
                                <select
                                    value={editedUser.rank || ''}
                                    onChange={(e) => updateField('rank', e.target.value || null)}
                                >
                                    <option value="">Auaste puudub</option>
                                    <option value="inspektor">Inspektor</option>
                                    <option value="vaneminspektor">Vaneminspektor</option>
                                    <option value="üleminspektor">Üleminspektor</option>
                                    <option value="komissar">Komissar</option>
                                    <option value="vanemkomissar">Vanemkomissar</option>
                                </select>
                            </div>

                            <div className="field-row">
                                <label>Märgikood:</label>
                                <input
                                    type="text"
                                    value={editedUser.badgeNumber || ''}
                                    onChange={(e) => updateField('badgeNumber', e.target.value || null)}
                                />
                            </div>

                            <div className="field-row">
                                <label>Positsioon:</label>
                                <select
                                    value={editedUser.policePosition || ''}
                                    onChange={(e) => updateField('policePosition', e.target.value || null)}
                                >
                                    <option value="">Positsioon puudub</option>
                                    <option value="abipolitseinik">Abipolitseinik</option>
                                    <option value="kadett">Kadett</option>
                                    <option value="patrullpolitseinik">Patrullpolitseinik</option>
                                    <option value="uurija">Uurija</option>
                                    <option value="kiirreageerija">Kiirreageerija</option>
                                    <option value="koerajuht">Koerajuht</option>
                                    <option value="küberkriminalist">Küberkriminalist</option>
                                    <option value="jälitaja">Jälitaja</option>
                                    <option value="grupijuht_patrol">Grupijuht (Patrull)</option>
                                    <option value="grupijuht_investigation">Grupijuht (Uurimine)</option>
                                    <option value="grupijuht_emergency">Grupijuht (Kiirreageerimine)</option>
                                    <option value="grupijuht_k9">Grupijuht (K9)</option>
                                    <option value="grupijuht_cyber">Grupijuht (Küber)</option>
                                    <option value="grupijuht_crimes">Grupijuht (Kuriteod)</option>
                                    <option value="talituse_juht">Talituse juht</option>
                                </select>
                            </div>

                            <div className="field-row">
                                <label>Maakond:</label>
                                <input
                                    type="text"
                                    value={editedUser.prefecture || ''}
                                    onChange={(e) => updateField('prefecture', e.target.value || null)}
                                />
                            </div>

                            <div className="field-row">
                                <label>Osakond:</label>
                                <input
                                    type="text"
                                    value={editedUser.department || ''}
                                    onChange={(e) => updateField('department', e.target.value || null)}
                                />
                            </div>

                            <div className="field-row">
                                <label>Üksus:</label>
                                <input
                                    type="text"
                                    value={editedUser.departmentUnit || ''}
                                    onChange={(e) => updateField('departmentUnit', e.target.value || null)}
                                />
                            </div>

                            <div className="field-row">
                                <label>Tööl:</label>
                                <input
                                    type="checkbox"
                                    checked={editedUser.isEmployed || false}
                                    onChange={(e) => updateField('isEmployed', e.target.checked)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Game Statistics Section */}
                <div className="editor-section">
                    <button
                        className="section-header"
                        onClick={() => toggleSection('game')}
                    >
                        <span>Mängustatistika</span>
                        <span className={`section-toggle ${openSections.game ? 'open' : ''}`}>▼</span>
                    </button>

                    {openSections.game && (
                        <div className="section-content">
                            <div className="field-row">
                                <label>Lahendatud juhtumeid:</label>
                                <input
                                    type="number"
                                    value={editedUser.casesCompleted || 0}
                                    onChange={(e) => updateField('casesCompleted', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Vahistatud kurjategijaid:</label>
                                <input
                                    type="number"
                                    value={editedUser.criminalsArrested || 0}
                                    onChange={(e) => updateField('criminalsArrested', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Töötatud tunde:</label>
                                <input
                                    type="number"
                                    value={editedUser.totalWorkedHours || 0}
                                    onChange={(e) => updateField('totalWorkedHours', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Training Clicks Section */}
                <div className="editor-section">
                    <button
                        className="section-header"
                        onClick={() => toggleSection('training')}
                    >
                        <span>Treening & Treeningklikid</span>
                        <span className={`section-toggle ${openSections.training ? 'open' : ''}`}>▼</span>
                    </button>

                    {openSections.training && (
                        <div className="section-content">
                            <div className="field-group">
                                <h4>Sporditreening</h4>
                                <div className="field-row">
                                    <label>Järelejäänud klikke:</label>
                                    <input
                                        type="number"
                                        value={editedUser.trainingData?.remainingClicks || 0}
                                        onChange={(e) => updateField('trainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max={editedUser.isVip ? (editedUser.activeWork ? 30 : 100) : (editedUser.activeWork ? 10 : 50)}
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <h4>Köök & Labor</h4>
                                <div className="field-row">
                                    <label>Järelejäänud klikke:</label>
                                    <input
                                        type="number"
                                        value={editedUser.kitchenLabTrainingData?.remainingClicks || 0}
                                        onChange={(e) => updateField('kitchenLabTrainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max={editedUser.isVip ? (editedUser.activeWork ? 30 : 100) : (editedUser.activeWork ? 10 : 50)}
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <h4>Käsitöö</h4>
                                <div className="field-row">
                                    <label>Järelejäänud klikke:</label>
                                    <input
                                        type="number"
                                        value={editedUser.handicraftTrainingData?.remainingClicks || 0}
                                        onChange={(e) => updateField('handicraftTrainingData.remainingClicks', parseInt(e.target.value) || 0)}
                                        min="0"
                                        max={editedUser.isVip ? (editedUser.activeWork ? 30 : 100) : (editedUser.activeWork ? 10 : 50)}
                                    />
                                </div>
                            </div>

                            <div className="info-note">
                                VIP maks: {editedUser.isVip ? (editedUser.activeWork ? '30' : '100') : (editedUser.activeWork ? '10' : '50')} klikki
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};