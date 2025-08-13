// src/pages/CoursesPage.tsx (simplified)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ActiveCourseProgress } from '../components/courses/ActiveCourseProgress';
import { CourseTabs } from '../components/courses/CourseTabs';
import { CoursesList } from '../components/courses/CoursesList';
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

    useEffect(() => {
        loadData();
    }, [currentUser]);

    useEffect(() => {
        if (playerStats?.activeCourse?.status === 'in_progress') {
            const interval = setInterval(() => {
                const remaining = getRemainingTime(playerStats.activeCourse!);
                setRemainingTime(remaining);

                if (remaining === 0) {
                    handleCourseCompletion();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [playerStats?.activeCourse]);

    const loadData = async () => {
        if (!currentUser) return;

        try {
            const stats = await getPlayerStats(currentUser.uid);
            if (stats) {
                setPlayerStats(stats);

                if (!stats.tutorialProgress.isCompleted && stats.tutorialProgress.currentStep === 3) {
                    await updateTutorialProgress(currentUser.uid, 4, true);
                }

                const available = getAvailableCourses(stats);
                setAvailableCourses(available);

                if (stats.completedCourses && stats.completedCourses.length > 0) {
                    const completed = getCompletedCoursesDetails(stats.completedCourses);
                    setCompletedCourses(completed);
                }

                if (stats.activeCourse?.status === 'in_progress') {
                    setRemainingTime(getRemainingTime(stats.activeCourse));
                }
            }
        } catch (error) {
            console.error('Viga andmete laadimisel:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseCompletion = async () => {
        if (!currentUser) return;

        try {
            const completed = await checkCourseCompletion(currentUser.uid);
            if (completed) {
                alert('Õnnitleme! Koolitus on edukalt läbitud!');
                await loadData();
            }
        } catch (error) {
            console.error('Viga koolituse lõpetamisel:', error);
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
                    />
                ) : (
                    <CoursesList
                        courses={completedCourses}
                        isCompleted={true}
                    />
                )}
            </main>
        </div>
    );
};

export default CoursesPage;