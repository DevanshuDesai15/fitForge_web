import { useState, useEffect, useRef, useCallback } from "react";

export const useWorkoutTimer = () => {
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const workerRef = useRef(null);
  const lastActiveTime = useRef(Date.now());

  // Initialize Web Worker
  useEffect(() => {
    // Check if we have a saved workout in progress
    const savedWorkout = localStorage.getItem("activeWorkout");
    if (savedWorkout) {
      const { startTime: savedStartTime, isRunning: savedIsRunning } =
        JSON.parse(savedWorkout);
      if (savedIsRunning && savedStartTime) {
        const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
        setWorkoutTime(elapsed);
        setStartTime(savedStartTime);
        setIsRunning(true);
      }
    }

    // Initialize Web Worker
    workerRef.current = new Worker("/timer-worker.js");

    workerRef.current.onmessage = (e) => {
      const { type, elapsed, startTime: workerStartTime } = e.data;

      switch (type) {
        case "TICK":
          setWorkoutTime(elapsed);
          // Update localStorage periodically
          if (elapsed % 10 === 0) {
            // Every 10 seconds
            localStorage.setItem(
              "activeWorkout",
              JSON.stringify({
                startTime: startTime,
                isRunning: true,
                lastUpdate: Date.now(),
              })
            );
          }
          break;
        case "STARTED":
          setIsRunning(true);
          setStartTime(workerStartTime);
          localStorage.setItem(
            "activeWorkout",
            JSON.stringify({
              startTime: workerStartTime,
              isRunning: true,
              lastUpdate: Date.now(),
            })
          );
          break;
        case "STOPPED":
          setIsRunning(false);
          localStorage.removeItem("activeWorkout");
          break;
        case "PAUSED":
          setIsRunning(false);
          localStorage.setItem(
            "activeWorkout",
            JSON.stringify({
              startTime: startTime,
              isRunning: false,
              lastUpdate: Date.now(),
            })
          );
          break;
        case "RESUMED":
          setIsRunning(true);
          localStorage.setItem(
            "activeWorkout",
            JSON.stringify({
              startTime: startTime,
              isRunning: true,
              lastUpdate: Date.now(),
            })
          );
          break;
        case "TIME_UPDATE":
          setWorkoutTime(elapsed);
          setIsRunning(e.data.isRunning);
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastActiveTime.current = Date.now();
      } else {
        // Page became visible again - sync with worker
        if (workerRef.current && isRunning) {
          workerRef.current.postMessage({ type: "GET_TIME" });
        }
      }
    };

    const handleBeforeUnload = () => {
      // Save state before page unload
      if (isRunning && startTime) {
        localStorage.setItem(
          "activeWorkout",
          JSON.stringify({
            startTime: startTime,
            isRunning: true,
            lastUpdate: Date.now(),
          })
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRunning, startTime]);

  const startTimer = useCallback(() => {
    if (workerRef.current && !isRunning) {
      const now = Date.now();
      workerRef.current.postMessage({
        type: "START",
        data: { startTime: now },
      });
    }
  }, [isRunning]);

  const stopTimer = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "STOP" });
      setWorkoutTime(0);
      setStartTime(null);
    }
  }, []);

  const pauseTimer = useCallback(() => {
    if (workerRef.current && isRunning) {
      console.log("⏸️ Pausing timer...", { isRunning });
      workerRef.current.postMessage({ type: "PAUSE" });
    } else {
      console.log("⚠️ Cannot pause timer:", {
        hasWorker: !!workerRef.current,
        isRunning,
      });
    }
  }, [isRunning]);

  const resumeTimer = useCallback(() => {
    if (workerRef.current && !isRunning && startTime) {
      console.log("🔄 Resuming timer...", { isRunning, startTime });
      workerRef.current.postMessage({ type: "RESUME" });
    } else {
      console.log("⚠️ Cannot resume timer:", {
        hasWorker: !!workerRef.current,
        isRunning,
        startTime,
      });
    }
  }, [isRunning, startTime]);

  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    workoutTime,
    isRunning,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    formatTime: (time) => formatTime(time || workoutTime),
  };
};
