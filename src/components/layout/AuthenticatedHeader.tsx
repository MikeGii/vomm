// src/components/layout/AuthenticatedHeader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../../config/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { formatMoney, formatPollid } from '../../utils/currencyUtils';
import { PlayerStats } from '../../types';
import { getPlayerDisplayStatus } from '../../utils/playerStatus';
import '../../styles/layout/Header.css';

export const AuthenticatedHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [onlineCount, setOnlineCount] = useState<number>(0);
    const [loadingOnlineCount, setLoadingOnlineCount] = useState(true);
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

    // Fetch online players count
    useEffect(() => {
        const fetchOnlinePlayersCount = async () => {
            try {
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

                const playersQuery = query(
                    collection(firestore, 'playerStats'),
                    where('lastSeen', '>=', Timestamp.fromDate(twentyFourHoursAgo))
                );

                const snapshot = await getDocs(playersQuery);
                setOnlineCount(snapshot.size);
            } catch (error) {
                console.error('Viga aktiivsete mängijate lugemisel:', error);
                setOnlineCount(0);
            } finally {
                setLoadingOnlineCount(false);
            }
        };

        fetchOnlinePlayersCount();

        // Uuenda iga 5 minuti tagant
        const interval = setInterval(fetchOnlinePlayersCount, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

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

    // Determine if training should be shown based on actual progress (no tutorial)
    const showTraining = playerStats?.completedCourses?.includes('basic_police_training_abipolitseinik') || false;

    // Updated admin access check
    const hasAdminAccess = playerStats?.adminPermissions?.hasAdminAccess || false;
    const allowedTabs = playerStats?.adminPermissions?.allowedTabs || [];

    // Keep the hardcoded admin check as backup
    const isSuperAdmin = currentUser?.uid === 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

    // Final admin access check - either super admin OR has admin permissions
    const isAdmin = isSuperAdmin || hasAdminAccess;

    // Enhanced status text with more detailed progression
    const getStatusText = (): string => {
        if (!playerStats) return '—';
        return getPlayerDisplayStatus(playerStats);
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
                            <div className="header-stat-item header-money">
                                <span className="header-stat-label">Raha</span>
                                <span className="header-stat-value money">{formatMoney(playerStats.money || 0)}</span>
                            </div>

                            <div className="header-stat-item header-pollid">
                                <span className="header-stat-label">Pollid</span>
                                <span className="header-stat-value pollid">{formatPollid(playerStats.pollid || 0)}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="header-center">
                    <div className="title-with-badge">
                        <h1 className="game-title">Võmm.ee</h1>
                        <img
                            src="/images/Võmm_logo2.png"
                            alt="Police Badge"
                            className="title-badge"
                        />
                    </div>
                </div>
                <div className="header-right">

                    <div className="header-stat-item header-online-count">
                        <span className="header-stat-label">Aktiivsed 24h</span>
                        <span className="header-stat-value">
                           {loadingOnlineCount ? '—' : onlineCount}
                       </span>
                    </div>

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

                                <button
                                    onClick={() => {
                                        navigate('/profile');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    <span className="menu-icon">👤</span>
                                    <span>Minu profiil</span>
                                </button>

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
                                            navigate('/tests');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">📝</span>
                                        <span>Testid</span>
                                    </button>
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
                                    <button
                                        onClick={() => {
                                            navigate('/department');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">👥</span>
                                        <span>Osakond</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        navigate('/shop');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    <span className="menu-icon">🛒</span>
                                    <span>Pood</span>
                                </button>

                                {/* Kiirendusrada - Level 60 required */}
                                <button
                                    onClick={() => {
                                        if (playerStats && playerStats.level >= 60) {
                                            navigate('/drag-race');
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={`menu-item ${playerStats && playerStats.level >= 60 ? '' : 'menu-item-locked'}`}
                                    disabled={!playerStats || playerStats.level < 60}
                                     >
                                       <span className="menu-icon">
                                           {playerStats && playerStats.level >= 60 ? '🏁' : '🔒'}
                                       </span>
                                    <span>
                                             Kiirendusrada
                                        {playerStats && playerStats.level < 60 && (
                                            <span className="menu-item-level-req"> (Tase 60)</span>
                                        )}
                                    </span>
                                </button>

                                {/* Minu kodu - Level 60 required */}
                                <button
                                    onClick={() => {
                                        if (playerStats && playerStats.level >= 60) {
                                            navigate('/real-estate');
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={`menu-item ${playerStats && playerStats.level >= 60 ? '' : 'menu-item-locked'}`}
                                    disabled={!playerStats || playerStats.level < 60}
                                >
                                   <span className="menu-icon">
                                       {playerStats && playerStats.level >= 60 ? '🏡' : '🔒'}
                                   </span>
                                    <span>
                                       Minu kodu
                                        {playerStats && playerStats.level < 60 && (
                                            <span className="menu-item-level-req"> (Tase 60)</span>
                                        )}
                                   </span>
                                </button>

                                <button
                                    onClick={() => {
                                        if (playerStats && playerStats.level >= 60) {
                                            navigate('/car-marketplace');
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={`menu-item ${playerStats && playerStats.level >= 60 ? '' : 'menu-item-locked'}`}
                                    disabled={!playerStats || playerStats.level < 60}
                                >
                                   <span className="menu-icon">
                                       {playerStats && playerStats.level >= 60 ? '🚗' : '🔒'}
                                   </span>
                                    <span>
                                       Autode turg
                                        {playerStats && playerStats.level < 60 && (
                                            <span className="menu-item-level-req"> (Tase 60)</span>
                                        )}
                                   </span>
                                </button>

                                <div className="menu-divider"></div>

                                <div className="menu-section">
                                    <div className="menu-section-title">Teenused</div>

                                    <button
                                        onClick={() => {
                                            navigate('/casino');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">🎰</span>
                                        <span>Kasiino</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            navigate('/bank');
                                            setIsMenuOpen(false);
                                        }}
                                        className="menu-item"
                                    >
                                        <span className="menu-icon">🏦</span>
                                        <span>Pank</span>
                                    </button>
                                </div>

                                {/* Võitlusklubi - Level 20 required */}
                                <button
                                    onClick={() => {
                                        if (playerStats && playerStats.level >= 20) {
                                            navigate('/fight-club');
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className={`menu-item ${playerStats && playerStats.level >= 20 ? '' : 'menu-item-locked'}`}
                                    disabled={!playerStats || playerStats.level < 20}
                                >
                                   <span className="menu-icon">
                                       {playerStats && playerStats.level >= 20 ? '🥊' : '🔒'}
                                   </span>
                                    <span>
                                       Võitlusklubi
                                        {playerStats && playerStats.level < 20 && (
                                            <span className="menu-item-level-req"> (Tase 20)</span>
                                        )}
                                   </span>
                                </button>


                                <div className="menu-divider"></div>

                                <button
                                    onClick={() => {
                                        navigate('/vip');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item menu-item-vip"
                                >
                                    <span className="menu-icon">💎</span>
                                    <span>VIP & Pollid</span>
                                </button>

                                <button
                                    onClick={() => {
                                        navigate('/feedback');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    <span className="menu-icon">💬</span>
                                    <span>Tagasiside & Kontakt</span>
                                </button>

                                {/* Admin Menu Item - Updated logic for admin permissions */}
                                {isAdmin && (
                                    <>
                                        <div className="menu-divider"></div>
                                        <div className="menu-section">
                                            <div className="menu-section-title">
                                                Admin
                                                {hasAdminAccess && !isSuperAdmin && (
                                                    <span style={{fontSize: '0.7rem', color: '#999', marginLeft: '4px'}}>
                                                       ({allowedTabs.length} tabi)
                                                   </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigate('/admin');
                                                    setIsMenuOpen(false);
                                                }}
                                                className="menu-item menu-item-admin"
                                            >
                                                <span className="menu-icon">⚙️</span>
                                                <span>Admin paneel</span>
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={() => {
                                        navigate('/settings');
                                        setIsMenuOpen(false);
                                    }}
                                    className="menu-item"
                                >
                                    <span className="menu-icon">⚙️</span>
                                    <span>Seaded</span>
                                </button>

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