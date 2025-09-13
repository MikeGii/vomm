// src/services/KitchenBonusService.ts (UUENDATUD VERSIOON)

export interface KitchenBonus {
    hasKitchen: boolean;
    kitchenSize: string;
    bonusChance: number; // Tõenäosus saada 2x tootmist
    tripleChance: number; // Tõenäosus saada 3x tootmist (ainult suure köögiga)
    multiplier: number; // Tegelik korrutaja (1, 2 või 3)
}

export interface KitchenBonusResult {
    originalAmount: number;
    finalAmount: number;
    bonusApplied: boolean;
    multiplier: number;
    kitchenSize: string;
}

/**
 * Arvutab köögiboonuse mängija kinnisvara põhjal
 */
export const calculateKitchenBonus = (playerStats: any): KitchenBonus => {
    // Vaikimisi pole köökboonust
    const defaultBonus: KitchenBonus = {
        hasKitchen: false,
        kitchenSize: 'puudub',
        bonusChance: 0,
        tripleChance: 0,
        multiplier: 1
    };

    // Kontrolli kas mängijal on kinnisvaraobjekt
    if (!playerStats?.estate?.currentEstate) {
        return defaultBonus;
    }

    const estate = playerStats.estate.currentEstate;
    const kitchenSpace = estate.kitchenSpace; // Kasutame kitchenSpace, mitte kitchenSize

    // Määra boonused köögisuuruse järgi
    switch (kitchenSpace) {
        case 'small':
            return {
                hasKitchen: true,
                kitchenSize: 'väike',
                bonusChance: 20,
                tripleChance: 0,
                multiplier: 1
            };

        case 'medium':
            return {
                hasKitchen: true,
                kitchenSize: 'keskmine',
                bonusChance: 40,
                tripleChance: 0,
                multiplier: 1
            };

        case 'large':
            return {
                hasKitchen: true,
                kitchenSize: 'suur',
                bonusChance: 60,
                tripleChance: 30,
                multiplier: 1
            };

        default:
            return defaultBonus;
    }
};

/**
 * Rakenda köögiboonust tootmise kogusele
 */
export const applyKitchenBonus = (
    playerStats: any,
    baseAmount: number = 1
): KitchenBonusResult => {
    const kitchenBonus = calculateKitchenBonus(playerStats);

    if (!kitchenBonus.hasKitchen) {
        return {
            originalAmount: baseAmount,
            finalAmount: baseAmount,
            bonusApplied: false,
            multiplier: 1,
            kitchenSize: kitchenBonus.kitchenSize
        };
    }

    // Suure köögi korral kontrolli esmalt 3x võimalust
    if (kitchenBonus.tripleChance > 0) {
        const tripleRoll = Math.random() * 100;
        if (tripleRoll < kitchenBonus.tripleChance) {
            return {
                originalAmount: baseAmount,
                finalAmount: baseAmount * 3,
                bonusApplied: true,
                multiplier: 3,
                kitchenSize: kitchenBonus.kitchenSize
            };
        }
    }

    // Kontrolli 2x võimalust
    const doubleRoll = Math.random() * 100;
    if (doubleRoll < kitchenBonus.bonusChance) {
        return {
            originalAmount: baseAmount,
            finalAmount: baseAmount * 2,
            bonusApplied: true,
            multiplier: 2,
            kitchenSize: kitchenBonus.kitchenSize
        };
    }

    // Boonust ei rakendatud
    return {
        originalAmount: baseAmount,
        finalAmount: baseAmount,
        bonusApplied: false,
        multiplier: 1,
        kitchenSize: kitchenBonus.kitchenSize
    };
};

/**
 * Saab köögiboonuse sõnalise kirjelduse kasutajaliides jaoks
 */
export const getKitchenBonusDescription = (kitchenBonus: KitchenBonus): string => {
    if (!kitchenBonus.hasKitchen) {
        return "Köök puudub - boonus 0%";
    }

    const { kitchenSize, bonusChance, tripleChance } = kitchenBonus;

    if (tripleChance > 0) {
        return `${kitchenSize} köök: ${bonusChance}% võimalus 2x tootmiseks, ${tripleChance}% võimalus 3x tootmiseks`;
    } else {
        return `${kitchenSize} köök: ${bonusChance}% võimalus 2x tootmiseks`;
    }
};