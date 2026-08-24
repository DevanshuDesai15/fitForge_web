export const TIMER_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
});

const toNonNegativeInteger = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }
  return Math.floor(numericValue);
};

const toTimestamp = (value, fallback) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
};

export function createRunningTimerState(now, elapsedTime = 0) {
  return {
    elapsedTime: toNonNegativeInteger(elapsedTime),
    timerStatus: TIMER_STATUS.RUNNING,
    timerStartedAt: toTimestamp(now, Date.now()),
  };
}

export function getElapsedWorkoutSeconds(timerState, now = Date.now()) {
  const accumulated = toNonNegativeInteger(timerState?.elapsedTime);
  if (timerState?.timerStatus !== TIMER_STATUS.RUNNING) {
    return accumulated;
  }

  const startedAt = toTimestamp(timerState?.timerStartedAt, now);
  const segmentMilliseconds = Math.max(0, now - startedAt);
  return accumulated + Math.floor(segmentMilliseconds / 1000);
}

export function pauseWorkoutTimer(timerState, now = Date.now()) {
  return {
    elapsedTime: getElapsedWorkoutSeconds(timerState, now),
    timerStatus: TIMER_STATUS.PAUSED,
    timerStartedAt: null,
  };
}

export function resumeWorkoutTimer(timerState, now = Date.now()) {
  if (timerState?.timerStatus === TIMER_STATUS.RUNNING) {
    return timerState;
  }

  return createRunningTimerState(now, timerState?.elapsedTime);
}

export function normalizePersistedTimerState(savedState, now = Date.now()) {
  if (!savedState?.workoutStarted) {
    return {
      elapsedTime: 0,
      timerStatus: TIMER_STATUS.IDLE,
      timerStartedAt: null,
    };
  }

  const elapsedTime = toNonNegativeInteger(savedState.elapsedTime);
  if (savedState.timerStatus === TIMER_STATUS.PAUSED) {
    return {
      elapsedTime,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    };
  }

  const timerStartedAt =
    savedState.timerStatus === TIMER_STATUS.RUNNING
      ? toTimestamp(savedState.timerStartedAt, now)
      : toTimestamp(savedState.timestamp, now);

  return {
    elapsedTime,
    timerStatus: TIMER_STATUS.RUNNING,
    timerStartedAt,
  };
}

export function formatWorkoutDuration(seconds) {
  const duration = toNonNegativeInteger(seconds);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const remainingSeconds = duration % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function clearPersistedWorkoutState(storage = localStorage) {
  storage.removeItem("workoutState");
  storage.removeItem("activeWorkout");
}
