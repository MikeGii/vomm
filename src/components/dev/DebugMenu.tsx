// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { initializeAttributes, initializeTrainingData } from '../../services/TrainingService';
import { PlayerStats } from '../../types';
import { checkCourseCompletion } from '../../services/CourseService';
import { checkWorkCompletion } from '../../services/WorkService';
import { Timestamp } from 'firebase/firestore';
import '../../styles/components/dev/DebugMenu.css';

export const DebugMenu: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

    // Load player stats to check active course/work
    useEffect(() => {
        if (!currentUser) return;

        const loadStats = async () => {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        };

        loadStats();
        // Reload stats when menu is opened
        if (isOpen) {
            loadStats();
        }
    }, [currentUser, isOpen]);

    // Only show for developer account - moved after hooks
    if (currentUser?.email !== 'cjmike12@gmail.com') {
        return null;
    }

    const completeCurrentWork = async () => {
        if (!currentUser || !playerStats?.activeWork) {
            alert('Aktiivne töö puudub!');
            return;
        }

        if (!window.confirm('Lõpeta praegune töö kohe?')) return;

        setIsProcessing(true);
        try {
            // Set work end time to now
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'activeWork.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion
            setTimeout(async () => {
                await checkWorkCompletion(currentUser.uid);
                alert('Töö lõpetatud!');

                // Reload stats
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    setPlayerStats(statsDoc.data() as PlayerStats);
                }
            }, 100);
        } catch (error) {
            console.error('Error completing work:', error);
            alert('Failed to complete work');
        } finally {
            setIsProcessing(false);
        }
    };

    const completeCurrentCourse = async () => {
        if (!currentUser || !playerStats?.activeCourse) {
            alert('Aktiivne koolitus puudub!');
            return;
        }

        if (!window.confirm('Lõpeta praegune koolitus kohe?')) return;

        setIsProcessing(true);
        try {
            // Set course end time to now
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            await updateDoc(statsRef, {
                'activeCourse.endsAt': Timestamp.now()
            });

            // Wait a moment then trigger completion
            setTimeout(async () => {
                await checkCourseCompletion(currentUser.uid);
                alert('Koolitus lõpetatud!');

                // Reload stats
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    setPlayerStats(statsDoc.data() as PlayerStats);
                }
            }, 100);
        } catch (error) {
            console.error('Error completing course:', error);
            alert('Failed to complete course');
        } finally {
            setIsProcessing(false);
        }
    };

    const refillTrainingClicks = async () => {
        if (!currentUser) return;

        if (!window.confirm('Taasta kõik treeningkorrad (50)?')) return;

        setIsProcessing(true);
        try {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const maxClicks = playerStats?.activeWork ? 10 : 50;

            await updateDoc(statsRef, {
                'trainingData.remainingClicks': maxClicks,
                'trainingData.lastResetTime': Timestamp.now()
            });

            alert(`Treeningkorrad taastatud: ${maxClicks}`);

            // Reload stats
            const statsDoc = await getDoc(statsRef);
            if (statsDoc.exists()) {
                setPlayerStats(statsDoc.data() as PlayerStats);
            }
        } catch (error) {
            console.error('Error refilling training clicks:', error);
            alert('Failed to refill training clicks');
        } finally {
            setIsProcessing(false);
        }
    };

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
                activeWork: null,
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
                            <h4>Quick Actions</h4>
                            <button
                                className="debug-btn"
                                onClick={completeCurrentWork}
                                disabled={isProcessing || !playerStats?.activeWork}
                                title={playerStats?.activeWork ? 'Complete active work' : 'No active work'}
                            >
                                ⏭️ Complete Work {!playerStats?.activeWork && '(N/A)'}
                            </button>
                            <button
                                className="debug-btn"
                                onClick={completeCurrentCourse}
                                disabled={isProcessing || !playerStats?.activeCourse}
                                title={playerStats?.activeCourse ? 'Complete active course' : 'No active course'}
                            >
                                ⏭️ Complete Course {!playerStats?.activeCourse && '(N/A)'}
                            </button>
                            <button
                                className="debug-btn"
                                onClick={refillTrainingClicks}
                                disabled={isProcessing}
                            >
                                🔄 Refill Training Clicks
                            </button>
                        </div>

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
                            {playerStats && (
                                <>
                                    <br />
                                    <small>
                                        Training: {playerStats.trainingData?.remainingClicks || 0} clicks
                                        {playerStats.activeWork && ' (Working)'}
                                        {playerStats.activeCourse && ' (In Course)'}
                                    </small>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};