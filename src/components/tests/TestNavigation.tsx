// src/components/tests/TestNavigation.tsx
import React from 'react';
import '../../styles/components/tests/TestNavigation.css';

interface TestNavigationProps {
    currentIndex: number;
    totalQuestions: number;
    answers: (number | null)[];
    onPrevious: () => void;
    onNext: () => void;
    onQuestionSelect: (index: number) => void;
    onFinish: () => void;
    isFinishing: boolean;
}

export const TestNavigation: React.FC<TestNavigationProps> = ({
                                                                  currentIndex,
                                                                  totalQuestions,
                                                                  answers,
                                                                  onPrevious,
                                                                  onNext,
                                                                  onQuestionSelect,
                                                                  onFinish,
                                                                  isFinishing
                                                              }) => {
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < totalQuestions - 1;
    const answeredCount = answers.filter(answer => answer !== null).length;

    return (
        <div className="test-navigation">
            <div className="question-map">
                <h4 className="map-title">Küsimused:</h4>
                <div className="question-grid">
                    {Array.from({ length: totalQuestions }, (_, index) => (
                        <button
                            key={index}
                            className={`question-dot ${
                                index === currentIndex ? 'current' : ''
                            } ${
                                answers[index] !== null ? 'answered' : 'unanswered'
                            }`}
                            onClick={() => onQuestionSelect(index)}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div className="navigation-controls">
                <div className="nav-buttons">
                    <button
                        className="nav-button previous-button"
                        onClick={onPrevious}
                        disabled={!canGoPrevious}
                    >
                        <span className="button-icon">←</span>
                        Eelmine
                    </button>

                    {canGoNext ? (
                        <button
                            className="nav-button next-button"
                            onClick={onNext}
                        >
                            Järgmine
                            <span className="button-icon">→</span>
                        </button>
                    ) : (
                        <button
                            className="nav-button finish-button"
                            onClick={onFinish}
                            disabled={isFinishing}
                        >
                            {isFinishing ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Lõpetamine...
                                </>
                            ) : (
                                <>
                                    <span className="button-icon">🏁</span>
                                    Lõpeta test
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="completion-info">
                    <span className="completion-text">
                        {answeredCount}/{totalQuestions} vastatud
                    </span>
                    {answeredCount < totalQuestions && (
                        <span className="completion-warning">
                            ⚠️ Vastamata küsimused loetakse valeks
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};