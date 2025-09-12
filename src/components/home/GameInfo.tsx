// src/components/home/GameInfo.tsx
import React, { useEffect, useRef, useState, createElement, useCallback, useMemo } from 'react';
import '../../styles/components/GameInfo.css';
import { FaPeopleGroup } from "react-icons/fa6";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoBookSharp } from "react-icons/io5";

export const GameInfo: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [counters, setCounters] = useState<{ [key: number]: number }>({});
    const sectionRef = useRef<HTMLElement>(null);

    // Move stats to useMemo to make it stable
    const stats = useMemo(() => [
        { number: '13', label: 'Erinevat jaoskonda', targetValue: 13 },
        { number: '50+', label: 'Koolitust arenguks', targetValue: 50 },
        { number: '20', label: 'Erinevat ametikohta', targetValue: 20 }
    ], []);

    const getIcon = useCallback((index: number) => {
        switch (index) {
            case 0:
                return createElement(PiBuildingApartmentFill as any);
            case 1:
                return createElement(IoBookSharp as any);
            case 2:
                return createElement(FaPeopleGroup as any);
            default:
                return null;
        }
    }, []);

    const animateCounter = useCallback((index: number, target: number) => {
        let current = 0;
        const increment = target / 60; // 60 frames for smooth animation
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCounters(prev => ({ ...prev, [index]: target }));
                clearInterval(timer);
            } else {
                setCounters(prev => ({ ...prev, [index]: Math.floor(current) }));
            }
        }, 16); // ~60fps
    }, []);

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isVisible) {
                        setIsVisible(true);
                        // Start counter animations
                        stats.forEach((stat, index) => {
                            if (typeof stat.targetValue === 'number') {
                                animateCounter(index, stat.targetValue);
                            }
                        });
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [isVisible, stats, animateCounter]); // Now includes all dependencies

    const formatNumber = (index: number) => {
        if (index === 1) {
            return `${counters[index] || 0}+`;
        } else {
            return `${counters[index] || 0}`;
        }
    };

    return (
        <section ref={sectionRef} className="game-info-section">
            {/* Background decorative elements */}
            <div className="game-info-section__background">
                <div className="game-info-section__bg-pattern"></div>
                <div className="game-info-section__bg-glow game-info-section__bg-glow--1"></div>
                <div className="game-info-section__bg-glow game-info-section__bg-glow--2"></div>
            </div>

            <div className="game-info-section__container">
                <div className={`game-info-section__content ${isVisible ? 'game-info-section__content--visible' : ''}`}>
                    <h2 className="game-info-section__title">Eesti vajab sind!</h2>
                    <div className="game-info-section__description-wrapper">
                        <p className="game-info-section__description">
                            Kuritegevus on tõusuteel. Narkodiilerid, relvakaubitsejad ja organiseeritud
                            kuritegelikud grupeeringud on vallutanud Eesti linnad. Ainult sina ja su
                            kolleegid saate taastada korra ja muuta Eesti taas turvaliseks.
                        </p>
                        <p className="game-info-section__description">
                            Alusta noorukina politseikoolist ja tõuse läbi auastmete.
                        </p>
                    </div>
                </div>

                <div className={`game-info-section__stats ${isVisible ? 'game-info-section__stats--visible' : ''}`}>
                    {stats.map((stat, index) => (
                        <div key={index} className="game-info-section__stat-card" style={{ animationDelay: `${index * 0.2}s` }}>
                            <div className="game-info-section__stat-card-inner">
                                <div className="game-info-section__stat-icon">
                                    {getIcon(index)}
                                </div>
                                <div className="game-info-section__stat-number">
                                    {formatNumber(index)}
                                </div>
                                <div className="game-info-section__stat-label">{stat.label}</div>

                                {/* Decorative elements */}
                                <div className="game-info-section__stat-glow"></div>
                                <div className="game-info-section__stat-border"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};