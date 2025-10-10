// src/components/dev/DebugMenu.tsx
import React, { useState, useEffect } from 'react';
import {
    doc, updateDoc,Timestamp, onSnapshot
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PlayerStats } from '../../types';
import { getCourseById } from '../../data/courses';
import { checkCourseCompletion } from '../../services/CourseService';
import { getCurrentServer, getServerSpecificId } from '../../utils/serverUtils';
import '../../styles/components/dev/DebugMenu.css';

const ADMIN_USER_ID = 'WUucfDi2DAat9sgDY75mDZ8ct1k2';

export const DebugMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [currentServer, setCurrentServer] = useState(getCurrentServer());
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // Load player stats with server-specific ID
    useEffect(() => {
        if (!currentUser) return;

        const serverSpecificId = getServerSpecificId(currentUser.uid, currentServer);
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);

        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setPlayerStats(doc.data() as PlayerStats);
            }
        });

        return () => unsubscribe();
    }, [currentUser, currentServer]);

    // Listen for server changes
    useEffect(() => {
        const handleServerChange = () => {
            setCurrentServer(getCurrentServer());
        };

        window.addEventListener('storage', handleServerChange);
        window.addEventListener('serverChanged', handleServerChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleServerChange);
            window.removeEventListener('serverChanged', handleServerChange as EventListener);
        };
    }, []);

    // Only show for admin user
    if (!currentUser || currentUser.uid !== ADMIN_USER_ID) {
        return null;
    }

    const executeDebugAction = async (action: () => Promise<void>, successMessage: string) => {
        setLoading(true);
        try {
            await action();
            showToast(successMessage, 'success');
        } catch (error) {
            console.error('Debug action failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Tegevus ebaõnnestus';
            showToast(`Viga: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const completeActiveCourse = async () => {
        if (!playerStats?.activeCourse || playerStats.activeCourse.status !== 'in_progress') {
            throw new Error('Sul pole aktiivet kursust');
        }

        const serverSpecificId = getServerSpecificId(currentUser.uid, currentServer);
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);

        const pastTime = Timestamp.fromMillis(Date.now() - 5000);
        await updateDoc(statsRef, {
            'activeCourse.endsAt': pastTime
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const wasCompleted = await checkCourseCompletion(currentUser.uid);
        if (!wasCompleted) {
            throw new Error('Kursuse lõpetamine ebaõnnestus');
        }
    };

    const shortenWorkTime = async () => {
        if (!playerStats?.activeWork) {
            throw new Error('Sul pole aktiivet tööd');
        }

        const serverSpecificId = getServerSpecificId(currentUser.uid, currentServer);
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);
        const newEndTime = Timestamp.fromMillis(Date.now() + 20 * 1000);

        await updateDoc(statsRef, {
            'activeWork.endsAt': newEndTime
        });
    };

    const fillTrainingClicks = async () => {
        const serverSpecificId = getServerSpecificId(currentUser.uid, currentServer);
        const statsRef = doc(firestore, 'playerStats', serverSpecificId);

        await updateDoc(statsRef, {
            'trainingData.remainingClicks': 50,
            'kitchenLabTrainingData.remainingClicks': 50,
            'handicraftTrainingData.remainingClicks': 50
        });
    };

    const getActiveCourseInfo = () => {
        if (!playerStats?.activeCourse || playerStats.activeCourse.status !== 'in_progress') {
            return null;
        }
        const course = getCourseById(playerStats.activeCourse.courseId);
        return course ? course.name : 'Tundmatu kursus';
    };

    const activeCourseInfo = getActiveCourseInfo();

    return (
        <>
            <button
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Admin Debug"
            >
                🔧
            </button>

            {isOpen && (
                <div className="debug-menu">
                    <div className="debug-header">
                        <h3>Admin Debug [{currentServer.toUpperCase()}]</h3>
                        <button className="debug-close" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="debug-content">
                        {/* Server Info */}
                        <div className="debug-section">
                            <h4>Server: {currentServer}</h4>
                            <div className="debug-info-text" style={{ fontSize: '0.85rem' }}>
                                Kõik tegevused mõjutavad ainult <strong>{currentServer}</strong> serverit
                            </div>
                        </div>

                        {/* Rest of your sections... */}
                        <div className="debug-section">
                            <h4>Aktiivne kursus</h4>
                            {activeCourseInfo ? (
                                <button
                                    className="debug-btn"
                                    onClick={() => executeDebugAction(
                                        completeActiveCourse,
                                        `Kursus "${activeCourseInfo}" lõpetatud`
                                    )}
                                    disabled={loading}
                                >
                                    Lõpeta: {activeCourseInfo}
                                </button>
                            ) : (
                                <div className="debug-info-text">Sul pole hetkel aktiivet kursust</div>
                            )}
                        </div>

                        <div className="debug-section">
                            <h4>Töö kiirenda</h4>
                            {playerStats?.activeWork ? (
                                <button
                                    className="debug-btn"
                                    onClick={() => executeDebugAction(
                                        shortenWorkTime,
                                        'Töö aeg lühendatud 20 sekundile'
                                    )}
                                    disabled={loading}
                                >
                                    Lühenda töö aega 20 sekundile
                                </button>
                            ) : (
                                <div className="debug-info-text">Sul pole hetkel aktiivet tööd</div>
                            )}
                        </div>

                        <div className="debug-section">
                            <h4>Treening</h4>
                            <button
                                className="debug-btn"
                                onClick={() => executeDebugAction(
                                    fillTrainingClicks,
                                    'Treeningu klikid täidetud'
                                )}
                                disabled={loading}
                            >
                                Täida kõik treeningu klikid (50/50)
                            </button>
                        </div>
                        <div className="debug-info">
                            <small>
                                Server: {currentServer}<br/>
                                Admin ID: {currentUser.uid.substring(0, 8)}...<br/>
                                Email: {currentUser.email}
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};