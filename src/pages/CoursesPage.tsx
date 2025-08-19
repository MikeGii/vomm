// src/pages/CoursesPage.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ActiveCourseProgress } from '../components/courses/ActiveCourseProgress';
import { CourseTabs } from '../components/courses/CourseTabs';
import { CoursesList } from '../components/courses/CoursesList';
import { CourseBoosterPanel } from '../components/courses/CourseBoosterPanel';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats, Course } from '../types';
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
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastActiveCourseRef = useRef<string | null>(null);
    const completionAlertShownRef = useRef<string | null>(null);

    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<TabType>('available');

    // Calculate courses for each tab
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

        // Get status-specific courses
        const abipolitseinikCourses = ALL_COURSES.filter(c => c.category === 'abipolitseinik');
        const sisekaitseakadeemiaCourses = ALL_COURSES.filter(c => c.category === 'sisekaitseakadeemia');
        const politseiCourses = ALL_COURSES.filter(c => c.category === 'politsei');


        return {
            available: availableCourses,
            completed: completedCourses,
            abipolitseinik: abipolitseinikCourses,
            sisekaitseakadeemia: sisekaitseakadeemiaCourses,
            politsei: politseiCourses
        };
    }, [availableCourses, completedCourses, playerStats]);

    // Calculate course counts for tabs
    const courseCounts = useMemo(() => {
        return {
            available: coursesForTab.available.length,
            completed: coursesForTab.completed.length,
            abipolitseinik: coursesForTab.abipolitseinik.length,
            sisekaitseakadeemia: coursesForTab.sisekaitseakadeemia.length,
            politsei: coursesForTab.politsei.length

        };
    }, [coursesForTab]);

    // Get currently displayed courses based on active tab
    const displayedCourses = useMemo(() => {
        return coursesForTab[activeTab] || [];
    }, [coursesForTab, activeTab]);

    // Check if current tab is a status tab
    const isStatusTab = activeTab !== 'available' && activeTab !== 'completed';

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

                lastActiveCourseRef.current = null;
            }
        }

        // Update active course reference
        if (stats.activeCourse?.status === 'in_progress') {
            lastActiveCourseRef.current = stats.activeCourse.courseId;
        } else {
            lastActiveCourseRef.current = null;
        }

    }, []);

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
                        onBoosterApplied={() => {
                            // Refresh player stats to show updated course time
                            window.location.reload(); // Simple approach
                        }}
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
        </div>
    );
};

export default CoursesPage;