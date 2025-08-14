// src/pages/CoursesPage.tsx (complete updated version)
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ActiveCourseProgress } from '../components/courses/ActiveCourseProgress';
import { CourseTabs } from '../components/courses/CourseTabs';
import { CoursesList } from '../components/courses/CoursesList';
import { TutorialOverlay } from '../components/tutorial/TutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats, Course } from '../types';
import { getPlayerStats, updateTutorialProgress } from '../services/PlayerService';
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
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
    const [showTutorial, setShowTutorial] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadData = useCallback(async () => {
        if (!currentUser) return;

        try {
            const stats = await getPlayerStats(currentUser.uid);
            if (stats) {
                setPlayerStats(stats);

                // Check if we should show the courses tutorial
                if (!stats.tutorialProgress.isCompleted &&
                    stats.tutorialProgress.currentStep >= 3 &&
                    stats.tutorialProgress.currentStep < 7) {
                    setShowTutorial(true);

                    if (stats.tutorialProgress.currentStep === 3) {
                        await updateTutorialProgress(currentUser.uid, 4);
                    }
                }

                const available = getAvailableCourses(stats);
                setAvailableCourses(available);

                if (stats.completedCourses && stats.completedCourses.length > 0) {
                    const completed = getCompletedCoursesDetails(stats.completedCourses);
                    setCompletedCourses(completed);
                }

                // Calculate remaining time if there's an active course
                if (stats.activeCourse?.status === 'in_progress') {
                    const remaining = getRemainingTime(stats.activeCourse);
                    setRemainingTime(remaining);
                    return true; // Return true if there's an active course
                } else {
                    setRemainingTime(0);
                    return false; // Return false if no active course
                }
            }
            return false;
        } catch (error) {
            console.error('Viga andmete laadimisel:', error);
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const handleCourseCompletion = useCallback(async () => {
        if (!currentUser) return;

        try {
            // Clear the interval first
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            const completedCourseId = playerStats?.activeCourse?.courseId;
            const completedCourse = completedCourseId ? getCourseById(completedCourseId) : null;

            // Check and complete the course
            const completed = await checkCourseCompletion(currentUser.uid);

            if (completed && completedCourse) {
                // Show success message
                alert(`Õnnitleme! ${completedCourse.name} on edukalt läbitud!`);

                // Reload all data
                const hasActiveCourse = await loadData();

                // If this was the first course, switch to completed tab
                if (playerStats?.completedCourses.length === 0) {
                    setTimeout(() => {
                        setActiveTab('completed');
                    }, 100);
                }

                // If no more active courses, ensure remaining time is 0
                if (!hasActiveCourse) {
                    setRemainingTime(0);
                }
            }
        } catch (error) {
            console.error('Viga koolituse lõpetamisel:', error);
        }
    }, [currentUser, playerStats, loadData]);

    // Timer effect for active course
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (playerStats?.activeCourse?.status === 'in_progress') {
            // Check immediately on mount
            checkCourseCompletion(currentUser!.uid).then(completed => {
                if (completed) {
                    handleCourseCompletion();
                    return;
                }
            });

            // Set initial remaining time
            const initialRemaining = getRemainingTime(playerStats.activeCourse);
            setRemainingTime(initialRemaining);

            // Update every second
            intervalRef.current = setInterval(async () => {
                if (playerStats.activeCourse) {
                    const remaining = getRemainingTime(playerStats.activeCourse);
                    setRemainingTime(remaining);

                    if (remaining <= 0) {
                        // Course time is up, complete it
                        await handleCourseCompletion();
                    }
                }
            }, 1000);
        }

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [playerStats?.activeCourse, currentUser, handleCourseCompletion]);

    // Initial data load
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleTutorialComplete = async () => {
        setShowTutorial(false);
        if (currentUser) {
            const updatedStats = await getPlayerStats(currentUser.uid);
            if (updatedStats) {
                setPlayerStats(updatedStats);
            }
        }
    };

    const handleEnrollCourse = async (courseId: string) => {
        if (!currentUser || enrolling) return;

        setEnrolling(true);
        try {
            await enrollInCourse(currentUser.uid, courseId);
            await loadData();
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
                    />
                ) : (
                    <CoursesList
                        courses={completedCourses}
                        isCompleted={true}
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