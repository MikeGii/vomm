// src/utils/purchaseValidation.ts
export const validatePurchaseQuantity = (quantity: number): { isValid: boolean; error?: string } => {
    // Validate quantity is a positive integer
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return { isValid: false, error: 'Kogus peab olema positiivne täisarv' };
    }

    // Prevent extremely large quantities that could cause issues
    if (quantity > 9999) {
        return { isValid: false, error: 'Maksimaalne kogus on 9999 tükki' };
    }

    // Validate against potential overflow issues
    if (quantity > Number.MAX_SAFE_INTEGER / 10000) { // Conservative check
        return { isValid: false, error: 'Kogus on liiga suur' };
    }

    return { isValid: true };
};

export const validateTotalCost = (price: number, quantity: number): { isValid: boolean; error?: string } => {
    if (!Number.isFinite(price) || price <= 0) {
        return { isValid: false, error: 'Vigane hind' };
    }

    const totalCost = price * quantity;

    // Check for overflow/precision issues
    if (!Number.isFinite(totalCost) || totalCost <= 0) {
        return { isValid: false, error: 'Kogumaksumus on liiga suur' };
    }

    // Reasonable maximum (100 million euros) - should handle 9999 * expensive items
    if (totalCost > 100000000) {
        return { isValid: false, error: 'Kogumaksumus ületab maksimumi' };
    }

    return { isValid: true };
};