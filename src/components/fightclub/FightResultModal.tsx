// src/components/fightclub/FightResultModal.tsx
import React from 'react';
import { FightResult } from '../../services/FightService';

interface FightResultModalProps {
    isOpen: boolean;
    fightResult: FightResult | null;
    onClose: () => void;
}

export const FightResultModal: React.FC<FightResultModalProps> = ({
                                                                      isOpen,
                                                                      fightResult,
                                                                      onClose
                                                                  }) => {
    if (!isOpen || !fightResult) return null;

    return (
        <div className="fight-modal-overlay" onClick={onClose}>
            <div className="fight-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fight-header">
                    <h2>🥊 Võitluse Tulemus</h2>
                    <button className="close-modal" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="fight-content">
                    <div className="fight-summary">
                        <h3>
                            {fightResult.winner === 'player1' ? '🏆 VÕIT!' : '😞 KAOTUS'}
                        </h3>
                        <p>Skoor: {fightResult.player1Score} - {fightResult.player2Score}</p>
                        {fightResult.winner === 'player1' && (
                            <p className="money-won">Võidetud: +{fightResult.moneyWon}€</p>
                        )}
                    </div>

                    <div className="fight-rounds">
                        {fightResult.rounds.map((round, index) => (
                            <div key={index} className="round-summary">
                                {round.description.map((line, lineIndex) => (
                                    <p key={lineIndex} className={lineIndex === 0 ? 'round-title' : ''}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};