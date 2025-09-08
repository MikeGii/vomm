// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {collection, query, where, getDocs, deleteDoc, updateDoc, doc} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PlayerStatsCard } from '../components/dashboard/PlayerStatsCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { ActiveCourse } from '../types';
import { getPlayerStats } from '../services/PlayerService';
import { PrefectureSelectionModal } from '../components/dashboard/PrefectureSelectionModal';
import { DepartmentSelectionModal } from '../components/dashboard/DepartmentSelectionModal';
import { Leaderboard } from "../components/leaderboard/Leaderboard";
import { HealthRecoveryManager } from "../components/dashboard/HealthRecoveryManager";
import { checkCourseCompletion } from '../services/CourseService';
import { PlayerAbilities } from "../components/dashboard/PlayerAbilities";
import { InstructionsModal } from '../components/dashboard/InstructionsModal';
import { getActiveEvent } from "../services/EventService";
import { Tasks } from '../components/dashboard/Tasks';
import { ChatFloatingButton } from '../components/chat/ChatFloatingButton';
import Footer from "../components/layout/footer";
import { HealthModal } from '../components/health/HealthModal';

import '../styles/pages/Dashboard.css';
import {getCourseById} from "../data/courses";
import {CacheNotification} from "../components/dashboard/CacheNotification";

function DashboardPage() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { playerStats, loading, refreshStats } = usePlayerStats(); // CHANGED: Using context
    const [showPrefectureSelection, setShowPrefectureSelection] = useState(false);
    const [showDepartmentSelection, setShowDepartmentSelection] = useState(false);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [initializationDone, setInitializationDone] = useState(false);
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

    // ONE-TIME INITIALIZATION (runs once when component mounts)
    useEffect(() => {
        const initializeDashboard = async () => {
            if (!currentUser || initializationDone) return;

            try {
                // Check for completed courses in activeCourses collection
                const activeCoursesRef = collection(firestore, 'activeCourses');
                const q = query(
                    activeCoursesRef,
                    where('userId', '==', currentUser.uid),
                    where('status', '==', 'completed')
                );
                const querySnapshot = await getDocs(q);

                // Process completed courses from activeCourses collection
                for (const docSnapshot of querySnapshot.docs) {
                    const activeCourse = docSnapshot.data() as ActiveCourse;
                    try {
                        await checkCourseCompletion(currentUser.uid);
                        await deleteDoc(docSnapshot.ref);

                        if (activeCourse.courseId === 'lopueksam') {
                            showToast('Õnnitleme! Oled lõpetanud Sisekaitseakadeemia!', 'success');
                        } else {
                            showToast('Kursus lõpetatud!', 'success');
                        }

                        await refreshStats(); // Refresh stats after course completion
                    } catch (error) {
                        console.error('Error checking course completion:', error);
                    }
                }

                // Check for timer-based course completion
                if (playerStats?.activeCourse) {
                    // Check if course has a pending question
                    if (playerStats.activeCourse.status === 'pending_question') {
                        const course = getCourseById(playerStats.activeCourse.courseId);
                        if (course && course.completionQuestion) {
                            // Just show a notification to go to courses page
                            showToast('Kursusel on lõpuküsimus! Mine koolituste lehele vastama.', 'info');
                        }
                    } else if (playerStats.activeCourse.status === 'in_progress') {
                        // Original timer-based completion check
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
                            await refreshStats();
                        }
                    }
                }

                // Check if there's an active event
                try {
                    const activeEvent = await getActiveEvent(currentUser.uid);
                    if (activeEvent) {
                        navigate('/patrol');
                        return;
                    }
                } catch (error) {
                    console.error('Error checking for active events:', error);
                }

                setInitializationDone(true);
            } catch (error) {
                console.error('Dashboard initialization error:', error);
            }
        };

        initializeDashboard();
    }, [currentUser, initializationDone, showToast, navigate, refreshStats, playerStats]);

// REACT TO STATS CHANGES (runs when playerStats updates)
    useEffect(() => {
        if (!playerStats || loading || !currentUser?.uid) return;

        const handlePrefectureLogic = async () => {
            const position = playerStats.policePosition;
            const prefecture = playerStats.prefecture;

            // CASE 1: Kadett should always have Sisekaitseakadeemia
            if (position === 'kadett' && prefecture !== 'Sisekaitseakadeemia') {
                try {
                    const statsRef = doc(firestore, 'playerStats', currentUser.uid);
                    await updateDoc(statsRef, {
                        prefecture: 'Sisekaitseakadeemia'
                    });
                    // Don't call refreshStats here - the context listener will handle it
                } catch (error) {
                    console.error('Error updating kadett prefecture:', error);
                }
                return;
            }

            // CASE 2: Abipolitseinik needs prefecture selection
            if (position === 'abipolitseinik' && !prefecture) {
                setShowPrefectureSelection(true);
                return;
            }

            // CASE 3: Graduated officers need prefecture selection
            if (position &&
                position !== 'abipolitseinik' &&
                position !== 'kadett' &&
                (!prefecture || prefecture === 'Sisekaitseakadeemia')) {
                setShowPrefectureSelection(true);
                return;
            }

            // CASE 4: Graduated officers with prefecture need department
            if (position &&
                position !== 'abipolitseinik' &&
                position !== 'kadett' &&
                prefecture &&
                prefecture !== 'Sisekaitseakadeemia' &&
                !playerStats.department) {
                setShowDepartmentSelection(true);
                return;
            }
        };

        handlePrefectureLogic();
    }, [playerStats, loading, currentUser?.uid]);

    // Handler for when health is updated from the modal
    const handleHealthUpdate = async () => {
        if (currentUser) {
            try {
                await refreshStats(); // Use context refresh instead of manual fetch
                showToast('Tervis taastatud!', 'success');
            } catch (error) {
                console.error('Error updating health:', error);
                showToast('Viga tervise uuendamisel', 'error');
            }
        }
    };

    // Handler for prefecture selection complete
    const handlePrefectureComplete = async () => {
        setShowPrefectureSelection(false);
        await refreshStats(); // Refresh stats from context

        // If graduated (has completed lopueksam), show department selection next
        if (playerStats?.completedCourses?.includes('lopueksam')) {
            setShowDepartmentSelection(true);
        }
    };

    // Handler for department selection complete
    const handleDepartmentSelection = async () => {
        setShowDepartmentSelection(false);
        await refreshStats(); // Refresh stats from context
        showToast('Oled määratud oma osakonda! Võid alustada patrullimist.', 'success');
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
            <main className={`dashboard-container ${playerStats?.isVip ? 'vip-dashboard' : ''}`}>

                <CacheNotification />

                {playerStats && userData && (
                    <>
                        <PlayerStatsCard
                            stats={playerStats}
                            username={userData.username}
                            onHealthUpdate={handleHealthUpdate}
                            onHealthModalOpen={() => setIsHealthModalOpen(true)}
                        />

                        <Tasks/>

                        <QuickActions
                            stats={playerStats}
                            onShowInstructions={() => setShowInstructionsModal(true)}
                        />
                        <PlayerAbilities
                            stats={playerStats}
                        />

                        <Leaderboard
                            currentUserId={currentUser?.uid}
                            currentUserIsVip={playerStats?.isVip === true}
                        />

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

                {showInstructionsModal && (
                    <InstructionsModal
                        isOpen={showInstructionsModal}
                        onClose={() => setShowInstructionsModal(false)}
                    />
                )}

                {/* Health Modal - Rendered at dashboard level */}
                {isHealthModalOpen && playerStats && (
                    <HealthModal
                        isOpen={isHealthModalOpen}
                        onClose={() => setIsHealthModalOpen(false)}
                        playerStats={playerStats}
                        onHealthUpdate={handleHealthUpdate}
                    />
                )}

            </main>
            <Footer />
        </div>
    );
}

export default DashboardPage;