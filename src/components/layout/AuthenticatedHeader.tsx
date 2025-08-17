// src/components/layout/AuthenticatedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { PlayerStats } from '../../types';
import '../../styles/layout/Header.css';

export const AuthenticatedHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useAuth();

    // Listen to player stats to determine what menu items to show
    useEffect(() => {
        if (!currentUser) return;

        const statsRef = doc(firestore, 'playerStats', currentUser.uid);
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setPlayerStats(doc.data() as PlayerStats);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsMenuOpen(false);
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Väljumine ebaõnnestus:', error);
        }
    };

    // Determine if training should be shown in menu
    const showTraining = playerStats && (
        playerStats.tutorialProgress.isCompleted ||
        playerStats.tutorialProgress.currentStep >= 10
    );

    const getStatusText = (): string => {
        if (!playerStats) return '—';
        if (playerStats.completedCourses?.includes('sisekaitseakadeemia_entrance')) {
            return 'Kadett';
        }
        if (playerStats.hasCompletedTraining) {
            return 'Abipolitseinik';
        }
        return 'Töötu';
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    {playerStats && (
                        <div className="header-stats">
                            <div className="header-stat-item">
                                <span className="header-stat-label">Staatus</span>
                                <span className="header-stat-value">{getStatusText()}</span>
                            </div>
                            <div className="header-stat-item">
                                <span className="header-stat-label">Maine</span>
                                <span className="header-stat-value">{playerStats.reputation}</span>
                            </div>
                            <div className="header-stat-item">
                                <span className="header-stat-label">Raha</span>
                                <span className="header-stat-value money">{playerStats.money || 0} €</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="header-center">
                    <div className="title-with-badge">
                        <h1 className="game-title">Võmm</h1>
                        <img
                            src="/images/policeBadge.png"
                            alt="Police Badge"
                            className="title-badge"
                        />
                    </div>
                </div>
                <div className="header-right">
                    <div className="menu-container" ref={menuRef}>
                        <button
                            className="menu-burger"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Menüü"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        {isMenuOpen && (
                            <div className="menu-dropdown">
                                <div className="menu-section">
                                    <button
                                        onClick={() => {
                                            navigate('/dashboard');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item menu-item-primary"
                                    >
                                        <span className="menu-icon">🏠</span>
                                        <span>Töölaud</span>
                                    </button>
                                </div>

                                <div className="menu-divider"></div>

                                <div className="menu-section">
                                    <div className="menu-section-title">Tegevused</div>
                                    <button
                                        onClick={() => {
                                            navigate('/courses');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">📚</span>
                                        <span>Koolitused</span>
                                    </button>
                                    {showTraining && (
                                        <button
                                            onClick={() => {
                                                navigate('/training');
                                                setIsMenuOpen(false);
                                            }}
                                            className="menu-item"
                                        >
                                            <span className="menu-icon">💪</span>
                                            <span>Treening</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            navigate('/patrol');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">👮</span>
                                        <span>Mine tööle</span>
                                    </button>
                                </div>

                                <div className="menu-divider"></div>

                                <div className="menu-section">
                                    <button onClick={handleLogout} className="menu-item menu-item-danger">
                                        <span className="menu-icon">🚪</span>
                                        <span>Logi välja</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};