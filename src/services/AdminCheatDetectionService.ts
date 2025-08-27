// src/services/AdminCheatDetectionService.ts
import {
    collection,
    getDocs,
    query,
    where,
    Timestamp,
    addDoc,
    orderBy,
    limit
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats, WorkHistoryEntry } from '../types';

export interface SuspiciousActivity {
    userId: string;
    username: string;
    type: 'course' | 'work';
    activityName: string;
    completedAt: Date;
    minutesInFuture: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    detectedAt: Date;
}

export interface CheatLogEntry {
    id?: string;
    userId: string;
    username: string;
    type: 'course' | 'work';
    activityName: string;
    completedAt: Date;
    minutesInFuture: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    detectedAt: Date;
    adminNotes?: string;
}

export interface CheatDetectionResults {
    suspiciousActivities: SuspiciousActivity[];
    playersChecked: number;
    totalSuspiciousCount: number;
    severityCounts: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    topOffenders: Array<{
        userId: string;
        username: string;
        violationCount: number;
        maxSeverity: string;
    }>;
}

// Define severity type for type safety
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const getSeverityLevel = (minutesInFuture: number): SeverityLevel => {
    if (minutesInFuture > 1440) return 'critical';   // More than 24 hours in future
    if (minutesInFuture > 240) return 'high';        // 4-24 hours in future
    if (minutesInFuture > 60) return 'medium';       // 1-4 hours in future
    return 'low';                                    // Less than 1 hour
};

export const getSeverityColor = (severity: string): string => {
    switch (severity) {
        case 'critical': return '#ff3838';
        case 'high': return '#ff6b35';
        case 'medium': return '#ffa502';
        case 'low': return '#747d8c';
        default: return '#747d8c';
    }
};

export const getSeverityIcon = (severity: string): string => {
    switch (severity) {
        case 'critical': return '🚨';
        case 'high': return '⚠️';
        case 'medium': return '⚡';
        case 'low': return '📝';
        default: return '❓';
    }
};

// Helper function to get severity order value
const getSeverityOrder = (severity: string): number => {
    const severityOrder: Record<SeverityLevel, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
    };
    return severityOrder[severity as SeverityLevel] || 0;
};

// Log suspicious activity to database
const logSuspiciousActivity = async (activity: SuspiciousActivity): Promise<void> => {
    try {
        const logEntry: CheatLogEntry = {
            userId: activity.userId,
            username: activity.username,
            type: activity.type,
            activityName: activity.activityName,
            completedAt: activity.completedAt,
            minutesInFuture: activity.minutesInFuture,
            severity: activity.severity,
            details: activity.details,
            detectedAt: activity.detectedAt
        };

        await addDoc(collection(firestore, 'cheatDetectionLogs'), {
            ...logEntry,
            completedAt: Timestamp.fromDate(logEntry.completedAt),
            detectedAt: Timestamp.fromDate(logEntry.detectedAt)
        });
    } catch (error) {
        console.error('Error logging suspicious activity:', error);
    }
};

export const detectTimeManipulation = async (): Promise<CheatDetectionResults> => {
    const now = new Date();
    const suspiciousActivities: SuspiciousActivity[] = [];
    let playersChecked = 0;
    const playerViolations = new Map<string, { count: number; maxSeverity: string; username: string }>();

    try {
        const playerStatsCollection = collection(firestore, 'playerStats');
        const statsSnapshot = await getDocs(playerStatsCollection);

        for (const statsDoc of statsSnapshot.docs) {
            playersChecked++;
            const stats = statsDoc.data() as PlayerStats;
            const username = stats.username || `User-${statsDoc.id.slice(0, 8)}`;

            // Check active course START times (suspicious if started in future)
            if (stats.activeCourse?.startedAt) {
                let courseStartTime: Date;

                if (stats.activeCourse.startedAt instanceof Timestamp) {
                    courseStartTime = stats.activeCourse.startedAt.toDate();
                } else if (typeof stats.activeCourse.startedAt === 'object' && 'seconds' in stats.activeCourse.startedAt) {
                    courseStartTime = new Date(stats.activeCourse.startedAt.seconds * 1000);
                } else {
                    courseStartTime = new Date(stats.activeCourse.startedAt);
                }

                const minutesInFuture = (courseStartTime.getTime() - now.getTime()) / (1000 * 60);

                if (minutesInFuture > 5) { // Allow 5 minute buffer for server time differences
                    const severity = getSeverityLevel(minutesInFuture);
                    const activity: SuspiciousActivity = {
                        userId: statsDoc.id,
                        username,
                        type: 'course',
                        activityName: stats.activeCourse.courseId,
                        completedAt: courseStartTime, // Using start time for display
                        minutesInFuture: Math.round(minutesInFuture),
                        severity,
                        details: `Course "${stats.activeCourse.courseId}" was STARTED ${Math.round(minutesInFuture)} minutes in the future`,
                        detectedAt: now
                    };

                    suspiciousActivities.push(activity);
                    await logSuspiciousActivity(activity);

                    // Track violations per player
                    const existing = playerViolations.get(statsDoc.id);
                    if (existing) {
                        existing.count++;
                        if (severity === 'critical' || existing.maxSeverity !== 'critical') {
                            existing.maxSeverity = severity;
                        }
                    } else {
                        playerViolations.set(statsDoc.id, { count: 1, maxSeverity: severity, username });
                    }
                }
            }

            // Check active work START times (suspicious if started in future)
            if (stats.activeWork?.startedAt) {
                let workStartTime: Date;

                if (stats.activeWork.startedAt instanceof Timestamp) {
                    workStartTime = stats.activeWork.startedAt.toDate();
                } else if (typeof stats.activeWork.startedAt === 'object' && 'seconds' in stats.activeWork.startedAt) {
                    workStartTime = new Date(stats.activeWork.startedAt.seconds * 1000);
                } else {
                    workStartTime = new Date(stats.activeWork.startedAt);
                }

                const minutesInFuture = (workStartTime.getTime() - now.getTime()) / (1000 * 60);

                if (minutesInFuture > 5) { // Allow 5 minute buffer
                    const severity = getSeverityLevel(minutesInFuture);
                    const activity: SuspiciousActivity = {
                        userId: statsDoc.id,
                        username,
                        type: 'work',
                        activityName: stats.activeWork.workId,
                        completedAt: workStartTime, // Using start time for display
                        minutesInFuture: Math.round(minutesInFuture),
                        severity,
                        details: `Work "${stats.activeWork.workId}" was STARTED ${Math.round(minutesInFuture)} minutes in the future`,
                        detectedAt: now
                    };

                    suspiciousActivities.push(activity);
                    await logSuspiciousActivity(activity);

                    // Track violations per player
                    const existing = playerViolations.get(statsDoc.id);
                    if (existing) {
                        existing.count++;
                        if (severity === 'critical' || existing.maxSeverity !== 'critical') {
                            existing.maxSeverity = severity;
                        }
                    } else {
                        playerViolations.set(statsDoc.id, { count: 1, maxSeverity: severity, username });
                    }
                }
            }
        }

        // Also check work history for recently completed work with suspicious START timestamps
        const workHistoryCollection = collection(firestore, 'workHistory');
        const recentWorkQuery = query(
            workHistoryCollection,
            where('startedAt', '>', Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))) // Last 24 hours
        );

        const workHistorySnapshot = await getDocs(recentWorkQuery);

        for (const historyDoc of workHistorySnapshot.docs) {
            const workEntry = historyDoc.data() as WorkHistoryEntry;

            let startedAt: Date;
            if (workEntry.startedAt instanceof Timestamp) {
                startedAt = workEntry.startedAt.toDate();
            } else {
                startedAt = new Date(workEntry.startedAt);
            }

            const minutesInFuture = (startedAt.getTime() - now.getTime()) / (1000 * 60);

            if (minutesInFuture > 0) { // Any start time in the future is suspicious
                // Try to find username from player stats
                let username = workEntry.userId;
                const userStats = statsSnapshot.docs.find(doc => doc.id === workEntry.userId);
                if (userStats) {
                    username = userStats.data().username || workEntry.userId;
                }

                const severity = getSeverityLevel(minutesInFuture);
                const activity: SuspiciousActivity = {
                    userId: workEntry.userId,
                    username,
                    type: 'work',
                    activityName: workEntry.workName || workEntry.workId,
                    completedAt: startedAt,
                    minutesInFuture: Math.round(minutesInFuture),
                    severity,
                    details: `Work "${workEntry.workName || workEntry.workId}" was STARTED ${Math.round(minutesInFuture)} minutes in the future (completed work)`,
                    detectedAt: now
                };

                suspiciousActivities.push(activity);
                await logSuspiciousActivity(activity);
            }
        }

        // Rest of the function remains the same...
        // Sort by severity and time
        suspiciousActivities.sort((a, b) => {
            const severityOrderA = getSeverityOrder(a.severity);
            const severityOrderB = getSeverityOrder(b.severity);

            if (severityOrderA !== severityOrderB) {
                return severityOrderB - severityOrderA;
            }
            return b.minutesInFuture - a.minutesInFuture;
        });

        // Calculate severity counts
        const severityCounts = {
            critical: suspiciousActivities.filter(a => a.severity === 'critical').length,
            high: suspiciousActivities.filter(a => a.severity === 'high').length,
            medium: suspiciousActivities.filter(a => a.severity === 'medium').length,
            low: suspiciousActivities.filter(a => a.severity === 'low').length,
        };

        // Get top offenders
        const topOffenders = Array.from(playerViolations.entries())
            .map(([userId, data]) => ({
                userId,
                username: data.username,
                violationCount: data.count,
                maxSeverity: data.maxSeverity
            }))
            .sort((a, b) => {
                const severityOrderA = getSeverityOrder(a.maxSeverity);
                const severityOrderB = getSeverityOrder(b.maxSeverity);

                if (severityOrderA !== severityOrderB) {
                    return severityOrderB - severityOrderA;
                }
                return b.violationCount - a.violationCount;
            })
            .slice(0, 5);

        return {
            suspiciousActivities,
            playersChecked,
            totalSuspiciousCount: suspiciousActivities.length,
            severityCounts,
            topOffenders
        };

    } catch (error) {
        console.error('Error detecting time manipulation:', error);
        throw new Error(`Detection failed: ${error}`);
    }
};

// Get recent cheat logs
export const getRecentCheatLogs = async (limitCount: number = 50): Promise<CheatLogEntry[]> => {
    try {
        const logsQuery = query(
            collection(firestore, 'cheatDetectionLogs'),
            orderBy('detectedAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(logsQuery);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                completedAt: data.completedAt.toDate(),
                detectedAt: data.detectedAt.toDate()
            } as CheatLogEntry;
        });
    } catch (error) {
        console.error('Error fetching cheat logs:', error);
        return [];
    }
};