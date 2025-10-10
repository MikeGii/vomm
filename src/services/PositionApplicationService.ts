// src/services/PositionApplicationService.ts
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { PlayerStats } from '../types';

export class PositionApplicationService {
    async checkExistingApplications(username: string): Promise<Set<string>> {
        try {
            const pendingApplicationsQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', username),
                where('status', '==', 'pending')
            );

            const pendingApplications = await getDocs(pendingApplicationsQuery);
            const pendingPositionIds = new Set<string>();

            pendingApplications.forEach(doc => {
                pendingPositionIds.add(doc.data().positionId);
            });

            return pendingPositionIds;
        } catch (error) {
            console.error('Error checking existing applications:', error);
            return new Set();
        }
    }

    async canSubmitApplication(username: string, positionId: string): Promise<{ canApply: boolean; message?: string }> {
        try {
            // Check if already applied for this position
            const existingApplicationQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', username),
                where('positionId', '==', positionId),
                where('status', '==', 'pending')
            );

            const existingApplications = await getDocs(existingApplicationQuery);
            if (!existingApplications.empty) {
                return { canApply: false, message: 'Sul on juba sellele positsioonile avaldus esitatud' };
            }

            // Check total pending applications limit
            const allPendingApplicationsQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', username),
                where('status', '==', 'pending')
            );

            const allPendingApplications = await getDocs(allPendingApplicationsQuery);
            if (allPendingApplications.size >= 3) {
                return { canApply: false, message: 'Sul võib olla korraga maksimaalselt 3 ootel olevat avaldust' };
            }

            return { canApply: true };
        } catch (error) {
            console.error('Error checking application eligibility:', error);
            return { canApply: false, message: 'Viga kontrollimisel' };
        }
    }

    async submitApplication(playerStats: PlayerStats, currentUserUid: string, positionId: string): Promise<void> {
        const applicationData = {
            applicantId: playerStats.username,
            applicantUserId: currentUserUid,
            positionId: positionId,
            department: playerStats.department,
            prefecture: playerStats.prefecture,
            appliedAt: new Date(),
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            status: 'pending',
            votes: [],
            applicantData: {
                level: playerStats.level,
                totalWorkedHours: playerStats.totalWorkedHours || 0,
                reputation: playerStats.reputation || 0,
                completedCourses: playerStats.completedCourses || [],
                currentPosition: playerStats.policePosition,
                currentUnit: playerStats.departmentUnit,
                attributes: playerStats.attributes ? {
                    strength: playerStats.attributes.strength.level,
                    agility: playerStats.attributes.agility.level,
                    dexterity: playerStats.attributes.dexterity.level,
                    intelligence: playerStats.attributes.intelligence.level,
                    endurance: playerStats.attributes.endurance.level
                } : null
            }
        };

        await addDoc(collection(firestore, 'applications'), applicationData);
    }
}