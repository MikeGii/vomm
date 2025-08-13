// src/components/home/GameInfo.tsx
import React from 'react';
import '../../styles/components/GameInfo.css';

export const GameInfo: React.FC = () => {
    const stats = [
        { number: '40+', label: 'Erinevat linna' },
        { number: '100+', label: 'Põnevat missiooni' },
        { number: '24/7', label: 'Reaalajas mäng' }
    ];

    return (
        <section className="game-info">
            <div className="game-info-container">
                <div className="game-info-content">
                    <h2 className="game-info-title">Eesti vajab sind!</h2>
                    <p className="game-info-description">
                        Kuritegevus on tõusuteel. Narkodiilerid, relvakaubitsejad ja organiseeritud
                        kuritegelikud grupeeringud on vallutanud Eesti linnad. Ainult sina ja su
                        kolleegid saate taastada korra ja muuta Eesti taas turvaliseks.
                    </p>
                    <p className="game-info-description">
                        Alusta noorukina politseikoolist ja tõuse läbi auastmete. Lahenda juhtumeid,
                        koguge tõendeid, ja viige kurjategijad kohtu ette. Iga su otsus mõjutab
                        linna turvalisust ja su karjääri.
                    </p>
                </div>
                <div className="game-stats">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-number">{stat.number}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};