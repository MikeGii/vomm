// src/components/estate/GarageTab.tsx
import React from 'react';
import { usePlayerStats } from '../../contexts/PlayerStatsContext';
import { useEstate } from '../../contexts/EstateContext';
import '../../styles/components/estate/GarageTab.css';

export const GarageTab: React.FC = () => {
    const { playerStats } = usePlayerStats();
    const { playerEstate } = useEstate();

    // Check if player has garage access
    const hasGarageAccess = playerEstate?.currentEstate?.hasGarage || false;

    // For now, assume no vehicles (you'll implement this later)
    const playerVehicles: any[] = []; // Future: get from playerStats.vehicles

    // If no garage access
    if (!hasGarageAccess) {
        return (
            <div className="garage-tab">
                <div className="garage-header">
                    <h2>🚗 Garaaž</h2>
                </div>
                <div className="garage-content">
                    <div className="no-garage-access">
                        <div className="no-garage-icon">🏠🚫</div>
                        <h3>Sul ei ole garaažiruumi</h3>
                        <p>Garaažiga kinnisvara ostmiseks külasta "Osta kinnisvara" vahekaarti.</p>
                    </div>
                </div>
            </div>
        );
    }

    // If has garage but no vehicles
    return (
        <div className="garage-tab">
            <div className="garage-header">
                <h2>🚗 Sinu Garaaž</h2>
                <div className="garage-info">
                    <p>Garaaži mahutavus: {playerEstate?.currentEstate?.garageCapacity} sõidukit</p>
                </div>
            </div>

            <div className="garage-content">
                {playerVehicles.length === 0 ? (
                    <div className="no-vehicles">
                        <div className="empty-garage-icon">🚗💨</div>
                        <h3>Sul ei ole veel ühtegi sõidukit</h3>
                        <p>Sõidukeid saad osta autokauplusest, kui see on mängus saadaval.</p>
                    </div>
                ) : (
                    <div className="vehicles-grid">
                        {playerVehicles.map((vehicle) => (
                            <div key={vehicle.id} className="vehicle-card">
                                <h4>{vehicle.name}</h4>
                                <p>{vehicle.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};