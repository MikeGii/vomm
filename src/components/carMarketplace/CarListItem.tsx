import React from 'react';
import { CarModel } from '../../types/vehicles';
import { calculateCarStats } from '../../utils/vehicleCalculations';
import { createStockEngine } from '../../data/vehicles';
import '../../styles/components/carMarketplace/CarListItem.css';

interface CarListItemProps {
    carModel: CarModel;
    onPurchase: (carModel: CarModel) => void;
    playerMoney: number;
    isPurchasing?: boolean;
}

const CarListItem: React.FC<CarListItemProps> = ({
                                                     carModel,
                                                     onPurchase,
                                                     playerMoney,
                                                     isPurchasing = false
                                                 }) => {
    // Arvuta auto statistika stock mootoriga
    const stockEngine = createStockEngine(carModel.defaultEngine);
    const stats = calculateCarStats(
        {
            id: '',
            ownerId: '',
            carModelId: carModel.id,
            mileage: 0,
            purchaseDate: new Date(),
            engine: stockEngine,
            isForSale: false
        },
        carModel
    );

    const canAfford = playerMoney >= carModel.basePrice;

    return (
        <tr className="car-list-item">
            <td className="car-brand">{carModel.brand}</td>
            <td className="car-model">{carModel.model}</td>
            <td className="car-engine">{stockEngine.code}</td>
            <td className="car-power">{stats.power} kW</td>
            <td className="car-mass">{stats.mass} kg</td>
            <td className="car-acceleration">{stats.acceleration}s</td>
            <td className="car-price">
                <span className={!canAfford ? 'price-unaffordable' : ''}>
                    ${carModel.basePrice.toLocaleString()}
                </span>
            </td>
            <td className="car-action">
                <button
                    className={`purchase-btn-small ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => onPurchase(carModel)}
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