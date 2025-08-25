// src/components/department/tabs/VacantPositionsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerStats } from '../../../types';
import { POLICE_POSITIONS} from '../../../data/policePositions';
import { getUnitById } from '../../../data/departmentUnits';
import { getCourseById } from '../../../data/courses';
import { getPositionDepartmentUnit } from '../../../utils/playerStatus';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import '../../../styles/components/department/tabs/VacantPositionsTab.css';

interface VacantPositionsTabProps {
    playerStats: PlayerStats;
    onPlayerStatsUpdate?: () => void;
}

interface PositionInfo {
    positionId: string;
    positionName: string;
    unitName: string;
    isGroupLeader: boolean;
    canApply: boolean;
    canSwitch: boolean; // NEW: for standard positions
    requirements: string[];
    missingRequirements: string[];
    actionType: 'switch' | 'apply'; // NEW: determines button behavior
}

export const VacantPositionsTab: React.FC<VacantPositionsTabProps> = ({
                                                                          playerStats,
                                                                          onPlayerStatsUpdate
                                                                      }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [positions, setPositions] = useState<PositionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [switching, setSwitching] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'leaders'>('all');

    const generatePositionsList = useCallback(async () => {
        if (!playerStats.department) {
            setPositions([]);
            setLoading(false);
            return;
        }

        const availablePositions: PositionInfo[] = [];
        const currentUnit = getPositionDepartmentUnit(playerStats.policePosition);

        // Get all positions in the same department
        POLICE_POSITIONS.forEach(position => {
            // Skip basic positions that don't belong to units
            if (['abipolitseinik', 'kadett', 'talituse_juht'].includes(position.id)) {
                return;
            }

            const unit = getUnitById(position.departmentUnit || '');
            if (!unit) return;

            const isGroupLeader = position.id.startsWith('grupijuht_');
            const requirements: string[] = [];
            const missingRequirements: string[] = [];
            let canApply = false;
            let canSwitch = false;
            let actionType: 'switch' | 'apply' = isGroupLeader ? 'apply' : 'switch';

            // Check requirements
            if (position.requirements) {
                const reqs = position.requirements;

                // Level requirement
                if (reqs.minimumLevel) {
                    requirements.push(`Tase ${reqs.minimumLevel}+`);
                    if (playerStats.level < reqs.minimumLevel) {
                        missingRequirements.push(`Tase ${reqs.minimumLevel} (praegu ${playerStats.level})`);
                    }
                }

                // Course requirements
                if (reqs.completedCourses && reqs.completedCourses.length > 0) {
                    reqs.completedCourses.forEach(courseId => {
                        const courseName = getCourseDisplayName(courseId);
                        requirements.push(`Kursus: ${courseName}`);

                        if (!playerStats.completedCourses.includes(courseId)) {
                            missingRequirements.push(`Kursus: ${courseName}`);
                        }
                    });
                }

                // Work hours requirement
                if (reqs.minimumWorkedHours) {
                    requirements.push(`${reqs.minimumWorkedHours} töötundi`);
                    if ((playerStats.totalWorkedHours || 0) < reqs.minimumWorkedHours) {
                        missingRequirements.push(
                            `${reqs.minimumWorkedHours} töötundi (praegu ${playerStats.totalWorkedHours || 0})`
                        );
                    }
                }

                // Attribute requirements
                if (reqs.attributes && playerStats.attributes) {
                    const attrs = playerStats.attributes;
                    Object.entries(reqs.attributes).forEach(([attrName, requiredLevel]) => {
                        const attrDisplayName = getAttributeDisplayName(attrName);
                        requirements.push(`${attrDisplayName} ${requiredLevel}+`);

                        const currentLevel = (attrs as any)[attrName]?.level || 0;
                        if (currentLevel < requiredLevel) {
                            missingRequirements.push(
                                `${attrDisplayName} ${requiredLevel} (praegu ${currentLevel})`
                            );
                        }
                    });
                }

                // Reputation requirement
                if (reqs.minimumReputation) {
                    requirements.push(`${reqs.minimumReputation} maine`);
                    if ((playerStats.reputation || 0) < reqs.minimumReputation) {
                        missingRequirements.push(
                            `${reqs.minimumReputation} maine (praegu ${playerStats.reputation || 0})`
                        );
                    }
                }
            }

            // Check if already in this unit
            if (currentUnit === position.departmentUnit) {
                if (isGroupLeader) {
                    // For group leader: can apply if you're a standard worker in the same unit
                    const isStandardWorker = !playerStats.policePosition?.startsWith('grupijuht_');
                    if (isStandardWorker && missingRequirements.length === 0) {
                        canApply = true;
                    } else if (!isStandardWorker) {
                        missingRequirements.push('Pead olema tavakandidaat selles üksuses');
                    }
                } else {
                    // Standard worker in same unit - no action needed
                    missingRequirements.push('Sa juba töötad selles üksuses');
                }
            } else {
                // Different unit
                if (isGroupLeader) {
                    // Can't apply for group leader in different unit
                    missingRequirements.push(`Pead töötama ${unit.name} üksuses`);
                } else {
                    // Standard worker can switch if requirements met
                    if (missingRequirements.length === 0) {
                        canSwitch = true;
                    }
                }
            }

            // Override for patrullpolitseinik (no requirements)
            if (position.id === 'patrullpolitseinik') {
                if (currentUnit !== 'patrol') {
                    canSwitch = true;
                    // Clear requirements for patrullpolitseinik
                    missingRequirements.length = 0;
                }
            }

            availablePositions.push({
                positionId: position.id,
                positionName: position.name,
                unitName: unit.name,
                isGroupLeader,
                canApply,
                canSwitch,
                requirements,
                missingRequirements,
                actionType
            });
        });

        // Check existing applications for group leader positions
        if (playerStats.username) {
            try {
                const pendingApplicationsQuery = query(
                    collection(firestore, 'applications'),
                    where('applicantId', '==', playerStats.username),
                    where('status', '==', 'pending')
                );

                const pendingApplications = await getDocs(pendingApplicationsQuery);
                const pendingPositionIds = new Set<string>();

                pendingApplications.forEach(doc => {
                    pendingPositionIds.add(doc.data().positionId);
                });

                // Update group leader positions to show if already applied
                availablePositions.forEach(position => {
                    if (position.isGroupLeader && pendingPositionIds.has(position.positionId)) {
                        position.canApply = false;
                        position.missingRequirements.push('Sul on juba avaldus esitatud');
                    }
                });

            } catch (error) {
                console.error('Error checking existing applications:', error);
            }
        }

        setPositions(availablePositions);
        setLoading(false);
    }, [playerStats]);

    useEffect(() => {
        generatePositionsList();
    }, [generatePositionsList]);

    const getCourseDisplayName = (courseId: string): string => {
        const course = getCourseById(courseId);
        return course?.name || courseId;
    };

    const getAttributeDisplayName = (attrName: string): string => {
        const attrNames: Record<string, string> = {
            'strength': 'Jõud',
            'agility': 'Kiirus',
            'dexterity': 'Osavus',
            'intelligence': 'Intelligentsus',
            'endurance': 'Vastupidavus'
        };
        return attrNames[attrName] || attrName;
    };

    const handleSwitchUnit = async (positionId: string) => {
        if (!currentUser || !playerStats.username || switching) {
            return;
        }

        const position = positions.find(p => p.positionId === positionId);
        if (!position || !position.canSwitch) {
            showToast('Ei saa sellesse üksusesse liikuda', 'error');
            return;
        }

        setSwitching(positionId);

        try {
            const userRef = doc(firestore, 'playerStats', playerStats.username);
            await updateDoc(userRef, {
                departmentUnit: position.unitName.toLowerCase().includes('patrol') ? 'patrol' :
                    position.unitName.toLowerCase().includes('menetlus') ? 'procedural_service' :
                        position.unitName.toLowerCase().includes('kiir') ? 'emergency_response' :
                            position.unitName.toLowerCase().includes('k9') ? 'k9_unit' :
                                position.unitName.toLowerCase().includes('küber') ? 'cyber_crime' :
                                    position.unitName.toLowerCase().includes('kuritegude') ? 'crime_unit' : 'patrol',
                policePosition: positionId
            });

            showToast(`Edukalt liikusid üksusesse: ${position.unitName}`, 'success');

            // Refresh player stats and positions
            if (onPlayerStatsUpdate) {
                onPlayerStatsUpdate();
            }
            generatePositionsList();

        } catch (error) {
            console.error('Error switching unit:', error);
            showToast('Viga üksuse vahetamisel', 'error');
        } finally {
            setSwitching(null);
        }

        await generatePositionsList();
    };

    const handleApply = async (positionId: string) => {
        if (!currentUser || !playerStats.username || applying) {
            return;
        }

        const position = positions.find(p => p.positionId === positionId);
        if (!position || !position.canApply) {
            showToast('Sellele positsioonile ei saa kandideerida', 'error');
            return;
        }

        setApplying(positionId);

        try {
            // Check if player already has an application for this position
            const existingApplicationQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', playerStats.username),
                where('positionId', '==', positionId),
                where('status', '==', 'pending')
            );

            const existingApplications = await getDocs(existingApplicationQuery);

            if (!existingApplications.empty) {
                showToast('Sul on juba sellele positsioonile avaldus esitatud', 'warning');
                setApplying(null);
                return;
            }

            // Check if player has too many pending applications
            const allPendingApplicationsQuery = query(
                collection(firestore, 'applications'),
                where('applicantId', '==', playerStats.username),
                where('status', '==', 'pending')
            );

            const allPendingApplications = await getDocs(allPendingApplicationsQuery);

            if (allPendingApplications.size >= 3) {
                showToast('Sul võib olla korraga maksimaalselt 3 ootel olevat avaldust', 'warning');
                setApplying(null);
                return;
            }

            // Create application document
            const applicationData = {
                applicantId: playerStats.username,
                applicantUserId: currentUser.uid,
                positionId: positionId,
                department: playerStats.department,
                prefecture: playerStats.prefecture,
                appliedAt: new Date(),
                status: 'pending',
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

            showToast(`Avaldus edukalt esitatud positsioonile: ${position.positionName}`, 'success');

            // Refresh positions list
            generatePositionsList();

        } catch (error) {
            console.error('Error submitting application:', error);
            showToast('Viga avalduse esitamisel', 'error');
        } finally {
            setApplying(null);
        }

        await generatePositionsList();
    };

    const getButtonConfig = (position: PositionInfo) => {
        if (position.actionType === 'switch') {
            return {
                text: switching === position.positionId ? 'Liigub...' :
                    position.canSwitch ? 'Liitu üksusega' : 'Ei saa liituda',
                className: position.canSwitch ? 'available' : 'unavailable',
                disabled: !position.canSwitch || switching === position.positionId,
                onClick: () => handleSwitchUnit(position.positionId)
            };
        } else {
            return {
                text: applying === position.positionId ? 'Esitan...' :
                    position.canApply ? 'Kandideeri' : 'Ei saa kandideerida',
                className: position.canApply ? 'available' : 'unavailable',
                disabled: !position.canApply || applying === position.positionId,
                onClick: () => handleApply(position.positionId)
            };
        }
    };

    const filteredPositions = positions.filter(position => {
        switch (selectedCategory) {
            case 'standard':
                return !position.isGroupLeader;
            case 'leaders':
                return position.isGroupLeader;
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div className="vacant-positions-tab">
                <div className="loading">Laadin ametikohtade andmeid...</div>
            </div>
        );
    }

    return (
        <div className="vacant-positions-tab">
            <div className="tab-header">
                <h3>Ametikohad - {playerStats.department}</h3>
                <div className="category-filters">
                    <button
                        className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        Kõik ({positions.length})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'standard' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('standard')}
                    >
                        Üksused ({positions.filter(p => !p.isGroupLeader).length})
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'leaders' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('leaders')}
                    >
                        Grupijuhid ({positions.filter(p => p.isGroupLeader).length})
                    </button>
                </div>
            </div>

            <div className="positions-list">
                {filteredPositions.length === 0 ? (
                    <div className="no-positions">
                        {selectedCategory === 'all' ?
                            'Praegu pole ametikohtade andmeid saadaval.' :
                            `Selles kategoorias pole ametikohti.`
                        }
                    </div>
                ) : (
                    filteredPositions.map(position => {
                        const buttonConfig = getButtonConfig(position);
                        return (
                            <div key={position.positionId} className="position-card">
                                <div className="position-header">
                                    <div className="position-info">
                                        <h4 className="position-name">{position.positionName}</h4>
                                        <div className="position-unit">{position.unitName}</div>
                                        {position.isGroupLeader && (
                                            <span className="leader-badge">Grupijuht</span>
                                        )}
                                    </div>
                                    <div className="position-actions">
                                        <button
                                            className={`apply-btn ${buttonConfig.className}`}
                                            onClick={buttonConfig.onClick}
                                            disabled={buttonConfig.disabled}
                                        >
                                            {buttonConfig.text}
                                        </button>
                                    </div>
                                </div>

                                <div className="position-requirements">
                                    {position.requirements.length > 0 && (
                                        <div className="requirements-section">
                                            <h5>Nõuded:</h5>
                                            <ul className="requirements-list">
                                                {position.requirements.map((req, index) => (
                                                    <li key={index} className="requirement-item">
                                                        {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {position.missingRequirements.length > 0 && (
                                        <div className="missing-requirements-section">
                                            <h5>Puuduvad nõuded:</h5>
                                            <ul className="missing-requirements-list">
                                                {position.missingRequirements.map((req, index) => (
                                                    <li key={index} className="missing-requirement-item">
                                                        ❌ {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};