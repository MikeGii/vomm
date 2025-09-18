// src/pages/ProfilePage.tsx
import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { ProfileAttributes } from '../components/profile/ProfileAttributes';
import { ProfileSkills } from '../components/profile/ProfileSkills';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { initializeAttributes } from '../services/TrainingService';
import { ProfileInventory } from "../components/profile/ProfileInventory";
import { CharacterEquipment } from '../components/profile/CharacterEquipment';
import { equipItem, unequipItem } from '../services/EquipmentService';
import { usePageTracking } from '../hooks/usePageTracking';
import '../styles/pages/Profile.css';

const ProfilePage: React.FC = () => {
    usePageTracking('ProfilePage');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading } = usePlayerStats();

    const inventory = playerStats?.inventory || [];
    const equipment = playerStats?.equipment || {};

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

                <ProfileAttributes
                    attributes={playerStats.attributes || initializeAttributes()}
                    equipment={playerStats.equipment}
                />
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
                                // The context listener will update the UI automatically
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
                                // The context listener will update the UI automatically
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