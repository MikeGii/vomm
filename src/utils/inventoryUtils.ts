/**
 * Extracts the base ID from a timestamped inventory item ID
 * Handles both formats: "item_timestamp" and "item_timestamp_random"
 */
export const getBaseIdFromInventoryId = (inventoryId: string): string => {
    const parts = inventoryId.split('_');

    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        // Check if looks like timestamp_random (decimal in last part, numbers in second-to-last)
        if (lastPart.includes('.') && !isNaN(Number(secondLastPart))) {
            return parts.slice(0, -2).join('_');
        }
    }

    if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];

        // Check if last part is a number (timestamp)
        if (!isNaN(Number(lastPart)) && !lastPart.includes('.')) {
            return parts.slice(0, -1).join('_');
        }
    }

    return inventoryId;
};

/**
 * Creates a consistent timestamped inventory ID
 */
export const createTimestampedId = (baseId: string): string => {
    return `${baseId}_${Date.now()}_${Math.random()}`;
};