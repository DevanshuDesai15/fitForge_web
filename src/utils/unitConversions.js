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

export const parseHeight = (value, unit = 'ft') => {
    if (value === null || value === undefined || value === '') return null;

    if (unit === 'metric' || unit === 'cm') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    if (typeof value === 'number') return value;

    const normalized = String(value).trim();
    const feetAndInches = normalized.match(/^(\d+)'\s*(\d+)?"?$/)
        || normalized.match(/^(\d+)\s+(\d+)$/);
    if (feetAndInches) {
        return (parseInt(feetAndInches[1], 10) * 12)
            + parseInt(feetAndInches[2] || '0', 10);
    }

    const feetOnly = normalized.match(/^(\d+)'$/);
    if (feetOnly) return parseInt(feetOnly[1], 10) * 12;

    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
};

export const convertHeight = (value, fromUnit, toUnit) => {
    if (!value || fromUnit === toUnit) return value;

    const numericHeight = parseHeight(value, fromUnit);
    if (numericHeight === null) return value;

    if ((fromUnit === 'ft' || fromUnit === 'imperial') && (toUnit === 'cm' || toUnit === 'metric')) {
        return Math.round(numericHeight * 2.54);
    }
    if ((fromUnit === 'cm' || fromUnit === 'metric') && (toUnit === 'ft' || toUnit === 'imperial')) {
        return Math.round(numericHeight / 2.54);
    }
    return value;
};

export const formatHeight = (height, heightUnit, unitPreference = 'imperial') => {
    const numericHeight = parseHeight(height, heightUnit);
    if (numericHeight === null) return 'N/A';

    if (unitPreference === 'metric') {
        const centimeters = heightUnit === 'cm' || heightUnit === 'metric'
            ? numericHeight
            : numericHeight * 2.54;
        return `${Math.round(centimeters)} cm`;
    }

    const totalInches = heightUnit === 'ft' || heightUnit === 'imperial'
        ? numericHeight
        : numericHeight / 2.54;
    const roundedInches = Math.round(totalInches);
    return `${Math.floor(roundedInches / 12)}'${roundedInches % 12}"`;
};

export const getWeightUnit = (unitPreference = 'imperial') => (
    unitPreference === 'metric' ? 'kg' : 'lbs'
);

export const getHeightUnit = (unitPreference = 'imperial') => (
    unitPreference === 'metric' ? 'cm' : 'ft'
);
