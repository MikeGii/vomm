// src/services/CourseService.ts (updated version with proper timestamp handling)
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
import {calculateLevelFromExp} from "./PlayerService";

// Get courses available for player
export const getAvailableCourses = (playerStats: PlayerStats): Course[] => {
    return ALL_COURSES.filter(course => {
        // Don't show already completed courses
        if (playerStats.completedCourses?.includes(course.id)) {
            return false;
        }

        // Check prerequisite courses - if prerequisites exist, they must be completed
        if (course.requirements.completedCourses) {
            const hasAllPrerequisites = course.requirements.completedCourses.every(
                courseId => playerStats.completedCourses?.includes(courseId)
            );
            // If prerequisites aren't met, don't show the course
            if (!hasAllPrerequisites) return false;
        }

        // Show the course even if other requirements (level, reputation) aren't met
        // The CourseCard will display which requirements are missing
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

    // Create active course with proper timestamps
    const now = Timestamp.now();
    const endsAtMillis = now.toMillis() + (course.duration * 1000);
    const endsAt = Timestamp.fromMillis(endsAtMillis);

    const activeCourse: ActiveCourse = {
        courseId: course.id,
        userId: userId,
        startedAt: now.toDate(),  // Convert to Date for local storage
        endsAt: Timestamp.fromMillis(endsAtMillis).toDate(),  // Convert to Date for local storage
        status: 'in_progress'
    };

    // Update player stats with active course
    await updateDoc(playerStatsRef, {
        activeCourse: {
            courseId: course.id,
            userId: userId,
            startedAt: now,  // Store as Timestamp in Firestore
            endsAt: endsAt,  // Store as Timestamp in Firestore
            status: 'in_progress'
        }
    });

    // Also store in activeCourses collection
    await setDoc(doc(firestore, 'activeCourses', `${userId}_${courseId}`), {
        courseId: course.id,
        userId: userId,
        startedAt: now,
        endsAt: endsAt,
        status: 'in_progress'
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

    const now = Timestamp.now();

    // Handle endsAt as either a Timestamp or a Date
    let endsAtMillis: number;
    if (playerStats.activeCourse.endsAt instanceof Timestamp) {
        endsAtMillis = playerStats.activeCourse.endsAt.toMillis();
    } else if (playerStats.activeCourse.endsAt && typeof playerStats.activeCourse.endsAt === 'object' && 'seconds' in playerStats.activeCourse.endsAt) {
        endsAtMillis = playerStats.activeCourse.endsAt.seconds * 1000;
    } else {
        endsAtMillis = new Date(playerStats.activeCourse.endsAt).getTime();
    }

    // Add a 1-second buffer to account for timing differences
    const nowWithBuffer = now.toMillis() + 1000;

    if (nowWithBuffer >= endsAtMillis) {
        // Course is complete
        const course = getCourseById(playerStats.activeCourse.courseId);
        if (!course) return false;

        // Calculate new level if experience increases
        const newExperience = playerStats.experience + course.rewards.experience;
        const newLevel = calculateLevelFromExp(newExperience);

        // Update player stats with rewards
        const updates: any = {
            activeCourse: null,
            completedCourses: [...(playerStats.completedCourses || []), course.id],
            experience: newExperience,
            level: newLevel
        };

        if (course.rewards.reputation) {
            updates.reputation = playerStats.reputation + course.rewards.reputation;
        }

        // Special handling for basic_police_training course
        if (course.id === 'basic_police_training') {
            // Mark as Abipolitseinik after basic training
            updates.hasCompletedTraining = true;
            updates.isEmployed = true;
            updates.badgeNumber = Math.floor(10000 + Math.random() * 90000).toString();
            // Don't set prefecture yet - will be selected through modal
            // Don't set rank - Abipolitseinik doesn't have ranks
        } else if (course.rewards.unlocksRank) {
            // For advanced courses that unlock actual police ranks
            updates.rank = course.rewards.unlocksRank;
            updates.isEmployed = true;
            updates.hasCompletedTraining = true;

            // Set default department if becoming a real police officer
            if (!playerStats.department) {
                updates.department = 'Patrulltalitus';
            }

            if (!playerStats.badgeNumber) {
                updates.badgeNumber = Math.floor(10000 + Math.random() * 90000).toString();
            }
        }

        await updateDoc(playerStatsRef, updates);

        // Update active course record
        const activeCourseRef = doc(firestore, 'activeCourses', `${userId}_${course.id}`);
        await updateDoc(activeCourseRef, {
            status: 'completed',
            completedAt: serverTimestamp()
        });

        return true;
    }

    return false;
};

// Get remaining time for active course (handle Firestore timestamps)
export const getRemainingTime = (activeCourse: ActiveCourse | any): number => {
    if (!activeCourse || activeCourse.status !== 'in_progress') {
        return 0;
    }

    const now = Date.now();

    // Handle endsAt as either a Timestamp, Firestore timestamp object, or Date
    let endsAtMillis: number;

    if (activeCourse.endsAt instanceof Timestamp) {
        endsAtMillis = activeCourse.endsAt.toMillis();
    } else if (activeCourse.endsAt && typeof activeCourse.endsAt === 'object' && 'seconds' in activeCourse.endsAt) {
        // Handle Firestore timestamp object
        endsAtMillis = activeCourse.endsAt.seconds * 1000;
    } else if (activeCourse.endsAt instanceof Date) {
        endsAtMillis = activeCourse.endsAt.getTime();
    } else {
        endsAtMillis = new Date(activeCourse.endsAt).getTime();
    }

    const remaining = Math.max(0, Math.floor((endsAtMillis - now) / 1000));
    return remaining;
};

// Get completed courses details
export const getCompletedCoursesDetails = (completedCourseIds: string[]): Course[] => {
    return completedCourseIds
        .map(id => getCourseById(id))
        .filter((course): course is Course => course !== undefined);
};