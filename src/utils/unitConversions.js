/**
 * Pure unit conversion utilities.
 * Extracted from UnitsContext for testability without React context providers.
 */

/**
 * Convert weight between kg and lbs.
 * @param {number|string} weight - The weight value
 * @param {string} fromUnit - 'kg' or 'lbs'
 * @param {string} toUnit - 'kg' or 'lbs'
 * @returns {string|number|*} Converted weight as a string with 1 decimal, or original value if invalid
 */
export const convertWeight = (weight, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return weight;

    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return weight;

    if (fromUnit === 'kg' && toUnit === 'lbs') {
        return (numWeight * 2.20462).toFixed(1);
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
        return (numWeight / 2.20462).toFixed(1);
    }
    return weight;
};

/**
 * Format a weight value with its unit.
 * @param {number|string} weight - The weight value
 * @param {string} unit - The display unit ('kg' or 'lbs')
 * @returns {string} Formatted string like "70.0 kg"
 */
export const formatWeight = (weight, unit) => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return `${weight} ${unit}`;
    return `${numWeight.toFixed(1)} ${unit}`;
};

/**
 * Build a weight label string.
 * @param {string} weightUnit - 'kg' or 'lbs'
 * @param {string} label - Base label, defaults to 'Weight'
 * @returns {string} Label with unit, e.g. "Weight (kg)"
 */
export const getWeightLabel = (weightUnit, label = 'Weight') => {
    return `${label} (${weightUnit})`;
};
