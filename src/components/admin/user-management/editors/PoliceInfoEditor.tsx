// src/components/admin/user-management/editors/PoliceInfoEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';

interface PoliceInfoEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const PoliceInfoEditor: React.FC<PoliceInfoEditorProps> = ({
                                                                      user,
                                                                      isOpen,
                                                                      onToggle,
                                                                      onFieldUpdate
                                                                  }) => {
    const ranks = [
        { value: '', label: 'Auaste puudub' },
        // Standard progression ranks
        { value: 'nooreminspektor', label: 'Nooreminspektor' },
        { value: 'inspektor', label: 'Inspektor' },
        { value: 'vaneminspektor', label: 'Vaneminspektor' },
        { value: 'üleminspektor', label: 'Üleminspektor' },
        { value: 'komissar', label: 'Komissar' },
        { value: 'vanemkomissar', label: 'Vanemkomissar' },
        // Leadership ranks
        { value: 'politseileitnant', label: 'Politseileitnant' },
        { value: 'politseikapten', label: 'Politseikapten' },
        { value: 'politseimajor', label: 'Politseimajor' },
        { value: 'politseikolonelleitnant', label: 'Politseikolonelleitnant' }
    ];

    const positions = [
        { value: '', label: 'Positsioon puudub' },
        { value: 'abipolitseinik', label: 'Abipolitseinik' },
        { value: 'kadett', label: 'Kadett' },
        { value: 'patrullpolitseinik', label: 'Patrullpolitseinik' },
        { value: 'uurija', label: 'Uurija' },
        { value: 'kiirreageerija', label: 'Kiirreageerija' },
        { value: 'koerajuht', label: 'Koerajuht' },
        { value: 'küberkriminalist', label: 'Küberkriminalist' },
        { value: 'jälitaja', label: 'Jälitaja' },
        { value: 'grupijuht_patrol', label: 'Grupijuht (Patrull)' },
        { value: 'grupijuht_investigation', label: 'Grupijuht (Uurimine)' },
        { value: 'grupijuht_emergency', label: 'Grupijuht (Kiirreageerimine)' },
        { value: 'grupijuht_k9', label: 'Grupijuht (K9)' },
        { value: 'grupijuht_cyber', label: 'Grupijuht (Küber)' },
        { value: 'grupijuht_crimes', label: 'Grupijuht (Kuriteod)' },
        { value: 'talituse_juht_patrol', label: 'Talituse juht (Patrull)' },
        { value: 'talituse_juht_investigation', label: 'Talituse juht (Uurimine)' },
        { value: 'talituse_juht_emergency', label: 'Talituse juht (Kiirreageerimine)' },
        { value: 'talituse_juht_k9', label: 'Talituse juht (K9)' },
        { value: 'talituse_juht_cyber', label: 'Talituse juht (Küber)' },
        { value: 'talituse_juht_crimes', label: 'Talituse juht (Kuriteod)' }
    ];

    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Politseiandmed</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="field-row">
                        <label>Auaste:</label>
                        <select
                            value={user.rank || ''}
                            onChange={(e) => onFieldUpdate('rank', e.target.value || null)}
                        >
                            {ranks.map(rank => (
                                <option key={rank.value} value={rank.value}>
                                    {rank.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field-row">
                        <label>Märginumber:</label>
                        <input
                            type="text"
                            value={user.badgeNumber || ''}
                            onChange={(e) => onFieldUpdate('badgeNumber', e.target.value || null)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Positsioon:</label>
                        <select
                            value={user.policePosition || ''}
                            onChange={(e) => onFieldUpdate('policePosition', e.target.value || null)}
                        >
                            {positions.map(position => (
                                <option key={position.value} value={position.value}>
                                    {position.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field-row">
                        <label>Maakond:</label>
                        <input
                            type="text"
                            value={user.prefecture || ''}
                            onChange={(e) => onFieldUpdate('prefecture', e.target.value || null)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Osakond:</label>
                        <input
                            type="text"
                            value={user.department || ''}
                            onChange={(e) => onFieldUpdate('department', e.target.value || null)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Üksus:</label>
                        <input
                            type="text"
                            value={user.departmentUnit || ''}
                            onChange={(e) => onFieldUpdate('departmentUnit', e.target.value || null)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Tööl:</label>
                        <input
                            type="checkbox"
                            checked={user.isEmployed || false}
                            onChange={(e) => onFieldUpdate('isEmployed', e.target.checked)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};