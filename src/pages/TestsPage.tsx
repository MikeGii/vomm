// src/pages/TestsPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import '../styles/pages/Tests.css';

const TestsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="tests-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="tests-title">Testid</h1>

                <div className="tests-hero">
                    <div className="hero-icon">📝</div>
                    <h2>Testide lahendamine on tulekul</h2>
                    <p className="hero-description">
                        Siin saab treenida oma teadmisi, et saada boonus auhindu mängus
                    </p>
                </div>

                <div className="tests-features">
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🧠</div>
                            <h3>Teadmiste test</h3>
                            <p>Kontrolli oma teadmisi politsei ja õigusteaduse valdkonnas</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🏆</div>
                            <h3>Boonus auhinnad</h3>
                            <p>Eduka testide sooritamise eest saad väärtuslikke auhindu</p>
                        </div>
                    </div>
                </div>

                <div className="coming-soon-info">
                    <div className="info-card">
                        <h3>Mis ootab sind testides?</h3>
                        <ul>
                            <li>📚 Mitmekesised küsimused politsei valdkonnast</li>
                            <li>💰 Lisaraha ja kogemuspunktide teenimise võimalus</li>
                            <li>🎖️ Eriti keeruliste testide eest spetsiaalsed auhinnad</li>
                            <li>📈 Võimalus tõsta oma mainet</li>
                        </ul>
                    </div>
                </div>

                <div className="update-notice">
                    <div className="notice-content">
                        <div className="notice-icon">🔔</div>
                        <div className="notice-text">
                            <strong>Uuendus tulemas!</strong>
                            <p>Testide funktsioon lisatakse peagi mängu. Jälgi uuendusi ja ole valmis oma teadmisi proovile panema!</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TestsPage;