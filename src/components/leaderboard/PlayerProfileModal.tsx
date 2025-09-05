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
    const isVipPlayer = playerData?.isVip === true;

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
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-content player-profile-modal ${isVipPlayer ? 'vip-profile' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close-btn" onClick={onClose}>×</button>

                <div className="profile-header">
                    <div className="profile-info">
                        <h2 className="profile-username">{playerData.username}</h2>
                        <div className="profile-badges">
                            {playerData.badgeNumber && (
                                <span className="profile-badge">#{playerData.badgeNumber}</span>
                            )}
                            <span className="profile-badge">{getPlayerStatus()}</span>
                            {playerData?.isVip && (
                                <span className="profile-badge profile-vip-badge">VIP</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-stats-grid">
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Tase</span>
                        <span className="profile-stat-value">{playerData.level}</span>
                    </div>
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Maine</span>
                        <span className="profile-stat-value">{playerData.reputation}</span>
                    </div>
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Raha</span>
                        <span className="profile-stat-value">{formatMoney(playerData.money)}</span>
                    </div>
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Töötunnid</span>
                        <span className="profile-stat-value">{playerData.totalWorkedHours || 0}h</span>
                    </div>
                </div>

                {/* Estate Section */}
                {(estateData || estateLoading) && (
                    <div className="profile-estate-section">
                        <h3 className="profile-section-title">Kinnisvara</h3>
                        {estateLoading ? (
                            <p className="estate-loading">Laen andmeid...</p>
                        ) : estateData?.currentEstate ? (
                            <p className="estate-name">{estateData.currentEstate.name}</p>
                        ) : (
                            <p className="no-estate">Pole kinnisasja</p>
                        )}
                    </div>
                )}

                {/* Attributes Section */}
                {playerData.attributes && (
                    <div className="profile-attributes">
                        <h3 className="profile-section-title">Omadused</h3>
                        <div className="profile-attributes-grid">
                            {[
                                { key: 'strength', emoji: '💪' },
                                { key: 'agility', emoji: '🏃' },
                                { key: 'dexterity', emoji: '🎯' },
                                { key: 'intelligence', emoji: '🧠' },
                                { key: 'endurance', emoji: '🏋️' },
                                { key: 'cooking', emoji: '🍳' },
                                { key: 'brewing', emoji: '🥤' },
                                { key: 'chemistry', emoji: '🧪' },
                                { key: 'sewing', emoji: '🪡' },
                                { key: 'medicine', emoji: '🏥' },
                                { key: 'printing', emoji: getAttributeIcon('printing') },
                                { key: 'lasercutting', emoji: getAttributeIcon('lasercutting') }
                            ].map(attr => (
                                <div key={attr.key} className="profile-attribute">
                                    <span className="profile-attribute-icon">{attr.emoji}</span>
                                    <span className="profile-attribute-level">
                                    {getAttributeValue(attr.key)}
                                </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer info */}
                <div className="profile-footer">
                    <p className="profile-joined">Liitunud: {formatDate(playerData.createdAt)}</p>
                </div>
            </div>
        </div>
    );
};