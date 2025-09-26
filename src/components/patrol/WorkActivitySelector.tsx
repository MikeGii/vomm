// src/components/patrol/WorkActivitySelector.tsx
import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../../types';
import { CrimeImpactIndicator } from './CrimeImpactIndicator';
import { calculateSalaryForOfficer, calculateWorkRewards, getDefaultWorkActivityForPosition } from '../../data/workActivities';
import { DepartmentUnitService } from '../../services/DepartmentUnitService'; // ADD THIS
import '../../styles/components/patrol/WorkActivitySelector.css';

interface WorkActivitySelectorProps {
    selectedHours: number;
    onHoursSelect: (hours: number) => void;
    onStartWork: () => void;
    isStarting: boolean;
    isTutorial?: boolean;
    isKadett?: boolean;
    playerRank?: string | null;
    playerStats: PlayerStats;
    policePosition?: string | null;
}

export const WorkActivitySelector: React.FC<WorkActivitySelectorProps> = ({
                                                                              selectedHours,
                                                                              onHoursSelect,
                                                                              onStartWork,
                                                                              isStarting,
                                                                              isTutorial = false,
                                                                              isKadett = false,
                                                                              playerRank = null,
                                                                              playerStats,
                                                                              policePosition
                                                                          }) => {
    // State for async rewards calculation
    const [expectedRewards, setExpectedRewards] = useState<{ experience: number; money: number }>({
        experience: 0,
        money: 0
    });

    // ADD: State for department bonuses
    const [departmentBonuses, setDepartmentBonuses] = useState<{ workXpBonus: number; salaryBonus: number }>({
        workXpBonus: 0,
        salaryBonus: 0
    });

    // Get the default work activity for player's position
    const workActivity = getDefaultWorkActivityForPosition(policePosition ?? null);

    // Check if player is a police officer (has rank)
    const isPoliceOfficer = playerRank !== null;

    // ADD: Fetch department bonuses
    useEffect(() => {
        const fetchBonuses = async () => {
            if (playerStats.department && playerStats.departmentUnit) {
                try {
                    const bonuses = await DepartmentUnitService.getUnitBonuses(
                        playerStats.department,
                        playerStats.departmentUnit
                    );
                    setDepartmentBonuses(bonuses);
                } catch (error) {
                    console.error('Error fetching department bonuses:', error);
                }
            }
        };

        fetchBonuses();
    }, [playerStats.department, playerStats.departmentUnit]);

    // Calculate rewards when hours or activity changes
    useEffect(() => {
        const calculateRewards = async () => {
            if (workActivity) {
                try {
                    const rewards = await calculateWorkRewards(
                        workActivity,
                        selectedHours,
                        playerRank,
                        playerStats
                    );
                    setExpectedRewards(rewards);
                } catch (error) {
                    console.error('Error calculating rewards:', error);
                    setExpectedRewards({ experience: 0, money: 0 });
                }
            } else {
                setExpectedRewards({ experience: 0, money: 0 });
            }
        };

        calculateRewards();
    }, [workActivity, selectedHours, playerRank, playerStats]);

    // If no work activity available for position
    if (!workActivity) {
        return (
            <div className="work-activity-selector">
                <h3>Tööülesanne</h3>
                <div className="no-activity-available">
                    <p>Sinu ametikoha jaoks ei ole tööülesandeid saadaval.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="work-activity-selector">
            <h3>Tööülesanne</h3>

            <div className="activity-details">
                <div className="activity-header">
                    <h4 className="activity-name">{workActivity.name}</h4>
                    <p className="activity-description">{workActivity.description}</p>
                </div>

                <div className="activity-requirements">
                    <h4>Nõuded:</h4>
                    <ul>
                        <li>Minimaalne tase: {workActivity.minLevel}</li>
                    </ul>
                </div>

                <div className="hours-selection">
                    <label>Tundide arv:</label>
                    {isTutorial ? (
                        <div className="tutorial-hours">
                            <p>1 tund (õpetuse kiirversioon - 20 sekundit)</p>
                        </div>
                    ) : (
                        <div className="hours-slider-container">
                            <input
                                type="range"
                                min="1"
                                max={workActivity.maxHours}
                                value={selectedHours}
                                onChange={(e) => onHoursSelect(Number(e.target.value))}
                                disabled={isStarting}
                                className="hours-slider"
                            />
                            <span className="hours-display">{selectedHours} tundi</span>
                        </div>
                    )}
                </div>

                {/* Crime Impact Indicator */}
                {workActivity && selectedHours > 0 && (
                    <CrimeImpactIndicator
                        playerStats={playerStats}
                        selectedHours={selectedHours}
                    />
                )}

                <div className="rewards-preview">
                    <h4>Oodatav tasu:</h4>
                    <div className="reward-item">
                        <span className="reward-label">Kogemus:</span>
                        <span className="reward-value">+{expectedRewards.experience} XP</span>
                    </div>
                    {isPoliceOfficer && expectedRewards.money > 0 && (
                        <div className="reward-item">
                            <span className="reward-label">Palk:</span>
                            <span className="reward-value">+{expectedRewards.money}€</span>
                        </div>
                    )}

                    {/* ADD: Department Bonuses Display */}
                    {(departmentBonuses.workXpBonus > 0 || departmentBonuses.salaryBonus > 0) && (
                        <div className="department-bonuses">
                            <h5>🏢 Üksuse boonused:</h5>
                            {departmentBonuses.workXpBonus > 0 && (
                                <div className="bonus-item">
                                    <span className="bonus-icon">📈</span>
                                    <span className="bonus-text">+{departmentBonuses.workXpBonus}% XP boonus</span>
                                </div>
                            )}
                            {departmentBonuses.salaryBonus > 0 && isPoliceOfficer && (
                                <div className="bonus-item">
                                    <span className="bonus-icon">💰</span>
                                    <span className="bonus-text">+{departmentBonuses.salaryBonus}% palgaboonus</span>
                                </div>
                            )}
                        </div>
                    )}

                    {isPoliceOfficer && (
                        <div className="salary-info">
                            <p className="salary-rate">
                                Tunnitasu: {calculateSalaryForOfficer(playerRank, 1, playerStats)}€/tund ({playerRank})
                            </p>
                        </div>
                    )}
                    {!isTutorial && (
                        <p className="reward-note">
                            Iga järgnev tund annab {(workActivity.expGrowthRate * 100)}% rohkem kogemust
                        </p>
                    )}
                </div>

                <button
                    className="start-work-button"
                    onClick={onStartWork}
                    disabled={isStarting}
                >
                    {isStarting ? 'Alustan...' : isKadett ? 'Alusta tööampsu' : 'Alusta tööd'}
                </button>
            </div>
        </div>
    );
};