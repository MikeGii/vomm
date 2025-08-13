// src/components/home/Hero.tsx
import React from 'react';
import '../../styles/components/Hero.css';

export const Hero: React.FC = () => {
    return (
        <section className="hero">
            <div className="hero-image-container">
                <img
                    src="/images/mainPageHero.png"
                    alt="Võmm mängu kaanepilt"
                    className="hero-image"
                />
                <div className="hero-overlay">
                    <div className="hero-content">
                        <h1 className="hero-title">Võmm</h1>
                        <p className="hero-subtitle">Taasta kord Eesti linnades</p>
                        <div className="hero-description">
                            <p>Alusta karjääri politseinikuna ja võitle kuritegevuse vastu kaasaegses Eestis. Sinu otsused määravad, kas linnad muutuvad turvalisemaks või vajuvad sügavamale kriminaalsesse kaosesse.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};