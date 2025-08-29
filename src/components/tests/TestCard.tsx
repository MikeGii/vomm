// src/components/tests/TestCard.tsx
import React from 'react';
import { Test, PlayerStats } from '../../types';
import { isTestUnlocked, isTestCompleted } from '../../services/TestService';
import { getCourseById } from '../../data/courses';
import '../../styles/components/tests/TestCard.css';

interface TestCardProps {
    test: Test;
    playerStats: PlayerStats;
    onStartTest: (testId: string) => void;
    isStartingTest: boolean;
}

export const TestCard: React.FC<TestCardProps> = ({
                                                      test,
                                                      playerStats,
                                                      onStartTest,
                                                      isStartingTest
                                                  }) => {
    const isUnlocked = isTestUnlocked(test, playerStats);
    const isCompleted = isTestCompleted(test.id, playerStats);

    const getRequiredCoursesDisplay = () => {
        if (!test.requiredCourses || test.requiredCourses.length === 0) {
            return 'Pole nõudeid';
        }

        return test.requiredCourses.map(courseId => {
            const course = getCourseById(courseId);
            const isCompleted = playerStats.completedCourses?.includes(courseId) || false;
            return {
                name: course?.name || courseId,
                isCompleted
            };
        });
    };

    const requiredCourses = getRequiredCoursesDisplay();

    const getCategoryEmoji = (category: string) => {
        switch (category) {
            case 'abipolitseinik': return '🟡';
            case 'sisekaitseakadeemia': return '🎓';
            case 'politsei': return '🔵';
            default: return '📝';
        }
    };

    const handleStartTest = () => {
        if (isUnlocked && !isCompleted && !isStartingTest) {
            onStartTest(test.id);
        }
    };

    return (
        <div className={`test-card ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}`}>
            <div className="test-card-header">
                <div className="test-category">
                    <span className="category-emoji">{getCategoryEmoji(test.category)}</span>
                </div>
                {isCompleted && (
                    <div className="completion-badge">
                        <span className="completion-icon">✅</span>
                    </div>
                )}
                {!isUnlocked && (
                    <div className="lock-badge">
                        <span className="lock-icon">🔒</span>
                    </div>
                )}
            </div>

            <div className="test-card-content">
                <h3 className="test-title">{test.name}</h3>
                <p className="test-description">{test.description}</p>

                <div className="test-details">
                    <div className="test-info-grid">
                        <div className="test-info-item">
                            <span className="info-icon">❓</span>
                            <span className="info-text">{test.questions.length} küsimust</span>
                        </div>
                        <div className="test-info-item">
                            <span className="info-icon">⏱️</span>
                            <span className="info-text">{test.timeLimit} minutit</span>
                        </div>
                        <div className="test-info-item">
                            <span className="info-icon">⭐</span>
                            <span className="info-text">{test.baseReward.experience} XP/õige</span>
                        </div>
                        <div className="test-info-item">
                            <span className="info-icon">🏆</span>
                            <span className="info-text">{test.baseReward.reputation} maine/õige</span>
                        </div>
                    </div>

                    {test.perfectScoreBonus.pollid > 0 && (
                        <div className="bonus-info">
                            <span className="bonus-icon">💎</span>
                            <span className="bonus-text">
                                Täiuslik tulemus: +{test.perfectScoreBonus.pollid} pollid
                            </span>
                        </div>
                    )}
                </div>

                <div className="requirements-section">
                    <h4 className="requirements-title">Nõuded:</h4>
                    {typeof requiredCourses === 'string' ? (
                        <p className="no-requirements">{requiredCourses}</p>
                    ) : (
                        <div className="requirements-list">
                            {requiredCourses.map((req, index) => (
                                <div
                                    key={index}
                                    className={`requirement-item ${req.isCompleted ? 'completed' : 'incomplete'}`}
                                >
                                    <span className="requirement-status">
                                        {req.isCompleted ? '✅' : '❌'}
                                    </span>
                                    <span className="requirement-name">{req.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="test-card-footer">
                {isCompleted ? (
                    <button className="test-button completed-button" disabled>
                        <span className="button-icon">✅</span>
                        Lõpetatud
                    </button>
                ) : !isUnlocked ? (
                    <button className="test-button locked-button" disabled>
                        <span className="button-icon">🔒</span>
                        Lukustatud
                    </button>
                ) : (
                    <button
                        className="test-button start-button"
                        onClick={handleStartTest}
                        disabled={isStartingTest}
                    >
                        <span className="button-icon">▶️</span>
                        {isStartingTest ? 'Alustamine...' : 'Alusta testi'}
                    </button>
                )}
            </div>
        </div>
    );
};