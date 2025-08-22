// src/pages/CoursesPage.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ActiveCourseProgress } from '../components/courses/ActiveCourseProgress';
import { CourseTabs } from '../components/courses/CourseTabs';
import { CoursesList } from '../components/courses/CoursesList';
import { CourseBoosterPanel } from '../components/courses/CourseBoosterPanel';
import { CourseQuestionModal } from '../components/courses/CourseQuestionModal';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import { Course } from '../types';
import { TabType } from '../types/courseTabs.types';
import {
    getAvailableCourses,
    enrollInCourse,
    checkCourseCompletion,
    getRemainingTime,
    getCompletedCoursesDetails
} from '../services/CourseService';
import { ALL_COURSES, getCourseById } from '../data/courses';
import '../styles/pages/Courses.css';

const CoursesPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { playerStats, loading, refreshStats } = usePlayerStats();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastActiveCourseRef = useRef<string | null>(null);
    const completionAlertShownRef = useRef<string | null>(null);

    // Question modal state
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [questionCourse, setQuestionCourse] = useState<Course | null>(null);
    const questionCheckRef = useRef<boolean>(false);

    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [enrolling, setEnrolling] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<TabType>('available');

    // Memoize course filtering more efficiently
    const coursesForTab = useMemo(() => {
        if (!playerStats) {
            return {
                available: [],
                completed: [],
                abipolitseinik: [],
                sisekaitseakadeemia: [],
                politsei: []
            };
        }

        // Cache these filters to avoid recalculation
        return {
            available: availableCourses,
            completed: completedCourses,
            abipolitseinik: ALL_COURSES.filter(c => c.category === 'abipolitseinik'),
            sisekaitseakadeemia: ALL_COURSES.filter(c => c.category === 'sisekaitseakadeemia'),
            politsei: ALL_COURSES.filter(c => c.category === 'politsei')
        };
    }, [availableCourses, completedCourses, playerStats]);

    // Calculate course counts for tabs
    const courseCounts = useMemo(() => ({
        available: coursesForTab.available.length,
        completed: coursesForTab.completed.length,
        abipolitseinik: coursesForTab.abipolitseinik.length,
        sisekaitseakadeemia: coursesForTab.sisekaitseakadeemia.length,
        politsei: coursesForTab.politsei.length
    }), [coursesForTab]);

    // Get currently displayed courses based on active tab
    const displayedCourses = useMemo(() =>
            coursesForTab[activeTab] || [],
        [coursesForTab, activeTab]);

    // Check if current tab is a status tab
    const isStatusTab = activeTab !== 'available' && activeTab !== 'completed';

    // Check for pending question status
    useEffect(() => {
        if (!playerStats?.activeCourse || questionCheckRef.current) return;

        // Check if course is pending question
        if (playerStats.activeCourse.status === 'pending_question' && !showQuestionModal) {
            const course = getCourseById(playerStats.activeCourse.courseId);
            if (course && course.completionQuestion) {
                questionCheckRef.current = true;
                setQuestionCourse(course);
                setShowQuestionModal(true);
            }
        }
    }, [playerStats?.activeCourse, showQuestionModal]);

    // Update courses when playerStats changes
    useEffect(() => {
        if (!playerStats) return;

        // Update available courses
        const available = getAvailableCourses(playerStats);
        setAvailableCourses(available);

        // Update completed courses
        if (playerStats.completedCourses && playerStats.completedCourses.length > 0) {
            const completed = getCompletedCoursesDetails(playerStats.completedCourses);
            setCompletedCourses(completed);
        }

        // Check for course completion notification
        if (lastActiveCourseRef.current &&
            (!playerStats.activeCourse || playerStats.activeCourse.status !== 'in_progress')) {

            const completedCourse = getCourseById(lastActiveCourseRef.current);
            if (completedCourse &&
                playerStats.completedCourses?.includes(lastActiveCourseRef.current) &&
                completionAlertShownRef.current !== lastActiveCourseRef.current) {

                // Don't show toast if question modal is showing
                if (!showQuestionModal) {
                    showToast(`Kursus "${completedCourse.name}" on edukalt lõpetatud!`, 'success');
                }
                completionAlertShownRef.current = lastActiveCourseRef.current;
                lastActiveCourseRef.current = null;
            }
        }

        // Update active course reference
        if (playerStats.activeCourse?.status === 'in_progress') {
            lastActiveCourseRef.current = playerStats.activeCourse.courseId;
        } else if (playerStats.activeCourse?.status !== 'pending_question') {
            lastActiveCourseRef.current = null;
        }
    }, [playerStats, showToast, showQuestionModal]);

    // Optimized timer for active course
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Skip if question modal is showing
        if (showQuestionModal) {
            return;
        }

        if (playerStats?.activeCourse?.status === 'in_progress') {
            const checkAndUpdate = async () => {
                const remaining = getRemainingTime(playerStats.activeCourse);
                setRemainingTime(remaining);

                if (remaining <= 0 && intervalRef.current) {
                    // Clear interval immediately to prevent multiple calls
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;

                    // Check completion after a short delay
                    setTimeout(async () => {
                        const completed = await checkCourseCompletion(currentUser!.uid);
                        if (!completed) {
                            // Course might be pending question, refresh stats to get updated status
                            await refreshStats();
                        } else {
                            await refreshStats();
                            showToast('Kursus lõpetatud!', 'success');
                        }
                    }, 1100);
                }
            };

            // Initial check
            checkAndUpdate();

            // Set up interval for updates
            intervalRef.current = setInterval(checkAndUpdate, 1000);
        } else {
            setRemainingTime(0);
        }

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playerStats?.activeCourse, currentUser, refreshStats, showToast, showQuestionModal]);

    // Handle question answered correctly
    const handleQuestionAnswered = async () => {
        questionCheckRef.current = false;
        setShowQuestionModal(false);
        setQuestionCourse(null);
        await refreshStats();
        // Toast is shown by the modal itself
    };

    // Handle modal close (for wrong answers)
    const handleQuestionModalClose = () => {
        questionCheckRef.current = false;
        setShowQuestionModal(false);
        setQuestionCourse(null);
        refreshStats(); // Refresh to show course as completed
    };

    // Better error handling for enrollment
    const handleEnrollCourse = useCallback(async (courseId: string) => {
        if (!currentUser || enrolling) return;

        setEnrolling(true);
        try {
            await enrollInCourse(currentUser.uid, courseId);
            showToast('Koolitusele registreeritud!', 'success');
            await refreshStats(); // Ensure UI updates immediately
        } catch (error: any) {
            showToast(error.message || 'Koolitusele registreerimine ebaõnnestus', 'error');
        } finally {
            setEnrolling(false);
        }
    }, [currentUser, enrolling, showToast, refreshStats]);

    // Better booster handling
    const handleBoosterApplied = useCallback(async () => {
        await refreshStats();
        showToast('Kiirendaja rakendatud!', 'success');
    }, [refreshStats, showToast]);

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="page-content">
                    <div className="loading">Laadin koolitusi...</div>
                </main>
            </div>
        );
    }

    const activeCourse = playerStats?.activeCourse?.status === 'in_progress'
        ? getCourseById(playerStats.activeCourse.courseId)
        : null;

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="courses-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="courses-title">Koolitused</h1>

                {activeCourse && remainingTime > 0 && (
                    <ActiveCourseProgress
                        course={activeCourse}
                        remainingTime={remainingTime}
                    />
                )}

                {playerStats?.activeWork && (
                    <div className="work-in-progress-notice">
                        <p>⚠️ Sa ei saa võtta uut koolitust, kuni töö on lõppenud.</p>
                    </div>
                )}

                {playerStats?.activeCourse && playerStats.activeCourse.status === 'in_progress' && (
                    <CourseBoosterPanel
                        inventory={playerStats.inventory || []}
                        currentUserId={currentUser!.uid}
                        activeCourseEndTime={
                            playerStats.activeCourse.endsAt instanceof Timestamp
                                ? playerStats.activeCourse.endsAt.toDate()
                                : new Date(playerStats.activeCourse.endsAt)
                        }
                        onBoosterApplied={handleBoosterApplied}
                        boosterAlreadyUsed={playerStats.activeCourse?.boosterUsed}
                    />
                )}

                <CourseTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    playerStats={playerStats}
                    courseCounts={courseCounts}
                />

                <CoursesList
                    courses={displayedCourses}
                    isCompleted={activeTab === 'completed'}
                    isStatusTab={isStatusTab}
                    statusCategory={isStatusTab ? activeTab : undefined}
                    onEnroll={handleEnrollCourse}
                    isEnrolling={enrolling}
                    hasActiveCourse={!!activeCourse}
                    activeCourseId={playerStats?.activeCourse?.courseId}
                    remainingTime={remainingTime}
                    playerStats={playerStats || undefined}
                />
            </main>

            {/* Question Modal */}
            {questionCourse && (
                <CourseQuestionModal
                    course={questionCourse}
                    isOpen={showQuestionModal}
                    onClose={handleQuestionModalClose}
                    onAnswerCorrect={handleQuestionAnswered}
                />
            )}
        </div>
    );
};

export default CoursesPage;