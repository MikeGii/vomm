// src/components/patrol/WorkActivitySelector.tsx
import React from 'react';
import { WorkActivity } from '../../types';
import { calculateWorkRewards } from '../../data/workActivities';
import '../../styles/components/patrol/WorkActivitySelector.css';

interface WorkActivitySelectorProps {
    activities: WorkActivity[];
    selectedActivity: string;
    selectedHours: number;
    onActivitySelect: (activityId: string) => void;
    onHoursSelect: (hours: number) => void;
    onStartWork: () => void;
    isStarting: boolean;
    isTutorial?: boolean;
    isKadett?: boolean;
}

export const WorkActivitySelector: React.FC<WorkActivitySelectorProps> = ({
                                                                              activities,
                                                                              selectedActivity,
                                                                              selectedHours,
                                                                              onActivitySelect,
                                                                              onHoursSelect,
                                                                              onStartWork,
                                                                              isStarting,
                                                                              isTutorial = false,
                                                                              isKadett = false
                                                                          }) => {
    const selectedActivityData = activities.find(a => a.id === selectedActivity);
    const expectedRewards = selectedActivityData
        ? calculateWorkRewards(selectedActivityData, selectedHours)
        : 0;

    return (
        <div className="work-activity-selector">
            <h3>Vali tööülesanne</h3>

            <div className="activity-selection">
                <label>Tegevus:</label>
                <select
                    className="activity-dropdown"
                    value={selectedActivity}
                    onChange={(e) => onActivitySelect(e.target.value)}
                    disabled={isStarting}
                >
                    <option value="">-- Vali tegevus --</option>
                    {activities.map(activity => (
                        <option key={activity.id} value={activity.id}>
                            {activity.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedActivityData && (
                <div className="activity-details">
                    <p className="activity-description">{selectedActivityData.description}</p>

                    <div className="activity-requirements">
                        <h4>Nõuded:</h4>
                        <ul>
                            <li>Minimaalne tase: {selectedActivityData.minLevel}</li>
                            {selectedActivityData.requiredCourses && (
                                <li>Vajalikud koolitused läbitud</li>
                            )}
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
                                    max={selectedActivityData.maxHours}
                                    value={selectedHours}
                                    onChange={(e) => onHoursSelect(Number(e.target.value))}
                                    disabled={isStarting}
                                    className="hours-slider"
                                />
                                <span className="hours-display">{selectedHours} tundi</span>
                            </div>
                        )}
                    </div>

                    <div className="rewards-preview">
                        <h4>Oodatav tasu:</h4>
                        <div className="reward-item">
                            <span className="reward-label">Kogemus:</span>
                            <span className="reward-value">+{expectedRewards} XP</span>
                        </div>
                        {!isTutorial && (
                            <p className="reward-note">
                                Iga järgnev tund annab {(selectedActivityData.expGrowthRate * 100)}% rohkem kogemust
                            </p>
                        )}
                    </div>

                    <button
                        className="start-work-button"
                        onClick={onStartWork}
                        disabled={isStarting || !selectedActivity}
                    >
                        {isStarting ? 'Alustan...' : isKadett ? 'Alusta tööampsu' : 'Alusta tööd'}
                    </button>
                </div>
            )}
        </div>
    );
};