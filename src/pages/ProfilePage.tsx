// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ProfileAttributes } from '../components/profile/ProfileAttributes';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { useAuth } from '../contexts/AuthContext';
import { PlayerStats } from '../types';
import { initializeAttributes } from '../services/TrainingService';
import { ProfileInventory} from "../components/profile/ProfileInventory";
import { CharacterEquipment } from '../components/profile/CharacterEquipment';
import { equipItem, unequipItem } from '../services/EquipmentService';
import '../styles/pages/Profile.css';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const inventory = playerStats?.inventory || [];
    const equipment = playerStats?.equipment || {};


    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                const stats = doc.data() as PlayerStats;
                setPlayerStats(stats);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error loading player stats:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="profile-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="profile-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    const attributes = playerStats.attributes || initializeAttributes();
    const abilities = playerStats.abilities || [];

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="profile-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="profile-title">Minu Profiil</h1>

                <ProfileAttributes attributes={attributes} />
                <ProfileSkills abilityIds={abilities} />
                <ProfileInventory items={inventory} />
                <CharacterEquipment
                    equipment={equipment}
                    inventory={inventory}
                    onEquip={async (slot, itemId) => {
                        if (!currentUser) return;

                        const item = inventory.find(i => i.id === itemId);
                        if (item) {
                            try {
                                await equipItem(currentUser.uid, slot, item);
                                // The real-time listener will update the UI automatically
                            } catch (error) {
                                console.error('Failed to equip item:', error);
                            }
                        }
                    }}
                    onUnequip={async (slot) => {
                        if (!currentUser) return;

                        const item = equipment[slot];
                        if (item) {
                            try {
                                await unequipItem(currentUser.uid, slot, item);
                                // The real-time listener will update the UI automatically
                            } catch (error) {
                                console.error('Failed to unequip item:', error);
                            }
                        }
                    }}
                />
            </main>
        </div>
    );
};

export default ProfilePage;