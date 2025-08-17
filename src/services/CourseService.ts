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
import { ABILITIES} from "../data/abilities";
import { ABIPOLITSEINIK_UNIFORM } from '../data/equipment';

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

        // Show the course even if other requirements (level, reputation, attributes) aren't met
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

    // Handle endsAt timestamp (same as before)
    let endsAtMillis: number;
    if (playerStats.activeCourse.endsAt instanceof Timestamp) {
        endsAtMillis = playerStats.activeCourse.endsAt.toMillis();
    } else if (playerStats.activeCourse.endsAt && typeof playerStats.activeCourse.endsAt === 'object' && 'seconds' in playerStats.activeCourse.endsAt) {
        endsAtMillis = playerStats.activeCourse.endsAt.seconds * 1000;
    } else {
        endsAtMillis = new Date(playerStats.activeCourse.endsAt).getTime();
    }

    const nowWithBuffer = now.toMillis() + 1000;

    if (nowWithBuffer >= endsAtMillis) {
        const course = getCourseById(playerStats.activeCourse.courseId);
        if (!course) return false;

        // Calculate new level
        const newExperience = playerStats.experience + course.rewards.experience;
        const newLevel = calculateLevelFromExp(newExperience);

        // Build updates object
        const updates: any = {
            activeCourse: null,
            completedCourses: [...(playerStats.completedCourses || []), course.id],
            experience: newExperience,
            level: newLevel
        };

        // Handle money reward
        if (course.rewards.money) {
            updates.money = (playerStats.money || 0) + course.rewards.money;
        }

        // Handle reputation
        if (course.rewards.reputation) {
            updates.reputation = playerStats.reputation + course.rewards.reputation;
        }

        // UNIVERSAL ABILITY HANDLING
        let currentAbilities = playerStats.abilities || [];

        // If course grants a new ability
        if (course.rewards.grantsAbility) {
            // Add the new ability if not already present
            if (!currentAbilities.includes(course.rewards.grantsAbility)) {
                currentAbilities.push(course.rewards.grantsAbility);
            }

            // If this ability replaces another one, remove the old one
            if (course.rewards.replacesAbility) {
                currentAbilities = currentAbilities.filter(
                    abilityId => abilityId !== course.rewards.replacesAbility
                );
            }
        }

        // Also check for abilities from newly completed courses (backward compatibility)
        const allCompletedCourses = [...(playerStats.completedCourses || []), course.id];
        const courseBasedAbilities = ABILITIES
            .filter(ability => allCompletedCourses.includes(ability.requiredCourse))
            .map(ability => ability.id);

        // Merge abilities from both systems
        let mergedAbilities = Array.from(new Set([...currentAbilities, ...courseBasedAbilities]));

        // Apply replacements based on ability definitions
        const finalAbilities = mergedAbilities.filter(abilityId => {
            const ability = ABILITIES.find(a => a.id === abilityId);
            if (ability?.replacedBy) {
                // Keep this ability only if its replacement is not in the list
                return !mergedAbilities.includes(ability.replacedBy);
            }
            return true;
        });

        updates.abilities = finalAbilities;

        // Handle special course completions (same as before)
        if (course.id === 'basic_police_training_abipolitseinik') {
            updates.hasCompletedTraining = true;
            updates.isEmployed = true;
            updates.badgeNumber = Math.floor(10000 + Math.random() * 90000).toString();

            // ADD THIS: Grant uniform items to inventory
            const uniformItems = ABIPOLITSEINIK_UNIFORM.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                category: 'equipment' as const,
                quantity: 1,
                rarity: item.rarity,
                equipped: false,
                equipmentSlot: item.slot,
                source: 'training' as const
            }));

            // Add uniform items to existing inventory
            updates.inventory = [...(playerStats.inventory || []), ...uniformItems];

        } else if (course.id === 'sisekaitseakadeemia_entrance') {
            updates.rank = course.rewards.unlocksRank || 'Nooreminspektor';
            updates.isEmployed = true;
            updates.hasCompletedTraining = true;
            updates.prefecture = 'Sisekaitseakadeemia';
            updates.department = 'Politsei- ja Piirivalvekolledž';
            if (!playerStats.badgeNumber) {
                updates.badgeNumber = Math.floor(10000 + Math.random() * 90000).toString();
            }
        } else if (course.rewards.unlocksRank) {
            updates.rank = course.rewards.unlocksRank;
            updates.isEmployed = true;
            updates.hasCompletedTraining = true;
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