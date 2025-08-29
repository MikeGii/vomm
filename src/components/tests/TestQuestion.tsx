// src/components/tests/TestQuestion.tsx
import React from 'react';
import { TestQuestion as TestQuestionType } from '../../types';
import '../../styles/components/tests/TestQuestion.css';

interface TestQuestionProps {
    question: TestQuestionType;
    questionNumber: number;
    selectedAnswer: number | null;
    onAnswerSelect: (answerIndex: number) => void;
    isSubmitting: boolean;
}

export const TestQuestion: React.FC<TestQuestionProps> = ({
                                                              question,
                                                              questionNumber,
                                                              selectedAnswer,
                                                              onAnswerSelect,
                                                              isSubmitting
                                                          }) => {
    return (
        <div className="test-question">
            <div className="question-header">
                <span className="question-number">Küsimus {questionNumber}</span>
            </div>

            <div className="question-text">
                {question.question}
            </div>

            <div className="answers-list">
                {question.answers.map((answer, index) => (
                    <button
                        key={index}
                        className={`answer-option ${selectedAnswer === index ? 'selected' : ''}`}
                        onClick={() => onAnswerSelect(index)}
                        disabled={isSubmitting}
                    >
                        <div className="answer-indicator">
                            <span className="answer-letter">
                                {String.fromCharCode(65 + index)}
                            </span>
                        </div>
                        <div className="answer-text">
                            {answer}
                        </div>
                        {selectedAnswer === index && (
                            <div className="answer-selected-icon">
                                ✓
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {isSubmitting && (
                <div className="saving-indicator">
                    <span className="saving-spinner"></span>
                    <span>Salvestamine...</span>
                </div>
            )}
        </div>
    );
};