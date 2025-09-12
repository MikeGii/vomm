// src/components/home/Hero.tsx
import React, { useEffect, useState } from 'react';
import '../../styles/components/Hero.css';

export const Hero: React.FC = () => {
    const [scrollY, setScrollY] = useState(0);

    // Parallax scroll effect
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section className="hero-section">
            {/* Animated background particles */}
            <div className="hero-section__particles">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`hero-section__particle hero-section__particle--${i + 1}`} />
                ))}
            </div>

            <div className="hero-section__image-container">
                <img
                    src="/images/mainPageHero.png"
                    alt="Võmm mängu kaanepilt"
                    className="hero-section__image"
                    style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                />

                <div className="hero-section__overlay">
                    <div className="hero-section__overlay-gradient" />
                    <div className="hero-section__overlay-pattern" />

                    <div className="hero-section__content">
                        <h1 className="hero-section__title">Võmm</h1>
                        <p className="hero-section__subtitle">Taasta kord Eesti linnades</p>
                        <div className="hero-section__description">
                            <p>Alusta karjääri politseinikuna ja võitle kuritegevuse vastu kaasaegses Eestis. Sinu otsused määravad, kas linnad muutuvad turvalisemaks või vajuvad sügavamale kriminaalsesse kaosesse.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};