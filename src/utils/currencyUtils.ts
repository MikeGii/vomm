// src/utils/currencyUtils.ts
/**
 * Format money to always show exactly 2 decimal places
 * @param amount - The money amount to format
 * @param includeSymbol - Whether to include the € symbol (default: true)
 * @returns Formatted money string
 */
export const formatMoney = (amount: number, includeSymbol: boolean = true): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return includeSymbol ? '€0.00' : '0.00';
    }

    const formatted = amount.toFixed(2);
    return includeSymbol ? `€${formatted}` : formatted;
};

/**
 * Format pollid (always whole numbers)
 * @param amount - The pollid amount to format
 * @param includeSymbol - Whether to include the 💎 symbol (default: true)
 * @returns Formatted pollid string
 */
export const formatPollid = (amount: number, includeSymbol: boolean = true): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return includeSymbol ? '💎0' : '0';
    }

    const formatted = Math.floor(amount).toString();
    return includeSymbol ? `💎${formatted}` : formatted;
};