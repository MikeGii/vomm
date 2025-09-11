// src/components/carMarketplace/CarListItem.tsx - CLEANED: Universal tuning system compatible

import React from 'react';
import { VehicleModel, VehicleEngine } from '../../types/vehicleDatabase';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { createDefaultUniversalTuning } from '../../types/vehicles';
import '../../styles/components/carMarketplace/CarListItem.css';

interface CarListItemProps {
    model: VehicleModel;
    engines: VehicleEngine[];
    onPurchase: (model: VehicleModel) => void;
    playerMoney: number;
    playerPollid?: number;
    isPurchasing?: boolean;
}

const CarListItem: React.FC<CarListItemProps> = ({
                                                     model,
                                                     engines,
                                                     onPurchase,
                                                     playerMoney,
                                                     playerPollid = 0,
                                                     isPurchasing = false
                                                 }) => {
    // Leia vaikimisi mootor
    const defaultEngine = engines.find(e => e.id === model.defaultEngineId);

    if (!defaultEngine) {
        console.error(`Default engine ${model.defaultEngineId} not found for model ${model.brandName} ${model.model}`);
        return (
            <tr className="car-list-item error">
                <td colSpan={8} className="error-message">
                    Viga: auto mootori andmed puuduvad
                </td>
            </tr>
        );
    }

    // CLEANED: Create temp car object with new universal tuning system
    const tempCar = {
        id: '',
        ownerId: '',
        carModelId: model.id,
        mileage: 0,
        purchaseDate: new Date(),

        // SIMPLIFIED: Engine without ID or old tuning properties
        engine: {
            code: defaultEngine.code,
            brand: defaultEngine.brandName,
            basePower: defaultEngine.basePower
        },

        // NEW: Universal tuning system (stock level)
        universalTuning: createDefaultUniversalTuning(),
        grip: 1.0,

        isForSale: false
    };

    // Convert VehicleModel to CarModel format for calculateCarStats
    const tempModel = {
        id: model.id,
        brand: model.brandName,
        model: model.model,
        mass: model.mass,
        compatibleEngines: model.compatibleEngineIds,
        defaultEngine: model.defaultEngineId,
        basePrice: model.basePrice,
        basePollidPrice: model.basePollidPrice,
        currency: model.currency
    };

    const stats = calculateCarStats(tempCar, tempModel);
    const carPrice = model.currency === 'pollid'
        ? (model.basePollidPrice || 0)
        : model.basePrice;

    const playerCurrency = model.currency === 'pollid'
        ? playerPollid
        : playerMoney;

    const canAfford = playerCurrency >= carPrice;

    return (
        <tr className="car-list-item">
            <td className="car-brand">{model.brandName}</td>
            <td className="car-model">{model.model}</td>
            <td className="car-engine">{defaultEngine.code}</td>
            <td className="car-power">{stats.power} kW</td>
            <td className="car-mass">{stats.mass} kg</td>
            <td className="car-acceleration">{stats.acceleration}s</td>
            <td className="car-price">
                <span className={!canAfford ? 'price-unaffordable' : ''}>
                    {model.currency === 'pollid' ?
                        `💎${model.basePollidPrice?.toLocaleString() || 0}` :
                        `€${model.basePrice.toLocaleString()}`
                    }
                </span>
            </td>
            <td className="car-action">
                <button
                    className={`purchase-btn-small ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => onPurchase(model)}
                    disabled={!canAfford || isPurchasing}
                >
                    {!canAfford ? (model.currency === 'pollid' ? 'Pole pollideid' : 'Pole raha') :
                        isPurchasing ? '...' : 'Osta'}
                </button>
            </td>
        </tr>
    );
};

export default CarListItem;