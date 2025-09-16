// src/pages/DragRacePage.tsx - UPDATED WITH TABS SYSTEM
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { TabNavigation } from '../components/ui/TabNavigation';
import { FuelDisplay } from '../components/dragrace/FuelDisplay';
import { ActiveCarDisplay } from '../components/dragrace/ActiveCarDisplay';
import { TrainingOptions } from '../components/dragrace/TrainingOptions';
import { CarSelectionModal } from '../components/dragrace/CarSelectionModal';
import { FuelPurchaseModal } from '../components/dragrace/FuelPurchaseModal';
import { DragRaceService } from '../services/DragRaceService';
import { DragRaceInstructions } from '../components/dragrace/DragRaceInstructions';
import { ActiveCarService } from '../services/ActiveCarService';
import {FuelSystem, TrainingType, FuelPurchaseOption, DRAG_RACE_TRACKS} from '../types/dragRace';
import { PlayerCar } from '../types/vehicles';
import { useNavigate } from 'react-router-dom';
import { VehicleModel } from '../types/vehicleDatabase';
import { RacingOptions } from '../components/dragrace/RacingOptions';
import { RaceResultModal } from '../components/dragrace/RaceResultModal';
import { DragRaceResult } from '../types/dragRace';
import '../styles/pages/DragRace.css';

const DragRacePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading: statsLoading } = usePlayerStats();
    const { showToast } = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState<'training' | 'racing' | 'leaderboard'>('training');

    // State management
    const [fuelSystem, setFuelSystem] = useState<FuelSystem | null>(null);
    const [activeCar, setActiveCar] = useState<{ car: PlayerCar; model: VehicleModel } | null>(null);
    const [isTraining, setIsTraining] = useState(false);

    // Modal states
    const [showCarSelection, setShowCarSelection] = useState(false);
    const [showFuelPurchase, setShowFuelPurchase] = useState(false);
    const [fuelPurchaseOptions, setFuelPurchaseOptions] = useState<FuelPurchaseOption[]>([]);

    const [raceResult, setRaceResult] = useState<DragRaceResult | null>(null);
    const [showRaceResult, setShowRaceResult] = useState(false);
    const [isRacing, setIsRacing] = useState(false);
    const [selectedTrackName, setSelectedTrackName] = useState<string>('');

    // Tabs configuration
    const dragRaceTabs = [
        { id: 'training', label: '🏃‍♂️ Treening' },
        { id: 'racing', label: '🏁 Võidusõidud' },
        { id: 'leaderboard', label: '🏆 Edetabel' }
    ];

    // Load drag race data
    const loadDragRaceData = useCallback(async () => {
        if (!currentUser || !playerStats) return;

        try {
            await DragRaceService.initializeDragRaceAttributes(currentUser.uid);

            // Load fuel system
            const fuel = await DragRaceService.checkAndResetFuel(currentUser.uid);
            setFuelSystem(fuel);

            // Load active car if set
            if (playerStats.activeCarId) {
                const activeCarData = await ActiveCarService.getActiveCar(
                    currentUser.uid,
                    playerStats.activeCarId
                );
                setActiveCar(activeCarData);
            }

        } catch (error) {
            console.error('Error loading drag race data:', error);
            showToast('Viga andmete laadimisel', 'error');
        }
    }, [currentUser, playerStats, showToast]);

    // Load initial data when player stats are available
    useEffect(() => {
        if (!currentUser || !playerStats || statsLoading) return;
        loadDragRaceData();
    }, [currentUser, playerStats, statsLoading, loadDragRaceData]);

    // Training handler
    const handleTraining = async (trainingType: TrainingType) => {
        if (!currentUser || !playerStats || !fuelSystem) return;

        // Check if has active car
        if (!playerStats.activeCarId) {
            showToast('Määra esmalt aktiivne auto!', 'error');
            setShowCarSelection(true);
            return;
        }

        // Check fuel
        if (fuelSystem.currentFuel <= 0) {
            showToast('Kütus on otsas! Osta lisaks või oota järgmist tundi.', 'error');
            setShowFuelPurchase(true);
            return;
        }

        try {
            setIsTraining(true);

            const result = await DragRaceService.performTraining(
                currentUser.uid,
                trainingType,
                playerStats
            );

            setFuelSystem(prev => prev ? {
                ...prev,
                currentFuel: result.remainingFuel
            } : null);

            if (result.levelUp) {
                if (result.levelsGained && result.levelsGained > 1) {
                    showToast(`🎉 ${result.levelsGained} taset tõusis! Uus tase: ${result.newLevel} (+${result.experienceGained} XP)`, 'success');
                } else {
                    showToast(`🎉 Tase tõusis! Uus tase: ${result.newLevel} (+${result.experienceGained} XP)`, 'success');
                }
            } else {
                showToast(`✅ Treening lõpetatud! +${result.experienceGained} XP saadud`, 'success');
            }

        } catch (error: any) {
            console.error('Training error:', error);
            showToast(error.message || 'Viga treeningu sooritamisel', 'error');
        } finally {
            setIsTraining(false);
        }
    };

    // Race handler
    const handleRace = async (trackId: string) => {
        if (!currentUser || !playerStats || !fuelSystem || !activeCar) return;

        // Check if has active car
        if (!playerStats.activeCarId) {
            showToast('Määra esmalt aktiivne auto!', 'error');
            setShowCarSelection(true);
            return;
        }

        // Check fuel
        if (fuelSystem.currentFuel <= 0) {
            showToast('Kütus on otsas! Osta lisaks või oota järgmist tundi.', 'error');
            setShowFuelPurchase(true);
            return;
        }

        try {
            setIsRacing(true);

            // Find track name for result modal
            const track = DRAG_RACE_TRACKS.find(t => t.id === trackId);
            setSelectedTrackName(track?.name || 'Tundmatu rada');

            const result = await DragRaceService.performDragRace(
                currentUser.uid,
                trackId,
                playerStats,
                activeCar
            );

            // Update fuel system locally for immediate UI feedback
            setFuelSystem(prev => prev ? {
                ...prev,
                currentFuel: result.remainingFuel
            } : null);

            // Show race result modal
            setRaceResult(result.result);
            setShowRaceResult(true);

            // Show success toast
            if (result.result.isPersonalBest) {
                showToast(`🏆 Uus rekord! Aeg: ${result.result.time.toFixed(3)}s`, 'success');
            } else {
                showToast(`🏁 Sõit lõpetatud! Aeg: ${result.result.time.toFixed(3)}s`, 'success');
            }

        } catch (error: any) {
            console.error('Race error:', error);
            showToast(error.message || 'Viga võidusõidu sooritamisel', 'error');
        } finally {
            setIsRacing(false);
        }
    };

    // Race again handler
    const handleRaceAgain = () => {
        setShowRaceResult(false);
        setRaceResult(null);
        // User can immediately start another race
    };

    // Car selection handler
    const handleCarSelection = async (carId: string) => {
        if (!currentUser) return;

        try {
            await ActiveCarService.setActiveCar(currentUser.uid, carId);
            const activeCarData = await ActiveCarService.getActiveCar(currentUser.uid, carId);
            setActiveCar(activeCarData);
            setShowCarSelection(false);
            showToast('Aktiivne auto määratud!', 'success');

        } catch (error: any) {
            console.error('Error setting active car:', error);
            showToast(error.message || 'Viga auto määramisel', 'error');
        }
    };

    // Fuel purchase setup
    const handleFuelPurchase = async () => {
        if (!currentUser || !playerStats) return;

        try {
            const options = await DragRaceService.getFuelPurchaseOptions(currentUser.uid, playerStats);
            setFuelPurchaseOptions(options);
            setShowFuelPurchase(true);
        } catch (error: any) {
            console.error('Error loading fuel options:', error);
            showToast('Viga kütuse ostmisel', 'error');
        }
    };

    // Fuel purchase handler
    const handleFuelPurchaseConfirm = async (purchaseType: 'money' | 'pollid', quantity: number) => {
        if (!currentUser || !playerStats) return;

        try {
            const result = await DragRaceService.purchaseFuel(
                currentUser.uid,
                purchaseType,
                quantity,
                playerStats
            );

            if (result.success) {
                setFuelSystem(prev => prev ? {
                    ...prev,
                    currentFuel: result.newFuelCount,
                    paidAttemptsUsed: purchaseType === 'money' ?
                        prev.paidAttemptsUsed + result.actualQuantity :
                        prev.paidAttemptsUsed
                } : null);

                const currencyText = purchaseType === 'money' ? '€' : 'pollid';
                let message = `Kütus ostetud! ${result.actualQuantity} katset (-${result.totalCost} ${currencyText})`;

                if (result.actualQuantity < quantity) {
                    message += ` (said osta ainult ${result.actualQuantity}/${quantity})`;
                }

                showToast(message, 'success');
                setShowFuelPurchase(false);
            }
        } catch (error: any) {
            console.error('Fuel purchase error:', error);
            showToast(error.message || 'Viga kütuse ostmisel', 'error');
        }
    };

    // Render tab content based on active tab
    const renderTabContent = () => {
        // Add null check here
        if (!playerStats) return null;

        switch (activeTab) {
            case 'training':
                return (
                    <>
                        {/* Fuel and Active Car Info */}
                        <div className="dr-info-section">
                            <FuelDisplay
                                fuelSystem={fuelSystem}
                                onPurchaseFuel={handleFuelPurchase}
                            />
                            <ActiveCarDisplay
                                activeCar={activeCar}
                                onSelectCar={() => setShowCarSelection(true)}
                            />
                        </div>

                        {/* Training Options - now playerStats is guaranteed to not be null */}
                        <TrainingOptions
                            playerStats={playerStats}
                            fuelSystem={fuelSystem}
                            isTraining={isTraining}
                            onTraining={handleTraining}
                        />
                    </>
                );

            case 'racing':
                return (
                    <>
                        {/* Fuel and Active Car Info (shared with training) */}
                        <div className="dr-info-section">
                            <FuelDisplay
                                fuelSystem={fuelSystem}
                                onPurchaseFuel={handleFuelPurchase}
                            />
                            <ActiveCarDisplay
                                activeCar={activeCar}
                                onSelectCar={() => setShowCarSelection(true)}
                            />
                        </div>

                        {/* Racing Options */}
                        <RacingOptions
                            playerStats={playerStats}
                            fuelSystem={fuelSystem}
                            activeCar={activeCar}
                            isRacing={isRacing}
                            onRace={handleRace}
                        />
                    </>
                );

            case 'leaderboard':
                return (
                    <div className="dr-coming-soon">
                        <h2>🏆 Edetabel</h2>
                        <p>Edetabel tuleb peagi!</p>
                        <p>Siia tuleb parimate aegade nimekiri 1/2 miili ja 1 miili jaoks.</p>
                    </div>
                );

            default:
                return null;
        }
    };

    // Error state
    if (!playerStats) {
        return (
            <div className="page-container">
                <AuthenticatedHeader />
                <div className="dr-error-container">
                    <p>Viga mängija andmete laadimisel</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <AuthenticatedHeader />

            <div className="dr-content">
                <button
                    className="back-to-dashboard"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Tagasi töölauale
                </button>

                <DragRaceInstructions />

                {/* Tab Navigation */}
                <TabNavigation
                    tabs={dragRaceTabs}
                    activeTab={activeTab}
                    onTabChange={(tabId) => setActiveTab(tabId as 'training' | 'racing' | 'leaderboard')}
                />

                {/* Tab Content */}
                <div className="dr-main">
                    {renderTabContent()}
                </div>
            </div>

            {/* Modals */}
            {showCarSelection && (
                <CarSelectionModal
                    isOpen={showCarSelection}
                    onClose={() => setShowCarSelection(false)}
                    onSelectCar={handleCarSelection}
                    currentUserId={currentUser?.uid || ''}
                />
            )}

            {showFuelPurchase && playerStats && (
                <FuelPurchaseModal
                    isOpen={showFuelPurchase}
                    onClose={() => setShowFuelPurchase(false)}
                    onPurchase={handleFuelPurchaseConfirm}
                    purchaseOptions={fuelPurchaseOptions}
                    playerStats={playerStats}
                />
            )}

            {/* Race Result Modal */}
            {showRaceResult && raceResult && (
                <RaceResultModal
                    isOpen={showRaceResult}
                    result={raceResult}
                    trackName={selectedTrackName}
                    onClose={() => setShowRaceResult(false)}
                    onRaceAgain={handleRaceAgain}
                />
            )}
        </div>
    );
};

export default DragRacePage;