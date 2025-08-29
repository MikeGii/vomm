// src/pages/TestsPage.tsx - Updated to match existing page structure
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TestTabs } from '../components/tests/TestTabs';
import { TestsList } from '../components/tests/TestsList';
import { ActiveTestInterface } from '../components/tests/ActiveTestInterface';
import { TestResultsModal } from '../components/tests/TestResultsModal';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import { Test,CompletedTest } from '../types';
import {
    getAvailableTests,
    startTest,
    finishTest,
    forceFinishExpiredTest,
    getRemainingTime
} from '../services/TestService';
import '../styles/pages/Tests.css';

type TabType = 'abipolitseinik' | 'sisekaitseakadeemia' | 'politsei';

const TestsPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading, refreshStats } = usePlayerStats();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<TabType>('abipolitseinik');
    const [availableTests, setAvailableTests] = useState<Test[]>([]);
    const [isStartingTest, setIsStartingTest] = useState(false);
    const [completedTest, setCompletedTest] = useState<CompletedTest | null>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load available tests when player stats change
    useEffect(() => {
        if (playerStats && !loading) {
            const tests = getAvailableTests(playerStats);
            setAvailableTests(tests);
        }
    }, [playerStats, loading]);

    // Check for expired test on mount and set up timer
    useEffect(() => {
        if (!currentUser || !playerStats) return;

        const checkExpiredTest = async () => {
            if (playerStats.activeTest) {
                const remainingTime = getRemainingTime(playerStats.activeTest);
                if (remainingTime <= 0) {
                    try {
                        const result = await forceFinishExpiredTest(currentUser.uid);
                        if (result) {
                            setCompletedTest(result);
                            setShowResultsModal(true);
                            showToast('Test lõpetati automaatselt - aeg sai otsa!', 'info');
                            await refreshStats();
                        }
                    } catch (error) {
                        console.error('Error finishing expired test:', error);
                    }
                }
            }
        };

        checkExpiredTest();

        // Set up interval to check for expired tests
        if (playerStats.activeTest) {
            intervalRef.current = setInterval(checkExpiredTest, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentUser, playerStats, refreshStats, showToast]);

    // Handle starting a test
    const handleStartTest = useCallback(async (testId: string) => {
        if (!currentUser || !playerStats) return;

        setIsStartingTest(true);
        try {
            await startTest(currentUser.uid, testId);
            await refreshStats();
            showToast('Test alustatud! Sul on 15 minutit aega.', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Viga testi alustamisel';
            showToast(errorMessage, 'error');
        } finally {
            setIsStartingTest(false);
        }
    }, [currentUser, playerStats, refreshStats, showToast]);

    // Handle finishing a test
    const handleFinishTest = useCallback(async () => {
        if (!currentUser) return;

        try {
            const result = await finishTest(currentUser.uid);
            setCompletedTest(result);
            setShowResultsModal(true);
            await refreshStats();

            const scorePercentage = Math.round((result.score / result.totalQuestions) * 100);
            showToast(`Test lõpetatud! Skoor: ${result.score}/${result.totalQuestions} (${scorePercentage}%)`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Viga testi lõpetamisel';
            showToast(errorMessage, 'error');
        }
    }, [currentUser, refreshStats, showToast]);

    // Handle closing results modal
    const handleCloseResults = useCallback(() => {
        setShowResultsModal(false);
        setCompletedTest(null);
    }, []);

    // Get tests for current tab
    const getTestsForTab = useCallback((tab: TabType): Test[] => {
        return availableTests.filter(test => test.category === tab);
    }, [availableTests]);

    if (loading) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="tests-container">
                    <div className="loading">Laen teste...</div>
                </div>
            </div>
        );
    }

    if (!playerStats) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="tests-container">
                    <div className="loading">Viga andmete laadimisel</div>
                </div>
            </div>
        );
    }

    // If player has active test, show test interface
    if (playerStats.activeTest) {
        return (
            <div className="page">
                <AuthenticatedHeader />
                <div className="tests-container">
                    <button
                        className="back-to-dashboard"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Tagasi töölauale
                    </button>

                    <ActiveTestInterface
                        activeTest={playerStats.activeTest}
                        onFinishTest={handleFinishTest}
                        onRefreshStats={refreshStats}
                    />
                </div>
                {showResultsModal && completedTest && (
                    <TestResultsModal
                        completedTest={completedTest}
                        onClose={handleCloseResults}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="page">
            <AuthenticatedHeader />
            <div className="tests-container">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <h1 className="tests-title">Testid</h1>

                <div className="tests-description">
                    <p>Lõpeta koolitusi, et avada uusi teste. Iga test sisaldab 10 küsimust ja aega on 15 minutit.</p>
                </div>

                {/* NEW INFO SECTION */}
                <div className="tests-info-section">
                    <div className="info-header">
                        <span className="info-icon">ℹ️</span>
                        <h2 className="info-title">Testide süsteemi kohta</h2>
                    </div>
                    <div className="info-content">
                        <ul className="info-list">
                            <li>
                                Testid on puhtalt mängijate enda koostatud ja mängu autor ei vastuta testide korrektuse eest.
                            </li>
                            <li>
                                Testid on loodud puhtalt seadusandluse õppimise ja tundmise eesmärgil, et luua juurde mängu temaatilist kontenti.
                            </li>
                            <li>
                                Teste saab teha iga mängija ühe korra mängu jooksul ja testi sooritamisel on ajaline piirang.
                            </li>
                            <li>
                                Kui soovid ka oma testi mängijatele koostada anna sellest märku. Test peab koosnema 10 küsimusest ja testid avanevad kui mängija läbib mõne koolituse mängusiseselt. Test peaks olema ka antud koolituse temaatiline. Tasud ja boonused testi lahendamisel sõltub testi keerukusest ja mängus seonduva koolituse nõuetest.
                            </li>
                        </ul>
                        <div className="contact-highlight">
                            💡 Soovituse korral võta ühendust administraatoriga uue testi loomiseks.
                        </div>
                    </div>
                </div>
                {/* END NEW INFO SECTION */}

                <TestTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    testCounts={{
                        abipolitseinik: getTestsForTab('abipolitseinik').length,
                        sisekaitseakadeemia: getTestsForTab('sisekaitseakadeemia').length,
                        politsei: getTestsForTab('politsei').length
                    }}
                />

                <TestsList
                    tests={getTestsForTab(activeTab)}
                    playerStats={playerStats}
                    onStartTest={handleStartTest}
                    isStartingTest={isStartingTest}
                />
            </div>

            {showResultsModal && completedTest && (
                <TestResultsModal
                    completedTest={completedTest}
                    onClose={handleCloseResults}
                />
            )}
        </div>
    );
};

export default TestsPage;