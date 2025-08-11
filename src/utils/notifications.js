// Notification utility for workout alerts
class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = "Notification" in window;
  }

  async requestPermission() {
    if (!this.isSupported) {
      console.warn("Notifications are not supported in this browser");
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return false;
    }
  }

  showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== "granted") {
      return null;
    }

    const defaultOptions = {
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: "fitforge-workout",
      requireInteraction: true,
      ...options,
    };

    try {
      return new Notification(title, defaultOptions);
    } catch (err) {
      console.error("Failed to show notification:", err);
      return null;
    }
  }

  showWorkoutReminder(workoutTime) {
    const minutes = Math.floor(workoutTime / 60);
    return this.showNotification(`Workout in Progress - ${minutes} minutes`, {
      body: "Your FitForge workout is still running. Tap to return to the app.",
      data: { type: "workout-reminder", workoutTime },
    });
  }

  showWorkoutComplete(workoutTime, exerciseCount) {
    const minutes = Math.floor(workoutTime / 60);
    return this.showNotification("Workout Complete! 🎉", {
      body: `Great job! You completed ${exerciseCount} exercises in ${minutes} minutes.`,
      data: { type: "workout-complete", workoutTime, exerciseCount },
    });
  }

  showRestTimer(seconds) {
    return this.showNotification(`Rest Timer: ${seconds}s`, {
      body: "Time to get back to your workout!",
      data: { type: "rest-complete" },
    });
  }
}

export const notificationManager = new NotificationManager();

// Hook for using notifications in components
export const useNotifications = () => {
  const requestPermission = async () => {
    return await notificationManager.requestPermission();
  };

  const showNotification = (title, options) => {
    return notificationManager.showNotification(title, options);
  };

  const showWorkoutReminder = (workoutTime) => {
    return notificationManager.showWorkoutReminder(workoutTime);
  };

  const showWorkoutComplete = (workoutTime, exerciseCount) => {
    return notificationManager.showWorkoutComplete(workoutTime, exerciseCount);
  };

  const isSupported = notificationManager.isSupported;
  const hasPermission = () => notificationManager.permission === "granted";

  return {
    requestPermission,
    showNotification,
    showWorkoutReminder,
    showWorkoutComplete,
    isSupported,
    hasPermission,
  };
};
