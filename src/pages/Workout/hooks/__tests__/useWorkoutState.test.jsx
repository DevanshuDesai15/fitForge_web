import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TIMER_STATUS } from "../../utils/workoutTimerState";
import { useWorkoutState } from "../useWorkoutState";

const authState = vi.hoisted(() => ({
  currentUser: { uid: "user_123" },
}));

vi.mock("../../../../contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

const NOW = new Date("2026-08-01T12:00:00.000Z").getTime();

function savedWorkout(overrides = {}) {
  return {
    userId: "user_123",
    workoutStarted: true,
    exercises: [{ name: "Squat", sets: [] }],
    currentTemplate: null,
    selectedDay: { name: "Leg Day" },
    elapsedTime: 40,
    timerStatus: TIMER_STATUS.RUNNING,
    timerStartedAt: NOW - 5_000,
    workoutStartTime: NOW - 45_000,
    timestamp: NOW - 1_000,
    ...overrides,
  };
}

describe("useWorkoutState timer persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    localStorage.clear();
    authState.currentUser = { uid: "user_123" };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a running timer when a new workout begins", () => {
    const { result } = renderHook(() => useWorkoutState());

    act(() => {
      result.current.setWorkoutStarted(true);
    });

    expect(result.current.timerStatus).toBe(TIMER_STATUS.RUNNING);
    expect(result.current.elapsedTime).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.elapsedTime).toBe(5);
  });

  it("includes background time when a running workout is restored", () => {
    localStorage.setItem("workoutState", JSON.stringify(savedWorkout()));

    const { result } = renderHook(() => useWorkoutState());

    expect(result.current.workoutStarted).toBe(true);
    expect(result.current.timerStatus).toBe(TIMER_STATUS.RUNNING);
    expect(result.current.elapsedTime).toBe(45);
  });

  it("keeps a paused workout frozen after restore", () => {
    localStorage.setItem(
      "workoutState",
      JSON.stringify(
        savedWorkout({
          elapsedTime: 75,
          timerStatus: TIMER_STATUS.PAUSED,
          timerStartedAt: null,
        })
      )
    );

    const { result } = renderHook(() => useWorkoutState());

    expect(result.current.timerStatus).toBe(TIMER_STATUS.PAUSED);
    expect(result.current.elapsedTime).toBe(75);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.elapsedTime).toBe(75);
  });

  it("folds a running segment into elapsed time when paused", () => {
    localStorage.setItem("workoutState", JSON.stringify(savedWorkout()));
    const { result } = renderHook(() => useWorkoutState());

    act(() => {
      vi.advanceTimersByTime(5_000);
      result.current.pauseWorkoutTimer();
    });

    expect(result.current.timerStatus).toBe(TIMER_STATUS.PAUSED);
    expect(result.current.elapsedTime).toBe(50);
    const persisted = JSON.parse(localStorage.getItem("workoutState"));
    expect(persisted).toMatchObject({
      elapsedTime: 50,
      timerStatus: TIMER_STATUS.PAUSED,
      timerStartedAt: null,
    });
  });

  it("resumes without adding the paused interval", () => {
    localStorage.setItem(
      "workoutState",
      JSON.stringify(
        savedWorkout({
          elapsedTime: 75,
          timerStatus: TIMER_STATUS.PAUSED,
          timerStartedAt: null,
        })
      )
    );
    const { result } = renderHook(() => useWorkoutState());

    act(() => {
      vi.advanceTimersByTime(30_000);
      result.current.resumeWorkoutTimer();
    });
    expect(result.current.elapsedTime).toBe(75);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.elapsedTime).toBe(80);
  });

  it("refreshes the persistence timestamp on a one-minute heartbeat", () => {
    localStorage.setItem("workoutState", JSON.stringify(savedWorkout()));
    renderHook(() => useWorkoutState());
    const firstTimestamp = JSON.parse(
      localStorage.getItem("workoutState")
    ).timestamp;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const persisted = JSON.parse(localStorage.getItem("workoutState"));
    expect(persisted.timestamp).toBeGreaterThan(firstTimestamp);
    expect(persisted.elapsedTime).toBe(40);
    expect(persisted.timerStartedAt).toBe(NOW - 5_000);
  });

  it("removes a workout state older than two hours", () => {
    localStorage.setItem(
      "workoutState",
      JSON.stringify(savedWorkout({ timestamp: NOW - 2 * 60 * 60 * 1000 - 1 }))
    );

    const { result } = renderHook(() => useWorkoutState());

    expect(result.current.workoutStarted).toBe(false);
    expect(localStorage.getItem("workoutState")).toBeNull();
  });

  it("removes workout state owned by another user", () => {
    localStorage.setItem(
      "workoutState",
      JSON.stringify(savedWorkout({ userId: "user_other" }))
    );

    const { result } = renderHook(() => useWorkoutState());

    expect(result.current.workoutStarted).toBe(false);
    expect(localStorage.getItem("workoutState")).toBeNull();
  });

  it("removes malformed persisted state", () => {
    localStorage.setItem("workoutState", "{not-json");

    const { result } = renderHook(() => useWorkoutState());

    expect(result.current.workoutStarted).toBe(false);
    expect(localStorage.getItem("workoutState")).toBeNull();
  });

  it("clears current and legacy timer state", () => {
    localStorage.setItem("workoutState", JSON.stringify(savedWorkout()));
    localStorage.setItem("activeWorkout", "legacy");
    const { result } = renderHook(() => useWorkoutState());

    act(() => {
      result.current.clearWorkoutState();
    });

    expect(localStorage.getItem("workoutState")).toBeNull();
    expect(localStorage.getItem("activeWorkout")).toBeNull();
    expect(result.current.workoutStarted).toBe(false);
    expect(result.current.elapsedTime).toBe(0);
    expect(result.current.timerStatus).toBe(TIMER_STATUS.IDLE);
  });
});
