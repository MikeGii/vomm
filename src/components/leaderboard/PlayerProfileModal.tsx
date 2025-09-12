// src/components/modals/PlayerProfileModal.tsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { PlayerProfileModalData, FirestoreTimestamp, PlayerStats } from '../../types';
import { PlayerEstate } from '../../types/estate';
import { getPlayerDisplayStatus } from '../../utils/playerStatus';
import { getUserCars } from '../../services/VehicleService';
import { getVehicleModelById } from '../../services/VehicleDatabaseService';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from "../../contexts/AuthContext";
import { createPortal } from 'react-dom';
import '../../styles/components/leaderboard/PlayerProfileModal.css';

interface PlayerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerData: PlayerProfileModalData | null;
    loading?: boolean;
}

interface CarDisplayData {
    brand: string;
    model: string;
    power: number;
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

const getPlayerCarsInfo = async (userId: string): Promise<CarDisplayData[]> => {
    try {
        const cars = await getUserCars(userId);
        const carDisplayData: CarDisplayData[] = [];

        // Load car models and calculate stats
        for (const car of cars) {
            try {
                const model = await getVehicleModelById(car.carModelId);
                if (model) {
                    // Convert VehicleModel to CarModel format for calculateCarStats
                    const carModel = {
                        id: model.id,
                        brand: model.brandName,
                        model: model.model,
                        mass: model.mass,
                        compatibleEngines: model.compatibleEngineIds,
                        defaultEngine: model.defaultEngineId,
                        basePrice: model.basePrice,
                        basePollidPrice: model.basePollidPrice,
                        currency: model.currency
                    };

                    const stats = calculateCarStats(car, carModel);
                    carDisplayData.push({
                        brand: model.brandName,
                        model: model.model,
                        power: stats.power
                    });
                }
            } catch (error) {
                console.error(`Error loading car model ${car.carModelId}:`, error);
            }
        }

        // Sort by power (highest first)
        return carDisplayData.sort((a, b) => b.power - a.power);
    } catch (error) {
        console.error('Error fetching player cars:', error);
        return [];
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
    const [playerCars, setPlayerCars] = useState<CarDisplayData[]>([]);
    const [estateLoading, setEstateLoading] = useState(false);
    const [carsLoading, setCarsLoading] = useState(false);

    const isCurrentUserProfile = currentUser?.uid === playerData?.userId;
    const isVipPlayer = playerData?.isVip === true;

    // Load estate and cars data for other players
    useEffect(() => {
        if (isOpen && playerData && !isCurrentUserProfile) {
            const loadOtherPlayerData = async () => {
                setEstateLoading(true);
                setCarsLoading(true);

                try {
                    // Load estate data
                    const estate = await getPlayerEstateInfo(playerData.userId);
                    setOtherPlayerEstate(estate);

                    // Load cars data
                    const cars = await getPlayerCarsInfo(playerData.userId);
                    setPlayerCars(cars);
                } catch (error) {
                    console.error('Failed to load other player data:', error);
                    setOtherPlayerEstate(null);
                    setPlayerCars([]);
                } finally {
                    setEstateLoading(false);
                    setCarsLoading(false);
                }
            };
            loadOtherPlayerData();
        } else if (isCurrentUserProfile && isOpen && playerData) {
            // Load cars for current user
            const loadCurrentUserCars = async () => {
                setCarsLoading(true);
                try {
                    const cars = await getPlayerCarsInfo(playerData.userId);
                    setPlayerCars(cars);
                } catch (error) {
                    console.error('Failed to load current user cars:', error);
                    setPlayerCars([]);
                } finally {
                    setCarsLoading(false);
                }
            };
            loadCurrentUserCars();
        } else if (!isOpen) {
            setOtherPlayerEstate(null);
            setPlayerCars([]);
            setEstateLoading(false);
            setCarsLoading(false);
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

    return createPortal(
        <div className="pp-modal-overlay" onClick={onClose}>
            <div
                className={`pp-modal-content ${isVipPlayer ? 'pp-vip-profile' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="pp-modal-close-btn" onClick={onClose}>×</button>

                <div className="pp-profile-header">
                    <div className="pp-profile-info">
                        <h2 className="pp-profile-username">{playerData.username}</h2>
                        <div className="pp-profile-badges">
                            {playerData.badgeNumber && (
                                <span className="pp-profile-badge">#{playerData.badgeNumber}</span>
                            )}
                            <span className="pp-profile-badge">{getPlayerStatus()}</span>
                            {playerData?.isVip && (
                                <span className="pp-profile-badge pp-profile-vip-badge">VIP</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pp-profile-stats-grid">
                    <div className="pp-profile-stat-item">
                        <span className="pp-profile-stat-label">Tase</span>
                        <span className="pp-profile-stat-value">{playerData.level}</span>
                    </div>
                    <div className="pp-profile-stat-item">
                        <span className="pp-profile-stat-label">Maine</span>
                        <span className="pp-profile-stat-value">{playerData.reputation}</span>
                    </div>
                    <div className="pp-profile-stat-item">
                        <span className="pp-profile-stat-label">Raha</span>
                        <span className="pp-profile-stat-value">{formatMoney(playerData.money)}</span>
                    </div>
                    <div className="pp-profile-stat-item">
                        <span className="pp-profile-stat-label">Töötunnid</span>
                        <span className="pp-profile-stat-value">{playerData.totalWorkedHours || 0}h</span>
                    </div>
                </div>

                {/* Completed Courses */}
                <div className="pp-courses-section">
                    <h3 className="pp-section-title">Läbitud kursused</h3>
                    <div className="pp-courses-count">
                        <span className="pp-courses-icon">📚</span>
                        <span className="pp-courses-number">{playerData.completedCourses?.length || 0}</span>
                        <span className="pp-courses-text">kursust läbitud</span>
                    </div>
                </div>

                {/* Estate Section */}
                {(estateData || estateLoading) && (
                    <div className="pp-estate-section">
                        <h3 className="pp-section-title">Kinnisvara</h3>
                        {estateLoading ? (
                            <p className="pp-estate-loading">Laen andmeid...</p>
                        ) : estateData?.currentEstate ? (
                            <div className="pp-estate-info">
                                <span className="pp-estate-icon">🏠</span>
                                <span className="pp-estate-name">{estateData.currentEstate.name}</span>
                                {estateData.currentEstate.hasGarage && (
                                    <span className="pp-garage-info">
                                        🚗 {estateData.currentEstate.garageCapacity} kohta
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="pp-no-estate">Pole kinnisasja</p>
                        )}
                    </div>
                )}

                {/* Cars Section */}
                <div className="pp-cars-section">
                    <h3 className="pp-section-title">Garaažis olevad autod</h3>
                    {carsLoading ? (
                        <p className="pp-cars-loading">Laen andmeid...</p>
                    ) : playerCars.length > 0 ? (
                        <div className="pp-cars-list">
                            {playerCars.map((car, index) => (
                                <div key={index} className="pp-car-item">
                                    <span className="pp-car-brand">{car.brand}</span>
                                    <span className="pp-car-model">{car.model}</span>
                                    <span className="pp-car-power">{car.power} KW</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="pp-no-cars">Pole autosid</p>
                    )}
                </div>

                {/* Driving Skills Section */}
                {playerData.attributes && (
                    <div className="pp-driving-skills">
                        <h3 className="pp-section-title">Sõidoskused</h3>
                        <div className="pp-driving-skills-grid">
                            <div className="pp-driving-skill">
                                <span className="pp-skill-icon">🎯</span>
                                <span className="pp-skill-name">Käsitsemine</span>
                                <span className="pp-skill-value">{getAttributeValue('handling')}</span>
                            </div>
                            <div className="pp-driving-skill">
                                <span className="pp-skill-icon">⚡</span>
                                <span className="pp-skill-name">Reaktsiooni</span>
                                <span className="pp-skill-value">{getAttributeValue('reactionTime')}</span>
                            </div>
                            <div className="pp-driving-skill">
                                <span className="pp-skill-icon">⚙️</span>
                                <span className="pp-skill-name">Käiguvahetus</span>
                                <span className="pp-skill-value">{getAttributeValue('gearShifting')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* General Attributes Section */}
                {playerData.attributes && (
                    <div className="pp-attributes">
                        <h3 className="pp-section-title">Üldised omadused</h3>
                        <div className="pp-attributes-grid">
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
                                <div key={attr.key} className="pp-attribute">
                                    <span className="pp-attribute-icon">{attr.emoji}</span>
                                    <span className="pp-attribute-level">
                                        {getAttributeValue(attr.key)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer info */}
                <div className="pp-profile-footer">
                    <p className="pp-profile-joined">Liitunud: {formatDate(playerData.createdAt)}</p>
                </div>
            </div>
        </div>,
        document.body
    );
};