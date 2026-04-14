// Unit conversion utilities for weight and height

/**
 * Convert weight between lbs and kg
 */
export const convertWeight = (value, fromUnit, toUnit) => {
  if (!value || fromUnit === toUnit) return value;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round(numValue / 2.20462);
  } else if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round(numValue * 2.20462);
  }

  return value;
};

/**
 * Convert height between ft/in and cm
 */
export const convertHeight = (value, fromUnit, toUnit) => {
  if (!value || fromUnit === toUnit) return value;

  const numValue = parseHeight(value, fromUnit);
  if (numValue === null) return value;

  if (fromUnit === 'ft' && toUnit === 'cm') {
    // Value in inches, convert to cm
    return Math.round(numValue * 2.54);
  } else if (fromUnit === 'cm' && toUnit === 'ft') {
    // Value in cm, convert to inches
    return Math.round(numValue / 2.54);
  }

  return value;
};

/**
 * Parse height string into a numeric value (inches for ft, cm for cm)
 */
export const parseHeight = (value, unit = 'ft') => {
  if (value === null || value === undefined || value === '') return null;

  if (unit === 'metric' || unit === 'cm') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Handle imperial (ft/in)
  if (typeof value === 'number') return value;

  const strValue = String(value).trim();

  // Handle format like 5'11" or 5'11
  const ftInMatch = strValue.match(/^(\d+)'\s*(\d+)?"?$/) || strValue.match(/^(\d+)\s+(\d+)$/);
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1], 10);
    const inches = parseInt(ftInMatch[2] || '0', 10);
    return (feet * 12) + inches;
  }

  // Handle format like 6'
  const ftMatch = strValue.match(/^(\d+)'$/);
  if (ftMatch) {
    return parseInt(ftMatch[1], 10) * 12;
  }

  // Fallback to simple number (treated as total inches)
  const parsed = parseFloat(strValue);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Format weight for display based on unit preference
 */
export const formatWeight = (weight, unitPreference = 'imperial') => {
  if (!weight) return 'N/A';

  const unit = unitPreference === 'metric' ? 'kg' : 'lbs';
  return `${weight} ${unit}`;
};

/**
 * Format height for display based on unit preference
 */
export const formatHeight = (height, heightUnit, unitPreference = 'imperial') => {
  const numericHeight = parseHeight(height, heightUnit);
  if (numericHeight === null) return 'N/A';

  if (unitPreference === 'metric') {
    // Display in cm
    if (heightUnit === 'cm' || heightUnit === 'metric') {
      return `${Math.round(numericHeight)} cm`;
    } else {
      // Convert from inches to cm
      const cm = Math.round(numericHeight * 2.54);
      return `${cm} cm`;
    }
  } else {
    // Display in ft/in
    let totalInches;
    if (heightUnit === 'ft' || heightUnit === 'imperial') {
      totalInches = numericHeight;
    } else {
      // Convert from cm to ft/in
      totalInches = Math.round(numericHeight / 2.54);
    }

    const roundedInches = Math.round(totalInches);
    const feet = Math.floor(roundedInches / 12);
    const inches = roundedInches % 12;
    return `${feet}'${inches}"`;
  }
};

/**
 * Get weight unit label based on preference
 */
export const getWeightUnit = (unitPreference = 'imperial') => {
  return unitPreference === 'metric' ? 'kg' : 'lbs';
};

/**
 * Get height unit label based on preference
 */
export const getHeightUnit = (unitPreference = 'imperial') => {
  return unitPreference === 'metric' ? 'cm' : 'ft';
};
