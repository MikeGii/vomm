// src/services/CourseService.ts (updated version)
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Course, ActiveCourse, PlayerStats } from '../types';
import { ALL_COURSES, getCourseById } from '../data/courses';

// Get courses available for player
export const getAvailableCourses = (playerStats: PlayerStats): Course[] => {
    return ALL_COURSES.filter(course => {
        // Check level requirement
        if (course.requirements.level && playerStats.level < course.requirements.level) {
            return false;
        }

        // Check reputation requirement
        if (course.requirements.reputation && playerStats.reputation < course.requirements.reputation) {
            return false;
        }

        // Check prerequisite courses
        if (course.requirements.completedCourses) {
            const hasAllPrerequisites = course.requirements.completedCourses.every(
                courseId => playerStats.completedCourses?.includes(courseId)
            );
            if (!hasAllPrerequisites) return false;
        }

        // Don't show already completed courses
        if (playerStats.completedCourses?.includes(course.id)) {
            return false;
        }

        return true;
    });
};

// Enroll in a course
export const enrollInCourse = async (userId: string, courseId: string): Promise<ActiveCourse> => {
    const course = getCourseById(courseId);
    if (!course) {
        throw new Error('Koolitus ei ole saadaval');
    }

    // Check if player already has an active course
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (playerStats.activeCourse && playerStats.activeCourse.status === 'in_progress') {
        throw new Error('Sul on juba käimas üks koolitus!');
    }

    // Create active course with server timestamp
    const now = new Date();
    const endsAt = new Date(now.getTime() + course.duration * 1000);

    const activeCourse: ActiveCourse = {
        courseId: course.id,
        userId: userId,
        startedAt: now,
        endsAt: endsAt,
        status: 'in_progress'
    };

    // Update player stats with active course
    await updateDoc(playerStatsRef, {
        activeCourse: activeCourse
    });

    // Also store in activeCourses collection for querying
    await setDoc(doc(firestore, 'activeCourses', `${userId}_${courseId}`), {
        ...activeCourse,
        startedAt: serverTimestamp(),
        endsAt: Timestamp.fromDate(endsAt)
    });

    return activeCourse;
};

// Check and complete course if time is up
export const checkCourseCompletion = async (userId: string): Promise<boolean> => {
    const playerStatsRef = doc(firestore, 'playerStats', userId);
    const playerStatsDoc = await getDoc(playerStatsRef);
    const playerStats = playerStatsDoc.data() as PlayerStats;

    if (!playerStats.activeCourse || playerStats.activeCourse.status !== 'in_progress') {
        return false;
    }

    const now = new Date();
    const endsAt = new Date(playerStats.activeCourse.endsAt);

    if (now >= endsAt) {
        // Course is complete
        const course = getCourseById(playerStats.activeCourse.courseId);
        if (!course) return false;

        // Update player stats with rewards
        const updates: any = {
            activeCourse: {
                ...playerStats.activeCourse,
                status: 'completed'
            },
            completedCourses: [...(playerStats.completedCourses || []), course.id],
            experience: playerStats.experience + course.rewards.experience
        };

        if (course.rewards.reputation) {
            updates.reputation = playerStats.reputation + course.rewards.reputation;
        }

        if (course.rewards.unlocksRank) {
            updates.rank = course.rewards.unlocksRank;
            updates.isEmployed = true;
            updates.hasCompletedTraining = true;
            updates.department = 'Patrulltalitus';

            // Generate badge number if first employment
            if (!playerStats.badgeNumber) {
                updates.badgeNumber = Math.floor(10000 + Math.random() * 90000).toString();
            }
        }

        await updateDoc(playerStatsRef, updates);

        // Update active course record
        await updateDoc(doc(firestore, 'activeCourses', `${userId}_${course.id}`), {
            status: 'completed'
        });

        return true;
    }

    return false;
};

// Get remaining time for active course
export const getRemainingTime = (activeCourse: ActiveCourse): number => {
    const now = new Date();
    const endsAt = new Date(activeCourse.endsAt);
    const remaining = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));
    return remaining;
};

// Get completed courses details
export const getCompletedCoursesDetails = (completedCourseIds: string[]): Course[] => {
    return completedCourseIds
        .map(id => getCourseById(id))
        .filter((course): course is Course => course !== undefined);
};