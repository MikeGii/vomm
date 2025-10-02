// src/components/admin/user-management/editors/BasicInfoEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';

interface BasicInfoEditorProps {
    user: PlayerStats;
    globalData: {
        pollid: number;
        isVip: boolean;
    };
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
    onGlobalFieldUpdate: (field: 'pollid' | 'isVip', value: any) => void;
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
                                                                    user,
                                                                    globalData,
                                                                    isOpen,
                                                                    onToggle,
                                                                    onFieldUpdate,
                                                                    onGlobalFieldUpdate
                                                                }) => {
    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Põhiandmed</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="field-row">
                        <label>Kasutajanimi:</label>
                        <input
                            type="text"
                            value={user.username || ''}
                            onChange={(e) => onFieldUpdate('username', e.target.value)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Tase:</label>
                        <input
                            type="number"
                            value={user.level || 1}
                            onChange={(e) => onFieldUpdate('level', parseInt(e.target.value) || 1)}
                            min="1"
                            max="999"
                        />
                    </div>

                    <div className="field-row">
                        <label>Kogemus:</label>
                        <input
                            type="number"
                            value={user.experience || 0}
                            onChange={(e) => onFieldUpdate('experience', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>Raha:</label>
                        <input
                            type="number"
                            value={user.money || 0}
                            onChange={(e) => onFieldUpdate('money', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>Pollid:</label>
                        <input
                            type="number"
                            value={globalData.pollid}
                            onChange={(e) => onGlobalFieldUpdate('pollid', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>Maine:</label>
                        <input
                            type="number"
                            value={user.reputation || 0}
                            onChange={(e) => onFieldUpdate('reputation', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>VIP staatus:</label>
                        <input
                            type="checkbox"
                            checked={globalData.isVip}
                            onChange={(e) => onGlobalFieldUpdate('isVip', e.target.checked)}
                        />
                    </div>

                    <div className="field-row">
                        <label>Peida edetabelist:</label>
                        <input
                            type="checkbox"
                            checked={user.excludeFromLeaderboard || false}
                            onChange={(e) => onFieldUpdate('excludeFromLeaderboard', e.target.checked)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};