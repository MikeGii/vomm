// src/components/carMarketplace/CarListItem.tsx
import React from 'react';
import { VehicleModel, VehicleEngine } from '../../types/vehicleDatabase';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import '../../styles/components/carMarketplace/CarListItem.css';

interface CarListItemProps {
    model: VehicleModel;
    engines: VehicleEngine[];
    onPurchase: (model: VehicleModel) => void;
    playerMoney: number;
    isPurchasing?: boolean;
}

const CarListItem: React.FC<CarListItemProps> = ({
                                                     model,
                                                     engines,
                                                     onPurchase,
                                                     playerMoney,
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

    // Loo ajutine auto objekt statistika arvutamiseks
    const tempCar = {
        id: '',
        ownerId: '',
        carModelId: model.id,
        mileage: 0,
        purchaseDate: new Date(),
        engine: {
            id: defaultEngine.id,
            code: defaultEngine.code,
            brand: defaultEngine.brandName,
            basePower: defaultEngine.basePower,
            turbo: 'stock' as const,
            ecu: 'stock' as const,
            intake: 'stock' as const,
            exhaust: 'stock' as const
        },
        isForSale: false
    };

    // Loo ajutine mudel objekt
    const tempModel = {
        id: model.id,
        brand: model.brandName,
        model: model.model,
        mass: model.mass,
        compatibleEngines: model.compatibleEngineIds,
        defaultEngine: model.defaultEngineId,
        basePrice: model.basePrice,
        imageUrl: model.imageUrl
    };

    // Arvuta statistika
    const stats = calculateCarStats(tempCar, tempModel);
    const canAfford = playerMoney >= model.basePrice;

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
                    €{model.basePrice.toLocaleString()}
                </span>
            </td>
            <td className="car-action">
                <button
                    className={`purchase-btn-small ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => onPurchase(model)}
                    disabled={!canAfford || isPurchasing}
                >
                    {!canAfford ? 'Pole raha' :
                        isPurchasing ? '...' : 'Osta'}
                </button>
            </td>
        </tr>
    );
};

export default CarListItem;