import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ActiveCourseProgress } from '../components/courses/ActiveCourseProgress';
import { CourseTabs } from '../components/courses/CourseTabs';
import { CoursesList } from '../components/courses/CoursesList';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats, Course } from '../types';
import { updateTutorialProgress } from '../services/PlayerService';
import {
    getAvailableCourses,
    enrollInCourse,
    checkCourseCompletion,
    getRemainingTime,
    getCompletedCoursesDetails
} from '../services/CourseService';
import { getCourseById } from '../data/courses';
import '../styles/pages/Courses.css';

const CoursesPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastActiveCourseRef = useRef<string | null>(null);

    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
    const [showTutorial, setShowTutorial] = useState(false);
    const completionAlertShownRef = useRef<string | null>(null);

    // Process stats updates
    const processStatsUpdate = useCallback(async (stats: PlayerStats) => {
        // Update courses
        const available = getAvailableCourses(stats);
        setAvailableCourses(available);

        if (stats.completedCourses && stats.completedCourses.length > 0) {
            const completed = getCompletedCoursesDetails(stats.completedCourses);
            setCompletedCourses(completed);
        }

        // Check for course completion
        if (lastActiveCourseRef.current &&
            (!stats.activeCourse || stats.activeCourse.status !== 'in_progress')) {

            const completedCourse = getCourseById(lastActiveCourseRef.current);
            if (completedCourse &&
                stats.completedCourses?.includes(lastActiveCourseRef.current) &&
                completionAlertShownRef.current !== lastActiveCourseRef.current) {

                // Mark this alert as shown
                completionAlertShownRef.current = lastActiveCourseRef.current;

                // Course was just completed
                alert(`Õnnitleme! ${completedCourse.name} on edukalt läbitud!`);
                setRemainingTime(0);

                // Check if this was the basic training during tutorial
                if (completedCourse.id === 'basic_police_training' &&
                    !stats.tutorialProgress.isCompleted &&
                    stats.tutorialProgress.currentStep === 6 &&
                    currentUser) {
                    // Update tutorial progress to step 7
                    await updateTutorialProgress(currentUser.uid, 7);
                    setShowTutorial(true);
                }

                // Switch to completed tab
                setTimeout(() => {
                    setActiveTab('completed');
                }, 500);

                lastActiveCourseRef.current = null;
            }
        }

        // Update active course reference
        if (stats.activeCourse?.status === 'in_progress') {
            lastActiveCourseRef.current = stats.activeCourse.courseId;
        } else {
            lastActiveCourseRef.current = null;
        }

        // Check tutorial - updated to handle new steps
        if (!stats.tutorialProgress.isCompleted) {
            if ((stats.tutorialProgress.currentStep >= 3 && stats.tutorialProgress.currentStep <= 6) ||
                (stats.tutorialProgress.currentStep >= 7 && stats.tutorialProgress.currentStep <= 8)) {
                setShowTutorial(true);
            }
        }
    }, [currentUser]);

    // Set up real-time listener for player stats
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);

        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
                processStatsUpdate(stats);
                setLoading(false);
            }
        }, (error) => {
            console.error('Error listening to player stats:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, processStatsUpdate]);

    // Timer for active course
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (playerStats?.activeCourse?.status === 'in_progress') {
            const checkAndUpdate = async () => {
                const remaining = getRemainingTime(playerStats.activeCourse);
                setRemainingTime(remaining);

                if (remaining <= 0) {
                    // Clear interval immediately
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }

                    // Wait 1 second to ensure server time has passed
                    setTimeout(async () => {
                        await checkCourseCompletion(currentUser!.uid);
                    }, 1100);
                }
            };

            // Check immediately
            checkAndUpdate();

            // Then check every second
            intervalRef.current = setInterval(checkAndUpdate, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playerStats?.activeCourse, currentUser]);

    // Handle tutorial complete
    const handleTutorialComplete = useCallback(async () => {
        setShowTutorial(false);
        // Tutorial completion is handled in TutorialOverlay component
    }, []);

    const handleEnrollCourse = async (courseId: string) => {
        if (!currentUser || enrolling) return;

        setEnrolling(true);
        try {
            await enrollInCourse(currentUser.uid, courseId);
        } catch (error: any) {
            alert(error.message || 'Koolitusele registreerimine ebaõnnestus');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="page-content">
                    <div className="loading">Laadin...</div>
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

                <CourseTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    availableCount={availableCourses.length}
                    completedCount={completedCourses.length}
                />

                {activeTab === 'available' ? (
                    <CoursesList
                        courses={availableCourses}
                        onEnroll={handleEnrollCourse}
                        isEnrolling={enrolling}
                        hasActiveCourse={!!activeCourse}
                        activeCourseId={playerStats?.activeCourse?.courseId}
                        remainingTime={remainingTime}
                        playerStats={playerStats || undefined}
                    />
                ) : (
                    <CoursesList
                        courses={completedCourses}
                        isCompleted={true}
                        playerStats={playerStats || undefined}
                    />
                )}

                {showTutorial && playerStats && currentUser && (
                    <TutorialOverlay
                        stats={playerStats}
                        userId={currentUser.uid}
                        onTutorialComplete={handleTutorialComplete}
                        page="courses"
                    />
                )}
            </main>
        </div>
    );
};

export default CoursesPage;