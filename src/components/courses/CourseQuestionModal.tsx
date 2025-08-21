// src/components/courses/CourseQuestionModal.tsx

import React, { useState } from 'react';
import { Course } from '../../types';
import { answerCourseQuestion } from '../../services/CourseService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/courses/CourseQuestionModal.css';

interface CourseQuestionModalProps {
    course: Course;
    isOpen: boolean;
    onClose: () => void;
    onAnswerCorrect: () => void;
}

export const CourseQuestionModal: React.FC<CourseQuestionModalProps> = ({
                                                                            course,
                                                                            isOpen,
                                                                            onClose,
                                                                            onAnswerCorrect
                                                                        }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !course.completionQuestion) return null;

    const handleSubmit = async () => {
        if (selectedAnswer === null) {
            showToast('Palun vali vastus!', 'error');
            return;
        }

        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            const result = await answerCourseQuestion(
                currentUser.uid,
                course.id,
                selectedAnswer
            );

            if (result.isCorrect) {
                showToast(result.message, 'success');
                onAnswerCorrect();
            } else {
                showToast(result.message, 'warning');
            }

            // Close modal after answering (whether correct or wrong)
            onClose();

        } catch (error) {
            console.error('Error submitting answer:', error);
            showToast('Viga vastuse saatmisel', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="question-modal-overlay">
            <div className="question-modal">
                <div className="question-modal-header">
                    <h2>Kursuse lõpuküsimus</h2>
                    <p className="course-name">{course.name}</p>
                </div>

                <div className="question-modal-body">
                    <div className="question-text">
                        {course.completionQuestion.question}
                    </div>

                    <div className="answers-container">
                        {course.completionQuestion.answers.map((answer, index) => (
                            <button
                                key={index}
                                className={`answer-option ${selectedAnswer === index ? 'selected' : ''}`}
                                onClick={() => setSelectedAnswer(index)}
                                disabled={isSubmitting}
                            >
                                <span className="answer-number">{index + 1}.</span>
                                <span className="answer-text">{answer}</span>
                            </button>
                        ))}
                    </div>

                    <div className="question-rewards">
                        <p className="rewards-title">Õige vastuse boonus:</p>
                        <div className="rewards-list">
                            <span>+{course.completionQuestion.rewards.experience} XP</span>
                            {course.completionQuestion.rewards.money && (
                                <span>+{course.completionQuestion.rewards.money}€</span>
                            )}
                            {course.completionQuestion.rewards.reputation && (
                                <span>+{course.completionQuestion.rewards.reputation} mainet</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="question-modal-footer">
                    <button
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || selectedAnswer === null}
                    >
                        {isSubmitting ? 'Saadan...' : 'Vasta'}
                    </button>
                </div>
            </div>
        </div>
    );
};