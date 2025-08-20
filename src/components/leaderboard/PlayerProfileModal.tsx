// src/components/modals/PlayerProfileModal.tsx
import React, { useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { PlayerProfileModalData, FirestoreTimestamp } from '../../types';
import '../../styles/components/leaderboard/PlayerProfileModal.css';

interface PlayerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerData: PlayerProfileModalData | null;
    loading?: boolean;
}

const getPlayerStatus = (completedCourses: string[] = []): string => {
    // If player has graduated from academy (completed lopueksam), show Politseiametnik
    if (completedCourses.includes('lopueksam')) {
        return 'Politseiametnik';
    }

    // If player has entered academy but not graduated, show Kadett
    if (completedCourses.includes('sisekaitseakadeemia_entrance') &&
        !completedCourses.includes('lopueksam')) {
        return 'Kadett';
    }

    // If player has completed basic training, show Abipolitseinik
    if (completedCourses.includes('basic_police_training_abipolitseinik')) {
        return 'Abipolitseinik';
    }

    return '—';
};

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
                                                                          isOpen,
                                                                          onClose,
                                                                          playerData,
                                                                          loading = false
                                                                      }) => {
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !playerData) return null;

    const formatDate = (date: Date | Timestamp | FirestoreTimestamp | undefined): string => {
        if (!date) return 'Teadmata';

        let actualDate: Date;

        try {
            if (date instanceof Timestamp) {
                actualDate = date.toDate();
            } else if (typeof date === 'object' && date !== null && 'seconds' in date) {
                // Type guard and cast to FirestoreTimestamp
                const firestoreTimestamp = date as FirestoreTimestamp;
                actualDate = new Date(firestoreTimestamp.seconds * 1000);
            } else if (date instanceof Date) {
                actualDate = date;
            } else {
                // Fallback
                actualDate = new Date(date as any);
            }

            // Check if date is valid
            if (isNaN(actualDate.getTime())) {
                return 'Teadmata';
            }

            return new Intl.DateTimeFormat('et-EE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(actualDate);
        } catch (error) {
            console.error('Error formatting date:', error);
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
                        <span className="status-badge">
                                {getPlayerStatus(playerData.completedCourses)}
                            </span>
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

                    {/* Creation Date */}
                    <div className="profile-field">
                        <label>Liitunud:</label>
                        <span>{formatDate(playerData.createdAt)}</span>
                    </div>

                    {/* Attributes Section */}
                    {playerData.attributes && (
                        <div className="attributes-section">
                            <h3 className="section-title">Atribuudid</h3>
                            <div className="attributes-compact-grid">
                                {/* Physical Attributes */}
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">💪</span>
                                    <span className="attribute-name">Jõud</span>
                                    <span className="attribute-value">{playerData.attributes.strength?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🏃</span>
                                    <span className="attribute-name">Kiirus</span>
                                    <span className="attribute-value">{playerData.attributes.agility?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🎯</span>
                                    <span className="attribute-name">Osavus</span>
                                    <span className="attribute-value">{playerData.attributes.dexterity?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🧠</span>
                                    <span className="attribute-name">Int.</span>
                                    <span className="attribute-value">{playerData.attributes.intelligence?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🏋️</span>
                                    <span className="attribute-name">Vast.</span>
                                    <span className="attribute-value">{playerData.attributes.endurance?.level || 0}</span>
                                </div>

                                {/* New Kitchen/Lab Skills */}
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🍳</span>
                                    <span className="attribute-name">Söök</span>
                                    <span className="attribute-value">{playerData.attributes.cooking?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🥤</span>
                                    <span className="attribute-name">Jook</span>
                                    <span className="attribute-value">{playerData.attributes.brewing?.level || 0}</span>
                                </div>
                                <div className="attribute-compact">
                                    <span className="attribute-emoji">🧪</span>
                                    <span className="attribute-name">Keem.</span>
                                    <span className="attribute-value">{playerData.attributes.chemistry?.level || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};