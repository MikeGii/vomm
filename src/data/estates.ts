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
        hasWorkshop: false,
        kitchenSpace: 'small'
    },
    {
        id: 'small_apartment_01',
        name: '50-ruutmeetriline korter.',
        description: 'Väike 3-toaline korter suurlinna magalarajoonis, ehitatud 1980 aastal.',
        price: 95000,
        hasGarage: false,
        garageCapacity: 0,
        hasWorkshop: false,
        kitchenSpace: 'medium'
    },
    {
        id: 'medium_apartment_01',
        name: '80-ruutmeetriline korter.',
        description: 'Avar 5-toaline korter suurlinna uusarendus piirkondades',
        price: 165000,
        hasGarage: false,
        garageCapacity: 0,
        hasWorkshop: true,
        kitchenSpace: 'large'
    },
    {
        id: 'small_module_house',
        name: 'Väike moodulmaja',
        description: '90 ruutmeetri pinnaga uus moodulmaja rahulikus linnaservas',
        price: 245000,
        hasGarage: true,
        garageCapacity: 1,
        hasWorkshop: true,
        kitchenSpace: 'medium'
    },
    {
        id: 'medium_module_house',
        name: 'Keskmine moodulmaja',
        description: '120 ruutmeetri pinnaga uus moodulmaja rahulikus linnaservas koos',
        price: 295000,
        hasGarage: true,
        garageCapacity: 1,
        hasWorkshop: true,
        kitchenSpace: 'large'
    },
    {
        id: 'big_module_house',
        name: 'Suur 2-korruseline ridaelamu boks',
        description: '140 ruutmeetri pinnaga 2-korruseline ridaelamu boks uusarendus rajoonis linna servas koos' +
            'laia garaazi ja avara elutoaga.',
        price: 365000,
        hasGarage: true,
        garageCapacity: 2,
        hasWorkshop: true,
        kitchenSpace: 'large'
    },
    {
        id: 'big_house',
        name: '2-korruseline uus eramu koos eraldi garaaži ja saunamajaga',
        description: 'Uus eramu koos 5500 ruutmeetri hoovi pinnaga, eraldi 3 kohalise garaaži ja saunamajaga.',
        price: 525000,
        hasGarage: true,
        garageCapacity: 3,
        hasWorkshop: true,
        kitchenSpace: 'large'
    }
];

export const getEstateById = (id: string): EstateProperty | undefined => {
    return AVAILABLE_ESTATES.find(estate => estate.id === id);
};

export const getAffordableEstates = (playerMoney: number): EstateProperty[] => {
    return AVAILABLE_ESTATES.filter(estate => estate.price <= playerMoney);
};