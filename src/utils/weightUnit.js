// Weight unit utility functions

export const getWeightUnit = () => {
  return localStorage.getItem("weightUnit") || "kg";
};

export const setWeightUnit = (unit) => {
  localStorage.setItem("weightUnit", unit);
};

export const convertWeight = (weight, fromUnit, toUnit) => {
  if (!weight || fromUnit === toUnit) return weight;

  const numWeight = parseFloat(weight);
  if (isNaN(numWeight)) return weight;

  if (fromUnit === "kg" && toUnit === "lb") {
    return (numWeight * 2.20462).toFixed(1);
  } else if (fromUnit === "lb" && toUnit === "kg") {
    return (numWeight / 2.20462).toFixed(1);
  }
  return weight;
};

export const formatWeight = (weight, unit = null) => {
  const currentUnit = unit || getWeightUnit();
  const numWeight = parseFloat(weight);

  if (isNaN(numWeight)) return `${weight}${currentUnit}`;

  return `${numWeight}${currentUnit}`;
};

export const getWeightLabel = (unit = null) => {
  const currentUnit = unit || getWeightUnit();
  // Normalize unit display
  const displayUnit = currentUnit === 'lbs' || currentUnit === 'lb' ? 'lbs' : 'kg';
  return `Weight (${displayUnit})`;
};
