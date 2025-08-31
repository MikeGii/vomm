// src/components/modals/PlayerProfileModal.tsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { PlayerProfileModalData, FirestoreTimestamp, PlayerStats } from '../../types';
import { PlayerEstate } from '../../types/estate';
import { getPlayerDisplayStatus } from '../../utils/playerStatus';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from "../../contexts/AuthContext";
import '../../styles/components/leaderboard/PlayerProfileModal.css';

interface PlayerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerData: PlayerProfileModalData | null;
    loading?: boolean;
}

const getPlayerEstateInfo = async (userId: string): Promise<PlayerEstate | null> => {
    try {
        const estateDoc = await getDoc(doc(firestore, 'playerEstates', userId));
        if (estateDoc.exists()) {
            const data = estateDoc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as PlayerEstate;
        }
        return null;
    } catch (error) {
        console.error('Error fetching player estate:', error);
        return null;
    }
};

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          playerData,
                                                                          loading = false
                                                                      }) => {
    const { playerEstate, canUse3DPrinter, canUseLaserCutter } = useEstate();
    const { currentUser } = useAuth();
    const [otherPlayerEstate, setOtherPlayerEstate] = useState<PlayerEstate | null>(null);
    const [estateLoading, setEstateLoading] = useState(false);

    const isCurrentUserProfile = currentUser?.uid === playerData?.userId;

    // Load estate data for other players
    useEffect(() => {
        if (isOpen && playerData && !isCurrentUserProfile) {
            const loadOtherPlayerEstate = async () => {
                setEstateLoading(true);
                try {
                    const estate = await getPlayerEstateInfo(playerData.userId);
                    setOtherPlayerEstate(estate);
                } catch (error) {
                    console.error('Failed to load other player estate:', error);
                    setOtherPlayerEstate(null);
                } finally {
                    setEstateLoading(false);
                }
            };
            loadOtherPlayerEstate();
        } else if (!isOpen) {
            setOtherPlayerEstate(null);
            setEstateLoading(false);
        }
    }, [isOpen, playerData, isCurrentUserProfile]);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    // Get the appropriate estate data
    const getEstateData = () => {
        if (isCurrentUserProfile) {
            return playerEstate;
        }
        return otherPlayerEstate;
    };

    const estateData = getEstateData();

    const formatDate = (date: Date | Timestamp | FirestoreTimestamp | undefined): string => {
        if (!date) return 'Teadmata';

        try {
            let actualDate: Date;
            if (date instanceof Timestamp) {
                actualDate = date.toDate();
            } else if (typeof date === 'object' && date !== null && 'seconds' in date) {
                actualDate = new Date((date as FirestoreTimestamp).seconds * 1000);
            } else if (date instanceof Date) {
                actualDate = date;
            } else {
                actualDate = new Date(date as any);
            }

            return isNaN(actualDate.getTime()) ? 'Teadmata' :
                new Intl.DateTimeFormat('et-EE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(actualDate);
        } catch {
            return 'Teadmata';
        }
    };

    const formatMoney = (amount: number): string => {
        return new Intl.NumberFormat('et-EE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getPlayerStatus = (): string => {
        const playerStats = {
            policePosition: playerData?.policePosition || null,
            completedCourses: playerData?.completedCourses || []
        } as PlayerStats;
        return getPlayerDisplayStatus(playerStats);
    };

    const getAttributeIcon = (attributeKey: string): string => {
        const standardIcons = { printing: '🖨️', lasercutting: '✂️' };

        if (!isCurrentUserProfile) {
            return standardIcons[attributeKey as keyof typeof standardIcons] || '📊';
        }

        const icons = {
            printing: canUse3DPrinter() ? '🖨️' : '🔒',
            lasercutting: canUseLaserCutter() ? '✂️' : '🔒'
        };
        return icons[attributeKey as keyof typeof icons] || '📊';
    };

    const getAttributeValue = (attributeKey: string): string | number => {
        if (!playerData?.attributes) return 0;

        const attr = playerData.attributes[attributeKey as keyof typeof playerData.attributes];
        const level = attr?.level || 0;

        if (!isCurrentUserProfile) return level;

        if (attributeKey === 'printing' && !canUse3DPrinter()) return '🔒';
        if (attributeKey === 'lasercutting' && !canUseLaserCutter()) return '🔒';

        return level;
    };

    if (!isOpen || !playerData) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content player-profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h2 className="modal-title">Mängija profiil</h2>

                <div className="player-profile-content">
                    {/* Player Name */}
                    <div className="profile-field">
                        <label>Nimi:</label>
                        <span>{playerData.username}</span>
                    </div>

                    {/* Badge Number */}
                    {playerData.badgeNumber && (
                        <div className="profile-field">
                            <label>Märgi number:</label>
                            <span className="badge-number">{playerData.badgeNumber}</span>
                        </div>
                    )}

                    {/* Status */}
                    <div className="profile-field">
                        <label>Staatus:</label>
                        <span className="status-badge">{getPlayerStatus()}</span>
                    </div>

                    {/* Level */}
                    <div className="profile-field">
                        <label>Tase:</label>
                        <span>{playerData.level}</span>
                    </div>

                    {/* Reputation */}
                    <div className="profile-field">
                        <label>Maine:</label>
                        <span>{playerData.reputation}</span>
                    </div>

                    {/* Money */}
                    <div className="profile-field">
                        <label>Raha:</label>
                        <span className="money-amount">{formatMoney(playerData.money)}</span>
                    </div>

                    {/* Completed Courses */}
                    <div className="profile-field">
                        <label>Läbitud koolitusi:</label>
                        <span className="courses-count">{playerData.completedCourses?.length || 0} tk</span>
                    </div>

                    {/* Work Hours */}
                    <div className="profile-field">
                        <label>Töötunnid:</label>
                        <span className="work-hours">{playerData.totalWorkedHours || 0}h</span>
                    </div>

                    {/* Estate Information - NOW PUBLIC FOR ALL PLAYERS */}
                    <div className="profile-field">
                        <label>Kinnisvara:</label>
                        <span>
                            {(!isCurrentUserProfile && estateLoading) ? (
                                <span className="estate-loading">Laen andmeid...</span>
                            ) : estateData?.currentEstate ? (
                                estateData.currentEstate.name
                            ) : (
                                <span className="no-estate-text">Pole kinnisasja</span>
                            )}
                        </span>
                    </div>

                    {/* Creation Date */}
                    <div className="profile-field">
                        <label>Liitunud:</label>
                        <span>{formatDate(playerData.createdAt)}</span>
                    </div>

                    {/* Attributes Section */}
                    {playerData.attributes && (
                        <div className="attributes-section">
                            <h3 className="section-title">Atribuudid</h3>
                            <div className="attributes-extended-grid">
                                {/* Physical Attributes */}
                                {[
                                    { key: 'strength', emoji: '💪', name: 'Jõud' },
                                    { key: 'agility', emoji: '🏃', name: 'Kiirus' },
                                    { key: 'dexterity', emoji: '🎯', name: 'Osavus' },
                                    { key: 'intelligence', emoji: '🧠', name: 'Int.' },
                                    { key: 'endurance', emoji: '🏋️', name: 'Vast.' },
                                    { key: 'cooking', emoji: '🍳', name: 'Söök' },
                                    { key: 'brewing', emoji: '🥤', name: 'Jook' },
                                    { key: 'chemistry', emoji: '🧪', name: 'Keem.' },
                                    { key: 'sewing', emoji: '🪡', name: 'Õmbl.' },
                                    { key: 'medicine', emoji: '🏥', name: 'Med.' }
                                ].map(attr => (
                                    <div key={attr.key} className="attribute-compact">
                                        <span className="attribute-emoji">{attr.emoji}</span>
                                        <span className="attribute-name">{attr.name}</span>
                                        <span className="attribute-value">
                                            {playerData.attributes?.[attr.key as keyof typeof playerData.attributes]?.level || 0}
                                        </span>
                                    </div>
                                ))}

                                {/* Workshop Attributes */}
                                {['printing', 'lasercutting'].map(skill => (
                                    <div
                                        key={skill}
                                        className={`attribute-compact ${
                                            isCurrentUserProfile &&
                                            ((skill === 'printing' && !canUse3DPrinter()) ||
                                                (skill === 'lasercutting' && !canUseLaserCutter()))
                                                ? 'locked' : ''
                                        }`}
                                    >
                                        <span className="attribute-emoji">{getAttributeIcon(skill)}</span>
                                        <span className="attribute-name">
                                            {skill === 'printing' ? '3D Print' : 'Laser'}
                                        </span>
                                        <span className="attribute-value">{getAttributeValue(skill)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};