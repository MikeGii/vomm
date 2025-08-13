// src/components/home/Features.tsx
import React from 'react';
import '../../styles/Features.css';

export const Features: React.FC = () => {
    const features = [
        {
            title: 'Võistle teiste mängijatega',
            description: 'Treeni oma oskusi ja tõuse parimaks politseinikuks Eestis. Võrdle oma statistikat teistega ja püüa edetabelite tippu.',
            icon: '🏆'
        },
        {
            title: 'Loo parim politseiosakond',
            description: 'Ühine teiste mängijatega ja looge oma kodulinnas võimsaim politseiosakond. Töötage meeskonnana, et lahendada keerulisi juhtumeid.',
            icon: '👮'
        },
        {
            title: 'Palju põnevaid seiklusi',
            description: 'Tungi sügavale kurjategijate peidikutesse ja leia üles kõige ohtlikumad kriminaalid. Iga missioon toob uusi väljakutseid.',
            icon: '🔍'
        }
    ];

    return (
        <section className="features">
            <div className="features-container">
                <h2 className="features-title">Mida saad mängus teha?</h2>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};