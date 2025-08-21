// src/pages/DepartmentPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { DepartmentHierarchy } from '../components/department/DepartmentHierarchy';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import '../styles/pages/Department.css';

const DepartmentPage: React.FC = () => {
    const navigate = useNavigate();
    const { playerStats, loading } = usePlayerStats();

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
    const hasGraduated = ['patrullpolitseinik', 'grupijuht', 'talituse_juht'].includes(playerStats.policePosition || '');

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

                {/* Department Hierarchy */}
                <DepartmentHierarchy currentPlayerStats={playerStats} />
            </main>
        </div>
    );
};

export default DepartmentPage;