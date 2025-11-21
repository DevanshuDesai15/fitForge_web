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

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

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
  if (!height) return 'N/A';

  if (unitPreference === 'metric') {
    // Display in cm
    if (heightUnit === 'cm') {
      return `${height} cm`;
    } else {
      // Convert from inches to cm
      const cm = Math.round(height * 2.54);
      return `${cm} cm`;
    }
  } else {
    // Display in ft/in
    if (heightUnit === 'ft') {
      const feet = Math.floor(height / 12);
      const inches = height % 12;
      return `${feet}'${inches}"`;
    } else {
      // Convert from cm to ft/in
      const totalInches = Math.round(height / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet}'${inches}"`;
    }
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
