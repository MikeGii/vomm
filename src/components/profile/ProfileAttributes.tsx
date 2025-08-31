// src/components/profile/ProfileAttributes.tsx
import React from 'react';
import { PlayerAttributes } from '../../types';
import { CharacterEquipment } from '../../types';
import { calculateEquipmentBonuses } from '../../services/EquipmentBonusService';
import { useEstate } from '../../contexts/EstateContext';
import '../../styles/components/profile/ProfileAttributes.css';

interface ProfileAttributesProps {
    attributes: PlayerAttributes;
    equipment?: CharacterEquipment;
}

export const ProfileAttributes: React.FC<ProfileAttributesProps> = ({ attributes, equipment }) => {

    const { canUse3DPrinter, canUseLaserCutter } = useEstate();
    const equipmentBonuses = equipment ? calculateEquipmentBonuses(equipment) : null;

    const getAttributeName = (key: string): string => {
        const names: { [key: string]: string } = {
            strength: 'Jõud',
            agility: 'Kiirus',
            dexterity: 'Osavus',
            intelligence: 'Intelligentsus',
            endurance: 'Vastupidavus',
            cooking: 'Toidu valmistamine',
            brewing: 'Joogi valmistamine',
            chemistry: 'Keemia valmistamine',
            sewing: 'Õmblemine',
            medicine: 'Meditsiin',
            printing: '3D Printimine',
            lasercutting: 'Laserlõikus'
        };
        return names[key] || key;
    };

    const getAttributeIcon = (key: string): string => {
        const icons: { [key: string]: string } = {
            strength: '💪',
            agility: '🏃',
            dexterity: '🎯',
            intelligence: '🧠',
            endurance: '🏋️',
            cooking: '🍳',
            brewing: '🥤',
            chemistry: '🧪',
            sewing: '🪡',
            medicine: '🏥',
            printing: canUse3DPrinter() ? '🖨️' : '🔒',
            lasercutting: canUseLaserCutter() ? '✂️' : '🔒'
        };
        return icons[key] || '📊';
    };

    const getAttributeCategory = (key: string): 'physical' | 'kitchen-lab' | 'handicraft' => {
        if (['cooking', 'brewing', 'chemistry'].includes(key)) return 'kitchen-lab';
        if (['sewing', 'medicine', 'printing', 'lasercutting'].includes(key)) return 'handicraft';
        return 'physical';
    };

    // Check if attribute is unlocked based on equipment
    const isAttributeUnlocked = (key: string): boolean => {
        switch (key) {
            case 'printing':
                return canUse3DPrinter();
            case 'lasercutting':
                return canUseLaserCutter();
            default:
                return true;
        }
    };

    // Separate attributes into categories
    const physicalAttributes = Object.entries(attributes).filter(([key]) =>
        getAttributeCategory(key) === 'physical'
    );

    const kitchenLabAttributes = Object.entries(attributes).filter(([key]) =>
        getAttributeCategory(key) === 'kitchen-lab'
    );

    const handicraftAttributes = Object.entries(attributes).filter(([key]) =>
        getAttributeCategory(key) === 'handicraft'
    );

    const renderAttributeCard = ([key, data]: [string, any]) => {
        const bonus = equipmentBonuses ? equipmentBonuses[key as keyof typeof equipmentBonuses] : 0;
        const totalLevel = data.level + bonus;
        const isUnlocked = isAttributeUnlocked(key);

        return (
            <div key={key} className={`attribute-card ${!isUnlocked ? 'locked' : ''}`}>
                <div className="attribute-header">
                    <span className="attribute-emoji">{getAttributeIcon(key)}</span>
                    <span className="attribute-name">{getAttributeName(key)}</span>
                    {!isUnlocked && (
                        <span className="unlock-hint">
                            Vajab seadet
                        </span>
                    )}
                </div>
                <div className="attribute-level">
                    <span className="level-label">Tase:</span>
                    <span className="level-value">
                        <span className="base-level">{data.level}</span>
                        {bonus > 0 && (
                            <>
                                <span className="equipment-bonus"> +{bonus}</span>
                                <span className="total-level"> = {totalLevel}</span>
                            </>
                        )}
                    </span>
                </div>
                {isUnlocked ? (
                    <div className="attribute-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(data.experience / data.experienceForNextLevel) * 100}%` }}
                            />
                        </div>
                        <span className="progress-text">
                            {data.experience} / {data.experienceForNextLevel} XP
                        </span>
                    </div>
                ) : (
                    <div className="locked-message">
                        <span>Paigalda seade kinnisvara lehel</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="profile-attributes">
            <h2 className="attributes-title">Omadused</h2>

            {/* Physical Attributes Section */}
            <div className="attribute-category">
                <h3 className="category-title">Füüsilised omadused</h3>
                <div className="attributes-grid">
                    {physicalAttributes.map(renderAttributeCard)}
                </div>
            </div>

            {/* Kitchen & Lab Attributes Section */}
            <div className="attribute-category">
                <h3 className="category-title">Köök & Labor oskused</h3>
                <div className="attributes-grid">
                    {kitchenLabAttributes.map(renderAttributeCard)}
                </div>
            </div>

            {/* Handicraft Attributes Section */}
            <div className="attribute-category">
                <h3 className="category-title">Käsitöö oskused</h3>
                <div className="attributes-grid">
                    {handicraftAttributes.map(renderAttributeCard)}
                </div>
            </div>

            {/* Show total equipment bonuses summary */}
            {equipmentBonuses && Object.values(equipmentBonuses).some(v => v > 0) && (
                <div className="equipment-summary">
                    <h3>Varustuse boonused kokku:</h3>
                    <div className="bonus-summary">
                        {Object.entries(equipmentBonuses).map(([attr, bonus]) =>
                            bonus > 0 ? (
                                <div key={attr} className="bonus-item">
                                    <span className="bonus-attribute">{getAttributeName(attr)}:</span>
                                    <span className="bonus-value">+{bonus}</span>
                                </div>
                            ) : null
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};