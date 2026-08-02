// Weight unit utility functions

export const getWeightUnit = () => {
  return localStorage.getItem("weightUnit") || "kg";
};

export const setWeightUnit = (unit) => {
  localStorage.setItem("weightUnit", unit);
};

export const getWeightLabel = (unit = null) => {
  const currentUnit = unit || getWeightUnit();
  // Normalize unit display
  const displayUnit = currentUnit === 'lbs' || currentUnit === 'lb' ? 'lbs' : 'kg';
  return `Weight (${displayUnit})`;
};
