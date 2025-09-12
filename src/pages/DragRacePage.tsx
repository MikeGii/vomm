// src/pages/DragRacePage.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { FuelDisplay } from '../components/dragrace/FuelDisplay';
import { ActiveCarDisplay } from '../components/dragrace/ActiveCarDisplay';
import { TrainingOptions } from '../components/dragrace/TrainingOptions';
import { CarSelectionModal } from '../components/dragrace/CarSelectionModal';
import { FuelPurchaseModal } from '../components/dragrace/FuelPurchaseModal';
import { DragRaceService } from '../services/DragRaceService';
import { DragRaceInstructions } from '../components/dragrace/DragRaceInstructions';
import { ActiveCarService } from '../services/ActiveCarService';
import { FuelSystem, TrainingType, FuelPurchaseOption } from '../types/dragRace';
import { PlayerCar } from '../types/vehicles';
import { useNavigate } from 'react-router-dom';
import { VehicleModel } from '../types/vehicleDatabase';
import '../styles/pages/DragRace.css';

const DragRacePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { playerStats, loading: statsLoading } = usePlayerStats();
    const { showToast } = useToast();

    // State management
    const [fuelSystem, setFuelSystem] = useState<FuelSystem | null>(null);
    const [activeCar, setActiveCar] = useState<{ car: PlayerCar; model: VehicleModel } | null>(null);
    const [isTraining, setIsTraining] = useState(false);

    // Modal states
    const [showCarSelection, setShowCarSelection] = useState(false);
    const [showFuelPurchase, setShowFuelPurchase] = useState(false);
    const [fuelPurchaseOptions, setFuelPurchaseOptions] = useState<FuelPurchaseOption[]>([]);

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
        } finally {
        }
    }, [currentUser, playerStats, showToast]);

    // Load initial data when player stats are available
    useEffect(() => {
        if (!currentUser || !playerStats || statsLoading) return;
        loadDragRaceData();
    }, [currentUser, playerStats, statsLoading, loadDragRaceData]);

    // FIXED: Clean training handler - no local state management
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

            // Call service - PlayerStatsContext will automatically update via onSnapshot
            const result = await DragRaceService.performTraining(
                currentUser.uid,
                trainingType,
                playerStats
            );

            // Only update fuel system locally for immediate UI feedback
            setFuelSystem(prev => prev ? {
                ...prev,
                currentFuel: result.remainingFuel
            } : null);

            // Show success message
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

    // FIXED: Clean car selection handler
    const handleCarSelection = async (carId: string) => {
        if (!currentUser) return;

        try {
            // Set active car - PlayerStatsContext will update automatically
            await ActiveCarService.setActiveCar(currentUser.uid, carId);

            // Reload active car data for immediate UI update
            const activeCarData = await ActiveCarService.getActiveCar(currentUser.uid, carId);
            setActiveCar(activeCarData);

            setShowCarSelection(false);
            showToast('Aktiivne auto määratud!', 'success');

        } catch (error: any) {
            console.error('Error setting active car:', error);
            showToast(error.message || 'Viga auto määramisel', 'error');
        }
    };

    // FIXED: Clean fuel purchase setup
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

    // FIXED: Clean fuel purchase handler
    const handleFuelPurchaseConfirm = async (purchaseType: 'money' | 'pollid', quantity: number) => {
        if (!currentUser || !playerStats) return;

        try {
            // Purchase fuel - PlayerStatsContext will update currency automatically
            const result = await DragRaceService.purchaseFuel(
                currentUser.uid,
                purchaseType,
                quantity,
                playerStats
            );

            if (result.success) {
                // Update fuel state immediately for UI feedback
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

    // Error state - check playerStats from context
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

                <div className="dr-content">
                    <DragRaceInstructions />

                <div className="dr-content">
                    <div className="dr-main">
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

                        {/* Training Options - Use context playerStats directly */}
                        <TrainingOptions
                            playerStats={playerStats}
                            fuelSystem={fuelSystem}
                            isTraining={isTraining}
                            onTraining={handleTraining}
                        />
                    </div>
                </div>
            </div>
                </div>

            {/* Car Selection Modal */}
            {showCarSelection && (
                <CarSelectionModal
                    isOpen={showCarSelection}
                    onClose={() => setShowCarSelection(false)}
                    onSelectCar={handleCarSelection}
                    currentUserId={currentUser?.uid || ''}
                />
            )}

            {/* Fuel Purchase Modal */}
            {showFuelPurchase && (
                <FuelPurchaseModal
                    isOpen={showFuelPurchase}
                    onClose={() => setShowFuelPurchase(false)}
                    onPurchase={handleFuelPurchaseConfirm}
                    purchaseOptions={fuelPurchaseOptions}
                    playerStats={playerStats}
                />
            )}
            </div>
    );
};

export default DragRacePage;