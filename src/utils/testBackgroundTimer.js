// Test utility to verify background timer functionality
export const testBackgroundTimer = () => {
  console.log("🧪 Testing Background Timer Implementation...");

  // Test 1: Web Worker availability
  const webWorkerSupported = typeof Worker !== "undefined";
  console.log(`✅ Web Workers supported: ${webWorkerSupported}`);

  // Test 2: Wake Lock API availability
  const wakeLockSupported = "wakeLock" in navigator;
  console.log(`✅ Wake Lock API supported: ${wakeLockSupported}`);

  // Test 3: Notifications API availability
  const notificationsSupported = "Notification" in window;
  console.log(`✅ Notifications API supported: ${notificationsSupported}`);

  // Test 4: localStorage availability
  const localStorageSupported = typeof Storage !== "undefined";
  console.log(`✅ localStorage supported: ${localStorageSupported}`);

  // Test 5: Page Visibility API availability
  const visibilityAPISupported = typeof document.hidden !== "undefined";
  console.log(`✅ Page Visibility API supported: ${visibilityAPISupported}`);

  // Test 6: Try to create a Web Worker
  if (webWorkerSupported) {
    try {
      const testWorker = new Worker("/timer-worker.js");
      console.log("✅ Web Worker created successfully");

      // Test worker communication
      testWorker.postMessage({
        type: "START",
        data: { startTime: Date.now() },
      });

      testWorker.onmessage = (e) => {
        if (e.data.type === "STARTED") {
          console.log("✅ Web Worker communication working");
          testWorker.postMessage({ type: "STOP" });
          testWorker.terminate();
        }
      };

      // Cleanup after 2 seconds if no response
      setTimeout(() => {
        testWorker.terminate();
      }, 2000);
    } catch (error) {
      console.error("❌ Web Worker creation failed:", error);
    }
  }

  // Summary
  const allSupported =
    webWorkerSupported && localStorageSupported && visibilityAPISupported;
  console.log(
    `\n📊 Background Timer Compatibility: ${
      allSupported ? "✅ FULLY SUPPORTED" : "⚠️ PARTIALLY SUPPORTED"
    }`
  );

  if (wakeLockSupported) {
    console.log("🔋 Wake Lock: Available (screen will stay awake)");
  } else {
    console.log("🔋 Wake Lock: Not available (screen may turn off)");
  }

  if (notificationsSupported) {
    console.log("🔔 Notifications: Available (background alerts possible)");
  } else {
    console.log("🔔 Notifications: Not available (no background alerts)");
  }

  return {
    webWorkerSupported,
    wakeLockSupported,
    notificationsSupported,
    localStorageSupported,
    visibilityAPISupported,
    fullySupported: allSupported,
  };
};

// Auto-run test in development
if (process.env.NODE_ENV === "development") {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(testBackgroundTimer, 1000);
}

// Export for manual testing
window.testBackgroundTimer = testBackgroundTimer;
