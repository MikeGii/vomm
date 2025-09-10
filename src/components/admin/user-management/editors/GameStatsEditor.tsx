// src/components/admin/user-management/editors/GameStatsEditor.tsx
import React from 'react';
import { PlayerStats } from '../../../../types';

interface GameStatsEditorProps {
    user: PlayerStats;
    isOpen: boolean;
    onToggle: () => void;
    onFieldUpdate: (path: string, value: any) => void;
}

export const GameStatsEditor: React.FC<GameStatsEditorProps> = ({
                                                                    user,
                                                                    isOpen,
                                                                    onToggle,
                                                                    onFieldUpdate
                                                                }) => {
    return (
        <div className="editor-section">
            <button className="section-header" onClick={onToggle}>
                <span>Mängustatistika</span>
                <span className={`section-toggle ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="section-content">
                    <div className="field-row">
                        <label>Lahendatud juhtumeid:</label>
                        <input
                            type="number"
                            value={user.casesCompleted || 0}
                            onChange={(e) => onFieldUpdate('casesCompleted', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>Vahistatud kurjategijaid:</label>
                        <input
                            type="number"
                            value={user.criminalsArrested || 0}
                            onChange={(e) => onFieldUpdate('criminalsArrested', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    <div className="field-row">
                        <label>Töötatud tunde:</label>
                        <input
                            type="number"
                            value={user.totalWorkedHours || 0}
                            onChange={(e) => onFieldUpdate('totalWorkedHours', parseInt(e.target.value) || 0)}
                            min="0"
                        />
                    </div>

                    {/* Fight Club Stats */}
                    {user.fightClubStats && (
                        <>
                            <h4 className="subsection-title">Võitlusklubi statistika</h4>
                            <div className="field-row">
                                <label>Võite:</label>
                                <input
                                    type="number"
                                    value={user.fightClubStats.wins || 0}
                                    onChange={(e) => onFieldUpdate('fightClubStats.wins', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Kaotusi:</label>
                                <input
                                    type="number"
                                    value={user.fightClubStats.losses || 0}
                                    onChange={(e) => onFieldUpdate('fightClubStats.losses', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Kokku võideldi:</label>
                                <input
                                    type="number"
                                    value={user.fightClubStats.totalFights || 0}
                                    onChange={(e) => onFieldUpdate('fightClubStats.totalFights', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>

                            <div className="field-row">
                                <label>Raha võidetud:</label>
                                <input
                                    type="number"
                                    value={user.fightClubStats.totalMoneyWon || 0}
                                    onChange={(e) => onFieldUpdate('fightClubStats.totalMoneyWon', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </>
                    )}

                    {/* Casino Data */}
                    {user.casinoData && (
                        <>
                            <h4 className="subsection-title">Kasiino andmed</h4>
                            <div className="field-row">
                                <label>Kasutatud mänge:</label>
                                <input
                                    type="number"
                                    value={user.casinoData.playsUsed || 0}
                                    onChange={(e) => onFieldUpdate('casinoData.playsUsed', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="5"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};