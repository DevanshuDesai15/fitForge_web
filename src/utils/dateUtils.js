// Date utility functions to ensure consistent date handling
export const getCurrentDate = () => {
  return new Date();
};

export const resetToCurrentMonth = () => {
  const today = getCurrentDate();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

export const debugDate = (date, label = "Date") => {
  if (import.meta.env.DEV) {
    console.log(`${label}:`, {
      iso: date.toISOString(),
      local: date.toLocaleDateString(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      day: date.getDate(),
    });
  }
  return date;
};
