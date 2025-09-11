// src/pages/DragRacePage.tsx (Fixed version)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerStats } from '../contexts/PlayerStatsContext';
import { useToast } from '../contexts/ToastContext';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { DragRaceHeader } from '../components/dragrace/DragRaceHeader';
import { FuelDisplay } from '../components/dragrace/FuelDisplay';
import { ActiveCarDisplay } from '../components/dragrace/ActiveCarDisplay';
import { TrainingOptions } from '../components/dragrace/TrainingOptions';
import { CarSelectionModal } from '../components/dragrace/CarSelectionModal';
import { FuelPurchaseModal } from '../components/dragrace/FuelPurchaseModal';
import { DragRaceService } from '../services/DragRaceService';
import { ActiveCarService } from '../services/ActiveCarService';
import { FuelSystem, TrainingType, FuelPurchaseOption } from '../types/dragRace';
import { PlayerCar } from '../types/vehicles';
import { VehicleModel } from '../types/vehicleDatabase';
import '../styles/pages/DragRace.css';

const DragRacePage: React.FC = () => {
    const { currentUser } = useAuth();
    const { playerStats, loading: statsLoading } = usePlayerStats();
    const { showToast } = useToast();

    // State management
    const [fuelSystem, setFuelSystem] = useState<FuelSystem | null>(null);
    const [activeCar, setActiveCar] = useState<{ car: PlayerCar; model: VehicleModel } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTraining, setIsTraining] = useState(false);

    // Local state for immediate UI updates
    const [localPlayerStats, setLocalPlayerStats] = useState(playerStats);

    // Modal states
    const [showCarSelection, setShowCarSelection] = useState(false);
    const [showFuelPurchase, setShowFuelPurchase] = useState(false);
    const [fuelPurchaseOptions, setFuelPurchaseOptions] = useState<FuelPurchaseOption[]>([]);

    // Update local stats when playerStats changes
    useEffect(() => {
        if (playerStats) {
            setLocalPlayerStats(playerStats);
        }
    }, [playerStats]);

    // FIXED: Use useCallback to fix ESLint warning
    const loadDragRaceData = useCallback(async () => {
        if (!currentUser || !playerStats) return;

        try {
            setIsLoading(true);

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
            setIsLoading(false);
        }
    }, [currentUser, playerStats, showToast]);

    // Load initial data
    useEffect(() => {
        if (!currentUser || !playerStats || statsLoading) return;

        loadDragRaceData();
    }, [currentUser, playerStats, statsLoading, loadDragRaceData]);

    const handleTraining = async (trainingType: TrainingType) => {
        if (!currentUser || !localPlayerStats || !fuelSystem) return;

        // Check if has active car
        if (!localPlayerStats.activeCarId) {
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
                localPlayerStats
            );

            // Update local fuel state immediately
            setFuelSystem(prev => prev ? {
                ...prev,
                currentFuel: result.remainingFuel
            } : null);

            // Update local player stats immediately for UI responsiveness
            setLocalPlayerStats(prev => {
                if (!prev?.attributes) return prev;

                const updatedAttributes = { ...prev.attributes };
                const currentAttr = updatedAttributes[trainingType];

                if (currentAttr) {
                    updatedAttributes[trainingType] = {
                        ...currentAttr,
                        level: result.currentLevel,
                        experience: result.currentExperience,
                        experienceForNextLevel: result.experienceForNextLevel
                    };
                }

                return {
                    ...prev,
                    attributes: updatedAttributes
                };
            });

            // Show appropriate success message
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

    const handleCarSelection = async (carId: string) => {
        if (!currentUser) return;

        try {
            await ActiveCarService.setActiveCar(currentUser.uid, carId);

            // Update local state immediately
            setLocalPlayerStats(prev => prev ? { ...prev, activeCarId: carId } : prev);

            // Reload active car data
            const activeCarData = await ActiveCarService.getActiveCar(currentUser.uid, carId);
            setActiveCar(activeCarData);

            setShowCarSelection(false);
            showToast('Aktiivne auto määratud!', 'success');

        } catch (error: any) {
            console.error('Error setting active car:', error);
            showToast(error.message || 'Viga auto määramisel', 'error');
        }
    };

    const handleFuelPurchase = async () => {
        if (!currentUser || !localPlayerStats) return;

        try {
            const options = await DragRaceService.getFuelPurchaseOptions(currentUser.uid, localPlayerStats);
            setFuelPurchaseOptions(options);
            setShowFuelPurchase(true);
        } catch (error: any) {
            console.error('Error loading fuel options:', error);
            showToast('Viga kütuse ostmisel', 'error');
        }
    };

    const handleFuelPurchaseConfirm = async (purchaseType: 'money' | 'pollid', quantity: number) => {
        if (!currentUser || !localPlayerStats) return;

        try {
            const result = await DragRaceService.purchaseFuel(
                currentUser.uid,
                purchaseType,
                quantity,
                localPlayerStats
            );

            if (result.success) {
                // Update local state immediately for instant UI feedback
                setLocalPlayerStats(prev => {
                    if (!prev) return prev;
                    const currencyField = purchaseType === 'money' ? 'money' : 'pollid';
                    return {
                        ...prev,
                        [currencyField]: (prev[currencyField as keyof typeof prev] as number) - result.totalCost
                    };
                });

                // Update fuel state immediately
                setFuelSystem(prev => prev ? {
                    ...prev,
                    currentFuel: result.newFuelCount,
                    paidAttemptsUsed: purchaseType === 'money' ?
                        prev.paidAttemptsUsed + result.actualQuantity :
                        prev.paidAttemptsUsed
                } : null);

                const currencyText = purchaseType === 'money' ? '€' : 'pollid';
                let message = `Kütus ostetud! ${result.actualQuantity} katset (-${result.totalCost} ${currencyText})`;

                // Show warning if couldn't buy full quantity
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

    if (statsLoading || isLoading) {
        return (
            <div className="page-container">
                <AuthenticatedHeader />
                <div className="dr-loading-container">
                    <div className="dr-loading-spinner">Laen...</div>
                </div>
            </div>
        );
    }

    if (!localPlayerStats) {
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

            <div className="dr-page">
                <DragRaceHeader />

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

                        {/* Training Options - Use local stats for immediate updates */}
                        <TrainingOptions
                            playerStats={localPlayerStats}
                            fuelSystem={fuelSystem}
                            isTraining={isTraining}
                            onTraining={handleTraining}
                        />
                    </div>
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

            {showFuelPurchase && (
                <FuelPurchaseModal
                    isOpen={showFuelPurchase}
                    onClose={() => setShowFuelPurchase(false)}
                    onPurchase={handleFuelPurchaseConfirm}
                    purchaseOptions={fuelPurchaseOptions}
                    playerStats={localPlayerStats}
                />
            )}
        </div>
    );
};

export default DragRacePage;