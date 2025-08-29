// src/components/tests/TestResultsModal.tsx
import React from 'react';
import { CompletedTest } from '../../types';
import { getTestById } from '../../data/tests';
import '../../styles/components/tests/TestResultsModal.css';

interface TestResultsModalProps {
    completedTest: CompletedTest;
    onClose: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
                                                                      completedTest,
                                                                      onClose
                                                                  }) => {
    const test = getTestById(completedTest.testId);

    if (!test) {
        return null;
    }

    const scorePercentage = Math.round((completedTest.score / completedTest.totalQuestions) * 100);
    const isPerfectScore = completedTest.score === completedTest.totalQuestions;

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    const getScoreClass = (): string => {
        if (scorePercentage >= 90) return 'excellent';
        if (scorePercentage >= 75) return 'good';
        if (scorePercentage >= 50) return 'average';
        return 'poor';
    };

    const getScoreMessage = (): string => {
        if (scorePercentage === 100) return 'Täiuslik tulemus!';
        if (scorePercentage >= 90) return 'Suurepärane!';
        if (scorePercentage >= 75) return 'Väga hea!';
        if (scorePercentage >= 50) return 'Keskmine tulemus';
        return 'Tuleb veel õppida';
    };

    const getCategoryEmoji = (category: string): string => {
        switch (category) {
            case 'abipolitseinik': return '🟡';
            case 'sisekaitseakadeemia': return '🎓';
            case 'politsei': return '🔵';
            default: return '📝';
        }
    };

    return (
        <div className="test-results-overlay" onClick={onClose}>
            <div className="test-results-modal" onClick={(e) => e.stopPropagation()}>
                <div className={`results-header ${getScoreClass()}`}>
                    <div className="header-content">
                        <div className="test-category">
                            <span className="category-emoji">{getCategoryEmoji(test.category)}</span>
                            <span className="category-name">{test.category}</span>
                        </div>
                        <h2 className="test-name">{test.name}</h2>
                        <div className="score-message">{getScoreMessage()}</div>
                    </div>
                </div>

                <div className="results-content">
                    <div className="score-section">
                        <div className="score-display">
                            <div className="score-circle">
                                <div className="score-number">
                                    {completedTest.score}/{completedTest.totalQuestions}
                                </div>
                                <div className="score-percentage">
                                    {scorePercentage}%
                                </div>
                            </div>
                            <div className="score-details">
                                <div className="score-breakdown">
                                    <div className="breakdown-item correct">
                                        <span className="breakdown-icon">✅</span>
                                        <span className="breakdown-text">
                                            {completedTest.score} õiget vastust
                                        </span>
                                    </div>
                                    <div className="breakdown-item incorrect">
                                        <span className="breakdown-icon">❌</span>
                                        <span className="breakdown-text">
                                            {completedTest.totalQuestions - completedTest.score} valet vastust
                                        </span>
                                    </div>
                                </div>
                                <div className="time-taken">
                                    <span className="time-icon">⏱️</span>
                                    <span className="time-text">
                                        Aeg: {formatTime(completedTest.timeTaken)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rewards-section">
                        <h3 className="rewards-title">Teenitud preemiad</h3>
                        <div className="rewards-list">
                            <div className="reward-item">
                                <span className="reward-icon">⭐</span>
                                <span className="reward-text">
                                    +{completedTest.earnedRewards.experience} kogemust
                                </span>
                            </div>
                            <div className="reward-item">
                                <span className="reward-icon">🏆</span>
                                <span className="reward-text">
                                    +{completedTest.earnedRewards.reputation} mainet
                                </span>
                            </div>
                            {completedTest.earnedRewards.pollid && (
                                <div className="reward-item bonus">
                                    <span className="reward-icon">💎</span>
                                    <span className="reward-text">
                                        +{completedTest.earnedRewards.pollid} pollid (täiuslik skoor!)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isPerfectScore && (
                        <div className="perfect-score-celebration">
                            <div className="celebration-content">
                                <div className="celebration-emoji">🎉</div>
                                <div className="celebration-text">
                                    <h4>Täiuslik tulemus!</h4>
                                    <p>Sa vastasid kõikidele küsimustele õigesti!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="results-footer">
                    <button className="close-button" onClick={onClose}>
                        <span className="button-icon">✓</span>
                        Sulge
                    </button>
                </div>
            </div>
        </div>
    );
};