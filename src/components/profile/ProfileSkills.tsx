// src/components/profile/ProfileSkills.tsx
import React from 'react';
import { ABILITIES } from "../../data/abilities";
import '../../styles/components/profile/ProfileSkills.css';

interface ProfileSkillsProps {
    abilityIds: string[];
}

export const ProfileSkills: React.FC<ProfileSkillsProps> = ({ abilityIds }) => {
    if (!abilityIds || abilityIds.length === 0) {
        return (
            <div className="profile-skills">
                <h2 className="skills-title">Oskused</h2>
                <p className="no-skills">Oskused puuduvad. Läbi koolitusi, et oskusi omandada!</p>
            </div>
        );
    }

    // Get abilities by their IDs directly
    const activeAbilities = ABILITIES.filter(ability =>
        abilityIds.includes(ability.id)
    );

    return (
        <div className="profile-skills">
            <h2 className="skills-title">Oskused</h2>
            <div className="skills-grid">
                {activeAbilities.map(ability => (
                    <div key={ability.id} className="skill-card">
                        <div className="skill-icon">
                            {React.createElement(ability.icon as any, { size: 24 })}
                        </div>
                        <div className="skill-name">{ability.name}</div>
                        <div className="skill-description">{ability.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};