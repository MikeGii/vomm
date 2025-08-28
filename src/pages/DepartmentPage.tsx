// src/pages/DepartmentPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { DepartmentHierarchy } from '../components/department/DepartmentHierarchy';
import { DepartmentCrimeInfo } from '../components/department/DepartmentCrimeInfo';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { DepartmentTabs } from '../components/department/DepartmentTabs';
import { DepartmentLeaderboard } from '../components/department/DepartmentLeaderboard';
import '../styles/pages/Department.css';
import {isPoliceOfficer} from "../utils/playerStatus";
import {DepartmentInstructions} from "../components/department/DepartmentInstructions";

const DepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { playerStats, loading, refreshStats } = usePlayerStats();

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="department-container">
                    <div className="loading">Laadin...</div>
                </main>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="department-container">
                    <div className="error">Viga andmete laadimisel</div>
                </main>
            </div>
        );
    }

    // Check if player has graduated (completed lopueksam)
    const hasGraduated = isPoliceOfficer(playerStats);

    if (!hasGraduated) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="department-container">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>

                    <h1 className="department-title">Osakond</h1>

                    <div className="access-denied">
                        <div className="access-denied-icon">🚫</div>
                        <h2>Juurdepääs piiratud</h2>
                        <p>
                            Osakonna struktuuri nägemiseks pead olema lõpetanud Sisekaitseakadeemia.
                        </p>
                        <p>
                            Lõpeta esmalt <strong>lopueksam</strong> kursus, et saada politseiametniku staatus.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="department-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="department-title">Politsei Struktuur</h1>

                <DepartmentInstructions />

                {/* Department Hierarchy */}
                <DepartmentHierarchy currentPlayerStats={playerStats} />

                {/* Compact Crime Activity Info */}
                <DepartmentCrimeInfo playerStats={playerStats} />

                <DepartmentTabs
                    currentPlayerStats={playerStats}
                    onPlayerStatsUpdate={refreshStats}
                />

                <DepartmentLeaderboard />
            </main>
        </div>
    );
};

export default DepartmentPage;