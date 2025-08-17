// src/components/dashboard/HealthRecoveryManager.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkAndApplyHealthRecovery } from '../../services/HealthService';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { PlayerStats } from '../../types';

export const HealthRecoveryManager: React.FC = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const initializeHealthTracking = async () => {
            const statsRef = doc(firestore, 'playerStats', currentUser.uid);
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                const stats = statsDoc.data() as PlayerStats;

                if (stats.health && !stats.lastHealthUpdate) {
                    await updateDoc(statsRef, {
                        lastHealthUpdate: Timestamp.now()
                    });
                }
            }

            checkAndApplyHealthRecovery(currentUser.uid).catch(console.error);
        };

        initializeHealthTracking();

        const interval = setInterval(() => {
            checkAndApplyHealthRecovery(currentUser.uid).catch(console.error);
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [currentUser]);

    return null; // This component doesn't render anything
};