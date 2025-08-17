// src/components/profile/ProfileSkills.tsx
import React from 'react';
import { getActiveAbilities } from "../../data/abilities";
import '../../styles/components/profile/ProfileSkills.css';

interface ProfileSkillsProps {
    abilities: string[];
}

export const ProfileSkills: React.FC<ProfileSkillsProps> = ({ abilities }) => {
    if (!abilities || abilities.length === 0) {
        return (
            <div className="profile-skills">
                <h2 className="skills-title">Oskused</h2>
                <p className="no-skills">Oskused puuduvad. Läbi koolitusi, et oskusi omandada!</p>
            </div>
        );
    }

    // Get all active abilities at once
    const activeAbilities = getActiveAbilities(abilities);

    return (
        <div className="profile-skills">
            <h2 className="skills-title">Oskused</h2>
            <div className="skills-grid">
                {activeAbilities.map(ability => (
                    <div key={ability.id} className="skill-card">
                        <div className="skill-name">{ability.name}</div>
                        <div className="skill-description">{ability.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};