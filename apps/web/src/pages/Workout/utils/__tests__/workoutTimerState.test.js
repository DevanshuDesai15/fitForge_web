import { beforeEach, describe, expect, it } from "vitest";

import {
  TIMER_STATUS,
  clearPersistedWorkoutState,
  createRunningTimerState,
  formatWorkoutDuration,
  getElapsedWorkoutSeconds,
  normalizePersistedTimerState,
  pauseWorkoutTimer,
  resumeWorkoutTimer,
} from "../workoutTimerState";

describe("workoutTimerState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a running timer with sanitized accumulated time", () => {
    expect(createRunningTimerState(10_000, 30.9)).toEqual({
      elapsedTime: 30,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 10_000,
    });
    expect(createRunningTimerState(10_000, -4)).toEqual({
      elapsedTime: 0,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 10_000,
    });
  });

  it("calculates a running duration from accumulated and wall-clock time", () => {
    const timer = createRunningTimerState(10_000, 30);

    expect(getElapsedWorkoutSeconds(timer, 15_900)).toBe(35);
  });

  it("does not add time to a paused timer", () => {
    const timer = {
      elapsedTime: 35,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    };

    expect(getElapsedWorkoutSeconds(timer, 999_000)).toBe(35);
  });

  it("does not produce negative time when the start timestamp is in the future", () => {
    const timer = createRunningTimerState(20_000, 12);

    expect(getElapsedWorkoutSeconds(timer, 15_000)).toBe(12);
  });

  it("folds the current running segment into elapsed time when paused", () => {
    const timer = createRunningTimerState(10_000, 30);

    expect(pauseWorkoutTimer(timer, 15_900)).toEqual({
      elapsedTime: 35,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    });
  });

  it("resumes without adding time spent paused", () => {
    const paused = {
      elapsedTime: 35,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    };

    const resumed = resumeWorkoutTimer(paused, 20_000);

    expect(resumed).toEqual({
      elapsedTime: 35,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 20_000,
    });
    expect(getElapsedWorkoutSeconds(resumed, 25_000)).toBe(40);
  });

  it("normalizes a modern running timer without resetting its segment", () => {
    expect(
      normalizePersistedTimerState(
        {
          workoutStarted: true,
          elapsedTime: 40,
          timerStatus: "running",
          timerStartedAt: 50_000,
          timestamp: 55_000,
        },
        60_000
      )
    ).toEqual({
      elapsedTime: 40,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 50_000,
    });
  });

  it("normalizes a modern paused timer as frozen", () => {
    expect(
      normalizePersistedTimerState(
        {
          workoutStarted: true,
          elapsedTime: 40,
          timerStatus: "paused",
          timerStartedAt: 50_000,
        },
        60_000
      )
    ).toEqual({
      elapsedTime: 40,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    });
  });

  it("normalizes a legacy workout as running from its saved timestamp", () => {
    expect(
      normalizePersistedTimerState(
        {
          workoutStarted: true,
          elapsedTime: 40,
          timestamp: 55_000,
        },
        60_000
      )
    ).toEqual({
      elapsedTime: 40,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 55_000,
    });
  });

  it("uses restore time for a legacy workout with an invalid timestamp", () => {
    expect(
      normalizePersistedTimerState(
        {
          workoutStarted: true,
          elapsedTime: "invalid",
          timestamp: null,
        },
        60_000
      )
    ).toEqual({
      elapsedTime: 0,
      timerStatus: TIMER_STATUS.RUNNING,
      timerStartedAt: 60_000,
    });
  });

  it("returns an idle timer for a state without an active workout", () => {
    expect(
      normalizePersistedTimerState(
        { workoutStarted: false, elapsedTime: 90 },
        60_000
      )
    ).toEqual({
      elapsedTime: 0,
      timerStatus: TIMER_STATUS.IDLE,
      timerStartedAt: null,
    });
  });

  it("formats durations for workout display", () => {
    expect(formatWorkoutDuration(65)).toBe("1:05");
    expect(formatWorkoutDuration(3_661)).toBe("1:01:01");
    expect(formatWorkoutDuration(-10)).toBe("0:00");
  });

  it("clears current and legacy persisted workout keys idempotently", () => {
    localStorage.setItem("workoutState", "saved");
    localStorage.setItem("activeWorkout", "legacy");

    clearPersistedWorkoutState();
    clearPersistedWorkoutState();

    expect(localStorage.getItem("workoutState")).toBeNull();
    expect(localStorage.getItem("activeWorkout")).toBeNull();
  });
});
