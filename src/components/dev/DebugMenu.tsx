// src/components/dev/DebugMenu.tsx
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { initializeAttributes, initializeTrainingData } from '../../services/TrainingService';
import '../../styles/components/dev/DebugMenu.css';

export const DebugMenu: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Only show for developer account
    if (currentUser?.email !== 'cjmike12@gmail.com') {
        return null;
    }

    const resetTutorialAndCourses = async () => {
        if (!currentUser || !window.confirm('Reset tutorial and all courses?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'tutorialProgress.isCompleted': false,
                'tutorialProgress.currentStep': 0,
                'tutorialProgress.startedAt': null,
                'tutorialProgress.completedAt': null,
                completedCourses: [],
                activeCourse: null,
                hasCompletedTraining: false,
                isEmployed: false,
                badgeNumber: null
            });
            alert('Tutorial and courses reset!');
        } catch (error) {
            console.error('Error resetting tutorial:', error);
            alert('Failed to reset tutorial');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetAttributes = async () => {
        if (!currentUser || !window.confirm('Reset all attributes to level 0?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                attributes: initializeAttributes(),
                trainingData: initializeTrainingData()
            });
            alert('Attributes reset!');
        } catch (error) {
            console.error('Error resetting attributes:', error);
            alert('Failed to reset attributes');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetPlayerStats = async () => {
        if (!currentUser || !window.confirm('Reset level, reputation, prefecture, and department?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                level: 1,
                experience: 0,
                reputation: 0,
                rank: null,
                department: null,
                prefecture: null,
                casesCompleted: 0,
                criminalsArrested: 0
            });
            alert('Player stats reset!');
        } catch (error) {
            console.error('Error resetting stats:', error);
            alert('Failed to reset stats');
        } finally {
            setIsProcessing(false);
        }
    };

    const fullReset = async () => {
        if (!currentUser || !window.confirm('⚠️ FULL RESET - This will reset EVERYTHING. Are you sure?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                level: 1,
                experience: 0,
                reputation: 0,
                rank: null,
                department: null,
                prefecture: null,
                badgeNumber: null,
                isEmployed: false,
                hasCompletedTraining: false,
                casesCompleted: 0,
                criminalsArrested: 0,
                'tutorialProgress.isCompleted': false,
                'tutorialProgress.currentStep': 0,
                'tutorialProgress.startedAt': null,
                'tutorialProgress.completedAt': null,
                completedCourses: [],
                activeCourse: null,
                attributes: initializeAttributes(),
                trainingData: initializeTrainingData()
            });
            alert('Full reset complete!');
            window.location.reload();
        } catch (error) {
            console.error('Error doing full reset:', error);
            alert('Failed to do full reset');
        } finally {
            setIsProcessing(false);
        }
    };

    const skipToStep = async (step: number) => {
        if (!currentUser) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'tutorialProgress.currentStep': step
            });
            alert(`Jumped to tutorial step ${step}`);
            window.location.reload();
        } catch (error) {
            console.error('Error jumping to step:', error);
            alert('Failed to jump to step');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Floating debug button */}
            <button
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Developer Tools"
            >
                🛠️
            </button>

            {/* Debug menu panel */}
            {isOpen && (
                <div className="debug-menu">
                    <div className="debug-header">
                        <h3>Developer Tools</h3>
                        <button
                            className="debug-close"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="debug-content">
                        <div className="debug-section">
                            <h4>Reset Options</h4>
                            <button
                                className="debug-btn"
                                onClick={resetTutorialAndCourses}
                                disabled={isProcessing}
                            >
                                🔄 Reset Tutorial & Courses
                            </button>
                            <button
                                className="debug-btn"
                                onClick={resetAttributes}
                                disabled={isProcessing}
                            >
                                💪 Reset All Attributes
                            </button>
                            <button
                                className="debug-btn"
                                onClick={resetPlayerStats}
                                disabled={isProcessing}
                            >
                                📊 Reset Player Stats
                            </button>
                            <button
                                className="debug-btn debug-btn-danger"
                                onClick={fullReset}
                                disabled={isProcessing}
                            >
                                ⚠️ FULL RESET
                            </button>
                        </div>

                        <div className="debug-section">
                            <h4>Tutorial Navigation</h4>
                            <div className="debug-step-buttons">
                                <button onClick={() => skipToStep(0)} disabled={isProcessing}>Start</button>
                                <button onClick={() => skipToStep(3)} disabled={isProcessing}>Step 3</button>
                                <button onClick={() => skipToStep(6)} disabled={isProcessing}>Step 6</button>
                                <button onClick={() => skipToStep(9)} disabled={isProcessing}>Step 9</button>
                                <button onClick={() => skipToStep(11)} disabled={isProcessing}>Step 11</button>
                                <button onClick={() => skipToStep(14)} disabled={isProcessing}>Step 14</button>
                            </div>
                        </div>

                        <div className="debug-info">
                            <small>User: {currentUser?.email}</small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};