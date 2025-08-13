// src/components/layout/AuthenticatedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../styles/layout/Header.css';

export const AuthenticatedHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

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