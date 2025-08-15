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

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left"></div>
                <div className="header-center">
                    <h1 className="game-title">Võmm</h1>
                </div>
                <div className="header-right">
                    <div className="menu-container" ref={menuRef}>
                        <button
                            className="menu-burger"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        {isMenuOpen && (
                            <div className="menu-dropdown">
                                <button
                                    onClick={() => {
                                        navigate('/dashboard');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    Töölaud
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/courses');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    Koolitused
                                </button>
                                {showTraining && (
                                    <button
                                        onClick={() => {
                                            navigate('/training');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        Treening
                                    </button>
                                )}
                                <button onClick={handleLogout} className="menu-item">
                                    Logi välja
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};