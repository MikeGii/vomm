// src/components/dragrace/RacingOptions.tsx
import React, { useState } from 'react';
import { DRAG_RACE_TRACKS } from '../../types/dragRace';
import { FuelSystem } from '../../types/dragRace';
import { PlayerStats } from '../../types';
import { PlayerCar } from '../../types/vehicles';
import { VehicleModel } from '../../types/vehicleDatabase';
import '../../styles/components/dragrace/RacingOptions.css'

interface RacingOptionsProps {
    playerStats: PlayerStats;
    fuelSystem: FuelSystem | null;
    activeCar: { car: PlayerCar; model: VehicleModel } | null;
    isRacing: boolean;
    onRace: (trackId: string) => void;
}

export const RacingOptions: React.FC<RacingOptionsProps> = ({
                                                                playerStats, fuelSystem, activeCar, isRacing, onRace
                                                            }) => {
    return (
        <div className="dr-racing-options">
            <div className="dr-racing-header">
                <h2>Vali drag race rada</h2>
                <p>Iga sõit kulutab 1 kütust ja lisab auto läbisõidule 1.6km</p>
            </div>

            <div className="dr-tracks-grid">
                {DRAG_RACE_TRACKS.map(track => (
                    <div key={track.id} className="dr-track-option">
                        <div className="dr-track-header">
                            <span className="dr-track-icon">{track.icon}</span>
                            <h3>{track.name}</h3>
                        </div>
                        <p className="dr-track-description">{track.description}</p>
                        <div className="dr-track-info">
                            <span className="dr-track-distance">Distants: {track.distance} miili</span>
                        </div>

                        <button
                            className={`dr-race-button ${(!fuelSystem || fuelSystem.currentFuel <= 0 || !activeCar) ? 'dr-disabled' : ''}`}
                            disabled={!fuelSystem || fuelSystem.currentFuel <= 0 || !activeCar || isRacing}
                            onClick={() => onRace(track.id)}
                        >
                            {isRacing ? 'Sõidab...' : 'Alusta sõitu'}
                        </button>

                        {!activeCar && (
                            <div className="dr-race-warning">
                                <span>⚠️ Vaja aktiivset autot</span>
                            </div>
                        )}

                        {(!fuelSystem || fuelSystem.currentFuel <= 0) && (
                            <div className="dr-race-warning">
                                <span>⛽ Kütus on otsas</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};