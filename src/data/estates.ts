// src/data/estates.ts (NEW FILE)
import { EstateProperty } from '../types/estate';

export const AVAILABLE_ESTATES: EstateProperty[] = [
    {
        id: 'small_garage_box',
        name: 'Väike 3x5m garaažiboks',
        description: 'Kompaktne garaažiboks sinu esimese auto jaoks. Lihtne ja praktiline lahendus.',
        price: 35000,
        hasGarage: true,
        garageCapacity: 1,
        hasWorkshop: false,
        kitchenSpace: 'small',
    },
    {
        id: 'double_garage_box',
        name: 'Kahekorruseline garaažiboks',
        description: 'Suurem garaažiboks, millel on lisaks autokohale ka väike töökoda käsitöö jaoks.',
        price: 55000,
        hasGarage: true,
        garageCapacity: 1,
        hasWorkshop: true,
        kitchenSpace: 'small'
    }
];

export const getEstateById = (id: string): EstateProperty | undefined => {
    return AVAILABLE_ESTATES.find(estate => estate.id === id);
};

export const getAffordableEstates = (playerMoney: number): EstateProperty[] => {
    return AVAILABLE_ESTATES.filter(estate => estate.price <= playerMoney);
};