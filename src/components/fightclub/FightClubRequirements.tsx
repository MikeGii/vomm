// src/components/fightclub/FightClubRequirements.tsx
import React from 'react';
import '../../styles/components/fightclub/FightClubRequirements.css';
import { PlayerStats } from '../../types';

interface FightClubRequirementsProps {
    playerStats: PlayerStats;
    onNavigateToTraining: () => void;
}

export const FightClubRequirements: React.FC<FightClubRequirementsProps> = ({
                                                                                playerStats,
                                                                                onNavigateToTraining
                                                                            }) => {
    return (
        <div className="requirements-section">
            <div className="requirements-warning">
                <span className="warning-icon">⚠️</span>
                <h2>Nõuded võitlusklubisse astumiseks</h2>
                <p>Sa ei vasta veel võitlusklubi nõuetele. Treeni oma atribuute!</p>
            </div>

            <div className="requirements-list">
                <h3>Vajalikud nõuded:</h3>
                <div className="requirement-items">
                    <div className={`requirement-item ${playerStats.level >= 20 ? 'met' : 'unmet'}`}>
                        <span className="requirement-icon">
                            {playerStats.level >= 20 ? '✅' : '❌'}
                        </span>
                        <span className="requirement-text">
                            Tase 20+ (praegu: {playerStats.level})
                        </span>
                    </div>

                    <div className={`requirement-item ${(playerStats.attributes?.strength?.level || 0) >= 10 ? 'met' : 'unmet'}`}>
                        <span className="requirement-icon">
                            {(playerStats.attributes?.strength?.level || 0) >= 10 ? '✅' : '❌'}
                        </span>
                        <span className="requirement-text">
                            Jõud 10+ (praegu: {playerStats.attributes?.strength?.level || 0})
                        </span>
                    </div>

                    <div className={`requirement-item ${(playerStats.attributes?.dexterity?.level || 0) >= 10 ? 'met' : 'unmet'}`}>
                        <span className="requirement-icon">
                            {(playerStats.attributes?.dexterity?.level || 0) >= 10 ? '✅' : '❌'}
                        </span>
                        <span className="requirement-text">
                            Osavus 10+ (praegu: {playerStats.attributes?.dexterity?.level || 0})
                        </span>
                    </div>

                    <div className={`requirement-item ${(playerStats.attributes?.agility?.level || 0) >= 10 ? 'met' : 'unmet'}`}>
                        <span className="requirement-icon">
                            {(playerStats.attributes?.agility?.level || 0) >= 10 ? '✅' : '❌'}
                        </span>
                        <span className="requirement-text">
                            Kiirus 10+ (praegu: {playerStats.attributes?.agility?.level || 0})
                        </span>
                    </div>
                </div>
            </div>

            <div className="training-suggestion">
                <p>💡 Mine <strong>treeningkeskusesse</strong> ja tõsta oma atribuute!</p>
                <button
                    className="training-button"
                    onClick={onNavigateToTraining}
                >
                    Mine treenima
                </button>
            </div>
        </div>
    );
};