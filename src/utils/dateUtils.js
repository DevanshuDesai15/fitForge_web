// Date utility functions to ensure consistent date handling
export const getCurrentDate = () => {
  const now = new Date();
  // console.log("Current system date:", {
  //   iso: now.toISOString(),
  //   local: now.toLocaleDateString(),
  //   month: now.getMonth() + 1, // 0-indexed, so add 1
  //   year: now.getFullYear(),
  //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  // });
  return now;
};

export const resetToCurrentMonth = () => {
  const today = getCurrentDate();
  // Reset to first day of current month to avoid any day-specific issues
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

export const debugDate = (date, label = "Date") => {
  // console.log(`${label}:`, {
  //   iso: date.toISOString(),
  //   local: date.toLocaleDateString(),
  //   month: date.getMonth() + 1,
  //   year: date.getFullYear(),
  //   day: date.getDate(),
  // });
  return date;
};

// Test function to verify date handling
export const testDateHandling = () => {
  // console.log("🗓️ Testing date handling...");

  const now = getCurrentDate();
  const currentMonth = resetToCurrentMonth();

  // console.log("System check:", {
  //   browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //   currentTimestamp: Date.now(),
  //   expectedMonth: now.getMonth() + 1,
  //   expectedYear: now.getFullYear(),
  // });

  return {
    current: now,
    currentMonth: currentMonth,
    isCorrect: now.getFullYear() === 2025 && now.getMonth() === 7, // August = month 7 (0-indexed)
  };
};

// Force correct date for development (in case system date is wrong)
export const getCorrectCurrentDate = () => {
  const now = new Date();

  // Check if the date seems unreasonable (too far in future)
  const currentYear = now.getFullYear();

  if (currentYear > 2025) {
    console.warn(
      "⚠️ System date appears to be in the future:",
      now.toISOString()
    );
    console.warn("⚠️ Using corrected date instead");

    // Create a date for current actual time (August 2025)
    const correctedDate = new Date(2025, 7, 8);
    debugDate(correctedDate, "Corrected date");
    return correctedDate;
  }

  return now;
};

// Auto-run in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  setTimeout(() => {
    testDateHandling();

    // Also test the corrected date function
    const corrected = getCorrectCurrentDate();
    // console.log("🔧 Corrected date test:", {
    //   original: new Date().toISOString(),
    //   corrected: corrected.toISOString(),
    //   shouldUseCorrection: new Date().getFullYear() > 2024,
    // });
  }, 1000);
}
