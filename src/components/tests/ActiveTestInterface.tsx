// src/components/tests/ActiveTestInterface.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTest } from '../../types';
import { TestTimer } from './TestTimer';
import { TestProgress } from './TestProgress';
import { TestQuestion } from './TestQuestion';
import { TestNavigation } from './TestNavigation';
import {
    submitAnswer,
    getRemainingTime,
    getTestProgress
} from '../../services/TestService';
import { getTestById } from '../../data/tests';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/components/tests/ActiveTestInterface.css';

interface ActiveTestInterfaceProps {
    activeTest: ActiveTest;
    onFinishTest: () => void;
    onRefreshStats: () => Promise<void>;
}

export const ActiveTestInterface: React.FC<ActiveTestInterfaceProps> = ({
                                                                            activeTest,
                                                                            onFinishTest,
                                                                            onRefreshStats
                                                                        }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(activeTest.currentQuestionIndex || 0);
    const [answers, setAnswers] = useState<(number | null)[]>(activeTest.answers || []);
    const [timeRemaining, setTimeRemaining] = useState(getRemainingTime(activeTest));
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Get test data - but don't return early yet
    const test = getTestById(activeTest.testId);

    // Finish test callback - MOVED BEFORE useEffect
    const handleFinishTest = useCallback(async () => {
        if (isFinishing) return;

        setIsFinishing(true);
        try {
            await onFinishTest();
        } catch (error) {
            console.error('Error finishing test:', error);
            setIsFinishing(false);
        }
    }, [onFinishTest, isFinishing]);

    // Update timer every second - MOVED BEFORE other callbacks
    useEffect(() => {
        if (!test) return; // Guard clause inside useEffect

        timerRef.current = setInterval(() => {
            const remaining = getRemainingTime(activeTest);
            setTimeRemaining(remaining);

            // Auto-finish when time runs out
            if (remaining <= 0) {
                handleFinishTest();
            }
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [activeTest, test, handleFinishTest]);

    // Handle answer selection
    const handleAnswerSelect = useCallback(async (answerIndex: number) => {
        if (!currentUser || isSubmittingAnswer) return;

        setIsSubmittingAnswer(true);
        try {
            await submitAnswer(currentUser.uid, currentQuestionIndex, answerIndex);

            // Update local state
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = answerIndex;
            setAnswers(newAnswers);

            await onRefreshStats();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Viga vastuse salvestamisel';
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmittingAnswer(false);
        }
    }, [currentUser, currentQuestionIndex, answers, onRefreshStats, showToast, isSubmittingAnswer]);

    // Navigate to question
    const handleQuestionNavigation = useCallback((questionIndex: number) => {
        if (!test || questionIndex < 0 || questionIndex >= test.questions.length) return;
        setCurrentQuestionIndex(questionIndex);
    }, [test]);

    // Navigate to next question
    const handleNextQuestion = useCallback(() => {
        if (!test || currentQuestionIndex >= test.questions.length - 1) return;
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    }, [currentQuestionIndex, test]);

    // Navigate to previous question
    const handlePreviousQuestion = useCallback(() => {
        if (currentQuestionIndex <= 0) return;
        setCurrentQuestionIndex(currentQuestionIndex - 1);
    }, [currentQuestionIndex]);

    // NOW we can do the early return - AFTER all hooks
    if (!test) {
        return (
            <div className="test-error">
                <h2>Viga</h2>
                <p>Testi ei leitud</p>
            </div>
        );
    }

    const progress = getTestProgress(activeTest);
    const currentQuestion = test.questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestionIndex];

    return (
        <div className="active-test-interface">
            <div className="test-header">
                <div className="test-info">
                    <h1 className="test-name">{test.name}</h1>
                    <p className="test-category">{test.category}</p>
                </div>
                <TestTimer
                    timeRemaining={timeRemaining}
                    totalTime={test.timeLimit * 60}
                />
            </div>

            <TestProgress
                current={progress.currentQuestion}
                total={progress.totalQuestions}
                answered={progress.answeredQuestions}
                percentage={progress.progressPercentage}
            />

            <div className="test-content">
                <TestQuestion
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    selectedAnswer={selectedAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    isSubmitting={isSubmittingAnswer}
                />

                <TestNavigation
                    currentIndex={currentQuestionIndex}
                    totalQuestions={test.questions.length}
                    answers={answers}
                    onPrevious={handlePreviousQuestion}
                    onNext={handleNextQuestion}
                    onQuestionSelect={handleQuestionNavigation}
                    onFinish={handleFinishTest}
                    isFinishing={isFinishing}
                />
            </div>
        </div>
    );
};