// src/components/home/Features.tsx
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/components/Features.css';

export const Features: React.FC = () => {
    const [visibleCards, setVisibleCards] = useState<number[]>([]);
    const sectionRef = useRef<HTMLElement>(null);

    const features = [
        {
            title: 'Võistle teiste mängijatega',
            description: 'Treeni oma oskusi ja tõuse parimaks politseinikuks Eestis. Võrdle oma ' +
                'statistikat teistega ja püüa edetabelite tippu.',
            icon: '🏆'
        },
        {
            title: 'Parim politseiosakond',
            description: 'Ühine teiste mängijatega ja looge oma piirkonnas võimsaim politseiosakond ning langetage' +
                ' kuritegevus miinimumini.',
            icon: '👮'
        },
        {
            title: 'Palju põnevaid tegevusi',
            description: 'Arenda oma kodu, kogu unikaalseid sõidukeid. Võistle kolleegidega' +
                ' võitlusklubis või proovi õnne kasiinos.' +
                ' parim aeg.',
            icon: '🔍'
        }
    ];

    // Intersection Observer for scroll-triggered animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const cards = entry.target.querySelectorAll('.features-section__card');
                        cards.forEach((card, index) => {
                            setTimeout(() => {
                                setVisibleCards(prev => [...prev, index]);
                            }, index * 200);
                        });
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="features-section">
            {/* Background decorative elements */}
            <div className="features-section__background">
                <div className="features-section__bg-circle features-section__bg-circle--1"></div>
                <div className="features-section__bg-circle features-section__bg-circle--2"></div>
                <div className="features-section__bg-grid"></div>
            </div>

            <div className="features-section__container">
                <h2 className="features-section__title">Mida saad mängus teha?</h2>
                <div className="features-section__grid">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`features-section__card ${
                                visibleCards.includes(index) ? 'features-section__card--visible' : ''
                            }`}
                            style={{ animationDelay: `${index * 0.2}s` }}
                        >
                            <div className="features-section__card-inner">
                                <div className="features-section__icon-wrapper">
                                    <div className="features-section__icon">{feature.icon}</div>
                                    <div className="features-section__icon-glow"></div>
                                </div>
                                <h3 className="features-section__card-title">{feature.title}</h3>
                                <p className="features-section__card-description">{feature.description}</p>

                                {/* Decorative elements */}
                                <div className="features-section__card-accent"></div>
                                <div className="features-section__card-shine"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};