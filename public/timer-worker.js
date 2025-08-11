// Timer Web Worker - runs independently of main thread
let startTime = null;
let isRunning = false;
let intervalId = null;
let pausedTime = 0; // Track total paused time
let pauseStartTime = null; // When the current pause started

self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {
    case "START":
      if (!isRunning) {
        startTime = data.startTime || Date.now();
        isRunning = true;
        pausedTime = 0; // Reset paused time for new workout
        pauseStartTime = null;

        // Send updates every second
        intervalId = setInterval(() => {
          if (isRunning) {
            const elapsed = Math.floor(
              (Date.now() - startTime - pausedTime) / 1000
            );
            self.postMessage({
              type: "TICK",
              elapsed: elapsed,
            });
          }
        }, 1000);

        self.postMessage({ type: "STARTED", startTime });
      }
      break;

    case "STOP":
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Reset all timing variables
      startTime = null;
      pausedTime = 0;
      pauseStartTime = null;
      self.postMessage({ type: "STOPPED" });
      break;

    case "PAUSE":
      if (isRunning) {
        isRunning = false;
        pauseStartTime = Date.now(); // Record when pause started
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        self.postMessage({ type: "PAUSED" });
      }
      break;

    case "RESUME":
      if (!isRunning && startTime && pauseStartTime) {
        // Add the time we were paused to total paused time
        pausedTime += Date.now() - pauseStartTime;
        pauseStartTime = null;
        isRunning = true;

        intervalId = setInterval(() => {
          if (isRunning) {
            const elapsed = Math.floor(
              (Date.now() - startTime - pausedTime) / 1000
            );
            self.postMessage({
              type: "TICK",
              elapsed: elapsed,
            });
          }
        }, 1000);

        self.postMessage({ type: "RESUMED" });

        // Send immediate time update
        const elapsed = Math.floor(
          (Date.now() - startTime - pausedTime) / 1000
        );
        self.postMessage({
          type: "TICK",
          elapsed: elapsed,
        });
      }
      break;

    case "GET_TIME":
      if (startTime) {
        let elapsed;
        if (isRunning) {
          elapsed = Math.floor((Date.now() - startTime - pausedTime) / 1000);
        } else if (pauseStartTime) {
          // Currently paused - don't include current pause time
          elapsed = Math.floor(
            (pauseStartTime - startTime - pausedTime) / 1000
          );
        } else {
          elapsed = Math.floor((Date.now() - startTime - pausedTime) / 1000);
        }

        self.postMessage({
          type: "TIME_UPDATE",
          elapsed: elapsed,
          isRunning: isRunning,
        });
      }
      break;
  }
};
