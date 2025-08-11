// Wake Lock API utility to keep screen awake during workouts
class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = "wakeLock" in navigator;
  }

  async requestWakeLock() {
    if (!this.isSupported) {
      console.warn("Wake Lock API is not supported in this browser");
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake lock acquired - screen will stay awake");

      // Listen for wake lock release
      this.wakeLock.addEventListener("release", () => {
        console.log("Wake lock released");
      });

      return true;
    } catch (err) {
      console.error("Failed to acquire wake lock:", err);
      return false;
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log("Wake lock manually released");
      } catch (err) {
        console.error("Failed to release wake lock:", err);
      }
    }
  }

  // Handle page visibility changes
  handleVisibilityChange() {
    if (this.wakeLock !== null && document.visibilityState === "visible") {
      // Re-acquire wake lock when page becomes visible again
      this.requestWakeLock();
    }
  }

  isActive() {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
}

export const wakeLockManager = new WakeLockManager();

// Hook for using wake lock in components
export const useWakeLock = () => {
  const requestWakeLock = async () => {
    return await wakeLockManager.requestWakeLock();
  };

  const releaseWakeLock = async () => {
    await wakeLockManager.releaseWakeLock();
  };

  const isSupported = wakeLockManager.isSupported;
  const isActive = () => wakeLockManager.isActive();

  return {
    requestWakeLock,
    releaseWakeLock,
    isSupported,
    isActive,
  };
};
