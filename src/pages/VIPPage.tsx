// src/pages/VIPPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import '../styles/pages/VIP.css';
import {MonthlyTopPlayers} from "../components/vip/MonthlyTopPlayers";

const VIPPage: React.FC = () => {
    const navigate = useNavigate();
    const { playerStats, loading } = usePlayerStats();
    const [activeTab, setActiveTab] = useState<'pollid' | 'vip' | 'donate'>('pollid');

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <main className="vip-container">
                    <div className="loading">Laadin VIP andmeid...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <main className="vip-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <div className="vip-header">
                    <h1 className="vip-title">VIP & Pollid</h1>
                    <div className="vip-status">
                        {playerStats?.isVip ? (
                            <div className="vip-active">
                                <span className="vip-badge-large">VIP</span>
                                <span className="vip-status-text">Oled VIP kasutaja</span>
                            </div>
                        ) : (
                            <div className="vip-inactive">
                                <span className="vip-status-text">Pole VIP kasutaja</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pollid-info">
                    <div className="pollid-balance">
                        <h2>Sinu pollid</h2>
                        <div className="pollid-amount">
                            {playerStats?.pollid || 0} pollid
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="info-tabs">
                    <button
                        className={`tab-button ${activeTab === 'pollid' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pollid')}
                    >
                        Pollid
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'vip' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vip')}
                    >
                        VIP Staatus
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'donate' ? 'active' : ''}`}
                        onClick={() => setActiveTab('donate')}
                    >
                        Annetused
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'pollid' && (
                        <div className="info-section fade-in">
                            <div className="section-header">
                                <h2>Pollid - Erimatus mängus</h2>
                                <div className="section-icon">💎</div>
                            </div>

                            <div className="info-card">
                                <p className="section-description">
                                    Pollid on spetsiaalne valuuta mängus, mida kasutatakse eksklusiivste
                                    varustuse ja kiirendajate soetamiseks. Tavaline mänguvaluuta ei võimalda
                                    neid erilisi esemeid hankida.
                                </p>
                            </div>

                            <div className="earning-methods">
                                <h3>Kuidas polle teenida?</h3>

                                <div className="method-card leaderboard-rewards">
                                    <div className="method-header">
                                        <h4>Kuised edetabeli auhinnad</h4>
                                        <span className="method-icon">🏆</span>
                                    </div>
                                    <div className="rewards-list">
                                        <div className="reward-item gold">
                                            <span className="position">1. koht</span>
                                            <span className="amount">500 polli</span>
                                        </div>
                                        <div className="reward-item silver">
                                            <span className="position">2. koht</span>
                                            <span className="amount">300 polli</span>
                                        </div>
                                        <div className="reward-item bronze">
                                            <span className="position">3. koht</span>
                                            <span className="amount">150 polli</span>
                                        </div>
                                    </div>
                                    <div className="fairness-notice">
                                        <strong>Võrdsuse tagamine:</strong> Järjestikuste kuude TOP 3 mängijad
                                        ei saa korduvalt auhindu. Valitakse järgmised parimad, kes eelmisel
                                        kuul ei saanud, tagades kõigile võrdsed võimalused.
                                    </div>
                                </div>

                                <MonthlyTopPlayers />

                                <div className="method-card donation-packages">
                                    <div className="method-header">
                                        <h4>Annetuspakid</h4>
                                        <span className="method-icon">💝</span>
                                    </div>
                                    <div className="package-list">
                                        <div className="package-item">
                                            <span className="package-amount">100 polli</span>
                                            <span className="package-price">1€</span>
                                        </div>
                                        <div className="package-item popular">
                                            <span className="package-amount">500 polli</span>
                                            <span className="package-price">4€</span>
                                            <span className="package-badge">Populaarne</span>
                                        </div>
                                        <div className="package-item">
                                            <span className="package-amount">1000 polli</span>
                                            <span className="package-price">7€</span>
                                        </div>
                                    </div>
                                    <div className="transfer-notice">
                                        Pollid kantakse üle 12 tunni jooksul pärast annetuse sooritamist.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vip' && (
                        <div className="info-section fade-in">
                            <div className="section-header">
                                <h2>VIP Staatus - Erilised eelised</h2>
                                <div className="section-icon">👑</div>
                            </div>

                            <div className="vip-duration">
                                <div className="duration-card">
                                    <h3>Kehtivus: 30 päeva</h3>
                                    <p>VIP staatus aktiveerub kohe pärast annetuse kinnitamist</p>
                                </div>
                            </div>

                            <div className="vip-benefits">
                                <h3>VIP eelised</h3>
                                <div className="benefits-grid">
                                    <div className="benefit-card">
                                        <div className="benefit-icon">💪</div>
                                        <h4>Rohkem treeninguid</h4>
                                        <p>100 klikki tunnis kõigis treeningutes (tavaliselt 50)</p>
                                    </div>
                                    <div className="benefit-card">
                                        <div className="benefit-icon">👮</div>
                                        <h4>Tõhusam töötamine</h4>
                                        <p>30 klikki tunnis töötamise ajal (tavaliselt 10)</p>
                                    </div>
                                    <div className="benefit-card">
                                        <div className="benefit-icon">💎</div>
                                        <h4>Boonus pollid</h4>
                                        <p>200 polli VIP staatuse aktiveerimisega</p>
                                    </div>
                                    <div className="benefit-card">
                                        <div className="benefit-icon">🏆</div>
                                        <h4>VIP märgis</h4>
                                        <p>Nähtav märgis edetabelis kõigi ees</p>
                                    </div>
                                    <div className="benefit-card">
                                        <div className="benefit-icon">💬</div>
                                        <h4>Eksklusiivne kogukond</h4>
                                        <p>Juurdepääs VIP Discord kanalile</p>
                                    </div>
                                    <div className="benefit-card">
                                        <div className="benefit-icon">🎮</div>
                                        <h4>Mängu areng</h4>
                                        <p>Osalus mängu arendusotsustes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="vip-pricing">
                                <div className="pricing-card">
                                    <h3>VIP Staatus</h3>
                                    <div className="price">6€</div>
                                    <p className="price-duration">30 päevaks</p>
                                    <div className="included">Sisaldab kõiki ülalnimetatud eeliseid</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'donate' && (
                        <div className="info-section fade-in">
                            <div className="section-header">
                                <h2>Mängu toetamine</h2>
                                <div className="section-icon">❤️</div>
                            </div>

                            <div className="donation-philosophy">
                                <h3>Miks nimetame neid annetusteks?</h3>
                                <div className="philosophy-card">
                                    <p>
                                        Mängu eesmärk ei ole kasumi teenimine, vaid kvaliteetse ja
                                        jätkusuutliku mängukogemuse pakkumine. Arendamine nõuab märkimisväärseid
                                        ajaressursse ja kaasnevad igakuised kulud:
                                    </p>
                                    <ul>
                                        <li>Serveri ülalpidamise kulud</li>
                                        <li>Domeeni registreerimine</li>
                                        <li>Andmebaaside haldus</li>
                                        <li>Pidev arendus ja uuendused</li>
                                    </ul>
                                    <p>
                                        Teie annetused aitavad katta neid olulisi kulusid ja võimaldavad
                                        mängul jätkuvalt areneda ning pakkuda paremat kogemust kõigile.
                                    </p>
                                </div>
                            </div>

                            <div className="donation-info">
                                <h3>Kuidas annetada</h3>
                                <div className="bank-details">
                                    <div className="detail-row">
                                        <span className="label">IBAN:</span>
                                        <span className="value copyable">EE662200221024703793</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Saaja:</span>
                                        <span className="value">Mike Gross</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Selgitus:</span>
                                        <span className="value explanation-format">
                                            Pollide puhul: "Pollid + kogus + kasutajanimi"<br/>
                                            VIP puhul: "VIP + kasutajanimi"
                                        </span>
                                    </div>
                                </div>

                                <div className="important-notices">
                                    <div className="notice-card">
                                        <strong>Oluline teave:</strong>
                                        <ul>
                                            <li>Annetused ei kuulu tagastamisele</li>
                                            <li>Pollid kantakse üle 12 tunni jooksul</li>
                                            <li>VIP staatus aktiveerub samuti hiljemalt 12 tunni jooksul</li>
                                            <li>Küsimuste korral võtke ühendust Discordis</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default VIPPage;