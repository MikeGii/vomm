// src/components/home/CallToAction.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RegisterModal } from '../auth/RegisterModal';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/CallToAction.css';

export const CallToAction: React.FC = () => {
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [buttonHovered, setButtonHovered] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const navigate = useNavigate();

    const handleRegisterSuccess = () => {
        navigate('/dashboard');
    };

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <section ref={sectionRef} className="cta-section">
                {/* Background decorative elements */}
                <div className="cta-section__background">
                    <div className="cta-section__bg-pattern"></div>
                    <div className="cta-section__bg-circles">
                        <div className="cta-section__bg-circle cta-section__bg-circle--1"></div>
                        <div className="cta-section__bg-circle cta-section__bg-circle--2"></div>
                        <div className="cta-section__bg-circle cta-section__bg-circle--3"></div>
                    </div>
                    <div className="cta-section__bg-glow"></div>
                </div>

                <div className={`cta-section__container ${isVisible ? 'cta-section__container--visible' : ''}`}>
                    <div className="cta-section__content">
                        <h2 className="cta-section__title">Kas oled valmis korrakaitsjaks?</h2>
                        <p className="cta-section__description">
                            Liitu tuhandete teiste mängijatega võitluses kuritegevuse vastu.
                            Eesti linnad vajavad sind!
                        </p>

                        {/* Enhanced call-to-action button */}
                        <div className="cta-section__button-wrapper">
                            <button
                                className={`cta-section__button ${buttonHovered ? 'cta-section__button--hovered' : ''}`}
                                onClick={() => setShowRegisterModal(true)}
                                onMouseEnter={() => setButtonHovered(true)}
                                onMouseLeave={() => setButtonHovered(false)}
                            >
                                <span className="cta-section__button-text">Alusta karjääri</span>
                                <span className="cta-section__button-icon">🚔</span>
                                <div className="cta-section__button-glow"></div>
                                <div className="cta-section__button-shine"></div>
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSuccess={handleRegisterSuccess}
            />
        </>
    );
};