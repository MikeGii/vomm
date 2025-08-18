// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PlayerStats, ActiveCourse } from '../types';
import { initializePlayerStats, getPlayerStats } from '../services/PlayerService';
import { PrefectureSelectionModal } from '../components/dashboard/PrefectureSelectionModal';
import { DepartmentSelectionModal } from '../components/dashboard/DepartmentSelectionModal';
import { Leaderboard } from "../components/leaderboard/Leaderboard";
import { checkForPendingEvent } from '../services/EventService';
import { HealthRecoveryManager } from "../components/dashboard/HealthRecoveryManager";
import { checkCourseCompletion } from '../services/CourseService';
import { PlayerAbilities } from "../components/dashboard/PlayerAbilities";

import '../styles/pages/Dashboard.css';

function DashboardPage() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showPrefectureSelection, setShowPrefectureSelection] = useState(false);
    const [showDepartmentSelection, setShowDepartmentSelection] = useState(false);

    useEffect(() => {
        const loadPlayerStats = async () => {
            if (currentUser) {
                setLoading(true);
                try {
                    // First initialize player stats (creates document if it doesn't exist for new users)
                    let stats = await initializePlayerStats(currentUser.uid);

                    // RESTORED: Check for completed courses in activeCourses collection
                    const activeCoursesRef = collection(firestore, 'activeCourses');
                    const q = query(
                        activeCoursesRef,
                        where('userId', '==', currentUser.uid),
                        where('status', '==', 'completed')
                    );
                    const querySnapshot = await getDocs(q);

                    // RESTORED: Process completed courses from activeCourses collection
                    for (const docSnapshot of querySnapshot.docs) {
                        const activeCourse = docSnapshot.data() as ActiveCourse;
                        try {
                            // Use checkCourseCompletion to complete the course
                            await checkCourseCompletion(currentUser.uid);
                            await deleteDoc(docSnapshot.ref);

                            // Check if it was the final exam
                            if (activeCourse.courseId === 'lopueksam') {
                                showToast('Õnnitleme! Oled lõpetanud Sisekaitseakadeemia!', 'success');
                            } else {
                                showToast('Kursus lõpetatud!', 'success');
                            }
                        } catch (error) {
                            console.error('Error checking course completion:', error);
                        }
                    }

                    // ALSO check for course completion using the timer-based method
                    // Only if stats exist and have an active course (prevents error for new users)
                    if (stats && stats.activeCourse) {
                        const timerBasedCompletion = await checkCourseCompletion(currentUser.uid);
                        if (timerBasedCompletion) {
                            const tempStats = await getPlayerStats(currentUser.uid);
                            if (tempStats?.completedCourses) {
                                const lastCompletedCourse = tempStats.completedCourses[tempStats.completedCourses.length - 1];
                                if (lastCompletedCourse === 'lopueksam') {
                                    showToast('Õnnitleme! Oled lõpetanud Sisekaitseakadeemia!', 'success');
                                } else {
                                    showToast('Kursus lõpetatud!', 'success');
                                }
                            }
                            // Reload stats after course completion
                            stats = await initializePlayerStats(currentUser.uid);
                        }
                    }

                    // Set the player stats
                    setPlayerStats(stats);

                    // RESTORED: Check for pending events (work completed while offline)
                    const hasPendingEvent = await checkForPendingEvent(currentUser.uid);
                    if (hasPendingEvent) {
                        // Redirect to patrol page to handle event
                        navigate('/patrol');
                        return;
                    }

                    // RESTORED: Check if tutorial should be shown - including steps 9-10
                    if (!stats.tutorialProgress.isCompleted &&
                        (stats.tutorialProgress.currentStep < 4 ||
                            (stats.tutorialProgress.currentStep >= 9 && stats.tutorialProgress.currentStep <= 10) ||
                            stats.tutorialProgress.currentStep === 16)) {
                        setShowTutorial(true);
                    }

                    // NEW: Check if prefecture selection is needed after graduation
                    if (stats.completedCourses?.includes('lopueksam') && !stats.prefecture) {
                        setShowPrefectureSelection(true);
                    }
                    // NEW: Check if department selection is needed after prefecture selection (for graduated officers)
                    else if (stats.completedCourses?.includes('lopueksam') && stats.prefecture && !stats.department) {
                        setShowDepartmentSelection(true);
                    }
                    // RESTORED: Check if prefecture selection is needed for abipolitseinik (after basic training)
                    else if (stats.hasCompletedTraining && !stats.prefecture && !stats.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
                        setShowPrefectureSelection(true);
                    }
                } catch (error) {
                    console.error('Viga mängija andmete laadimisel:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadPlayerStats();
    }, [currentUser, navigate, showToast]);

    // RESTORED: Handler for when health is updated from the modal
    const handleHealthUpdate = async () => {
        if (currentUser) {
            try {
                const updatedStats = await getPlayerStats(currentUser.uid);
                if (updatedStats) {
                    setPlayerStats(updatedStats);
                    showToast('Tervis taastatud!', 'success');
                }
            } catch (error) {
                console.error('Error updating health:', error);
                showToast('Viga tervise uuendamisel', 'error');
            }
        }
    };

    // UPDATED: Handler for prefecture selection complete
    const handlePrefectureComplete = async () => {
        setShowPrefectureSelection(false);
        if (currentUser) {
            const stats = await getPlayerStats(currentUser.uid);
            if (stats) {
                setPlayerStats(stats);

                // NEW: If graduated (has completed lopueksam), show department selection next
                if (stats.completedCourses?.includes('lopueksam')) {
                    setShowDepartmentSelection(true);
                }
            }
        }
    };

    // NEW: Handler for department selection complete
    const handleDepartmentSelection = async () => {
        setShowDepartmentSelection(false);
        if (currentUser) {
            const stats = await getPlayerStats(currentUser.uid);
            if (stats) {
                setPlayerStats(stats);
                showToast('Oled määratud oma osakonda! Võid alustada patrullimist.', 'success');
            }
        }
    };

    // RESTORED: Tutorial completion handler
    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        // Reload stats to reflect tutorial completion
        if (currentUser) {
            const updatedStats = await getPlayerStats(currentUser.uid);
            if (updatedStats) {
                setPlayerStats(updatedStats);
            }
        }
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="dashboard-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            {/* RESTORED: Health Recovery Manager */}
            <HealthRecoveryManager />
            <AuthenticatedHeader />
            <main className="dashboard-container">
                {playerStats && userData && (
                    <>
                        {/* RESTORED: All original components */}
                        <PlayerStatsCard
                            stats={playerStats}
                            username={userData.username}
                            onHealthUpdate={handleHealthUpdate}
                        />
                        <QuickActions
                            stats={playerStats}
                        />
                        <PlayerAbilities
                            stats={playerStats}
                        />

                        <Leaderboard
                            currentUserId={currentUser?.uid}
                        />

                        {/* RESTORED: Tutorial Overlay */}
                        {showTutorial && currentUser && (
                            <TutorialOverlay
                                stats={playerStats}
                                userId={currentUser.uid}
                                onTutorialComplete={handleTutorialComplete}
                            />
                        )}

                        {/* RESTORED: Prefecture Selection Modal - for both abipolitseinik and graduated officers */}
                        {showPrefectureSelection && currentUser && (
                            <PrefectureSelectionModal
                                isOpen={showPrefectureSelection}
                                userId={currentUser.uid}
                                onComplete={handlePrefectureComplete}
                            />
                        )}

                        {/* NEW: Department Selection Modal - ONLY for graduated officers (after lopueksam) */}
                        {showDepartmentSelection && currentUser && playerStats && (
                            <DepartmentSelectionModal
                                isOpen={showDepartmentSelection}
                                userId={currentUser.uid}
                                prefecture={playerStats.prefecture || ''}
                                onComplete={handleDepartmentSelection}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;