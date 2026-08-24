import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  TIMER_STATUS,
  clearPersistedWorkoutState,
  createRunningTimerState,
  getElapsedWorkoutSeconds,
  normalizePersistedTimerState,
  pauseWorkoutTimer as pauseTimerState,
  resumeWorkoutTimer as resumeTimerState,
} from "../utils/workoutTimerState";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TIMER_HEARTBEAT_MS = 60 * 1000;

const idleTimerState = () => ({
  elapsedTime: 0,
  timerStatus: TIMER_STATUS.IDLE,
  timerStartedAt: null,
});

export const useWorkoutState = () => {
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [timerState, setTimerState] = useState(idleTimerState);
  const [displayNow, setDisplayNow] = useState(() => Date.now());

  const { currentUser } = useAuth();

  const elapsedTime = useMemo(
    () => getElapsedWorkoutSeconds(timerState, displayNow),
    [displayNow, timerState]
  );

  const saveWorkoutState = useCallback(() => {
    if (
      !workoutStarted ||
      !currentUser ||
      timerState.timerStatus === TIMER_STATUS.IDLE
    ) {
      return false;
    }

    const state = {
      userId: currentUser.uid,
      workoutStarted,
      exercises,
      currentTemplate,
      selectedDay,
      elapsedTime: timerState.elapsedTime,
      timerStatus: timerState.timerStatus,
      timerStartedAt: timerState.timerStartedAt,
      workoutStartTime,
      timestamp: Date.now(),
    };
    localStorage.setItem("workoutState", JSON.stringify(state));
    return true;
  }, [
    workoutStarted,
    exercises,
    currentTemplate,
    selectedDay,
    timerState,
    workoutStartTime,
    currentUser,
  ]);

  const restoreWorkoutState = useCallback(() => {
    const savedState = localStorage.getItem("workoutState");
    if (!savedState || !currentUser) {
      return false;
    }

    try {
      const state = JSON.parse(savedState);

      if (state.userId !== currentUser.uid) {
        clearPersistedWorkoutState();
        return false;
      }

      const timestamp = Number(state.timestamp);
      if (!Number.isFinite(timestamp) || Date.now() - timestamp > TWO_HOURS_MS) {
        clearPersistedWorkoutState();
        return false;
      }

      const now = Date.now();
      setExercises(Array.isArray(state.exercises) ? state.exercises : []);
      setCurrentTemplate(state.currentTemplate || null);
      setSelectedDay(state.selectedDay || null);
      setWorkoutStartTime(state.workoutStartTime || null);
      setTimerState(normalizePersistedTimerState(state, now));
      setDisplayNow(now);
      setWorkoutStarted(Boolean(state.workoutStarted));

      return true;
    } catch (error) {
      console.error("Error restoring workout state:", error);
      clearPersistedWorkoutState();
      return false;
    }
  }, [currentUser]);

  const clearWorkoutState = useCallback(() => {
    clearPersistedWorkoutState();
    setWorkoutStarted(false);
    setExercises([]);
    setCurrentTemplate(null);
    setSelectedDay(null);
    setWorkoutStartTime(null);
    setTimerState(idleTimerState());
    setDisplayNow(Date.now());
  }, []);

  const pauseWorkoutTimer = useCallback(() => {
    const now = Date.now();
    setTimerState((current) => pauseTimerState(current, now));
    setDisplayNow(now);
  }, []);

  const resumeWorkoutTimer = useCallback(() => {
    const now = Date.now();
    setTimerState((current) => resumeTimerState(current, now));
    setDisplayNow(now);
  }, []);

  useEffect(() => {
    if (currentUser) {
      restoreWorkoutState();
    }
  }, [currentUser, restoreWorkoutState]);

  useEffect(() => {
    if (workoutStarted && timerState.timerStatus === TIMER_STATUS.IDLE) {
      const now = Date.now();
      setTimerState(createRunningTimerState(now));
      setDisplayNow(now);
    }
  }, [timerState.timerStatus, workoutStarted]);

  useEffect(() => {
    if (workoutStarted) {
      saveWorkoutState();
    }
  }, [workoutStarted, saveWorkoutState]);

  useEffect(() => {
    if (
      !workoutStarted ||
      timerState.timerStatus !== TIMER_STATUS.RUNNING
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      setDisplayNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.timerStatus, workoutStarted]);

  useEffect(() => {
    if (
      !workoutStarted ||
      timerState.timerStatus !== TIMER_STATUS.RUNNING
    ) {
      return undefined;
    }

    const heartbeat = setInterval(() => {
      saveWorkoutState();
    }, TIMER_HEARTBEAT_MS);

    return () => clearInterval(heartbeat);
  }, [saveWorkoutState, timerState.timerStatus, workoutStarted]);

  return {
    workoutStarted,
    setWorkoutStarted,
    exercises,
    setExercises,
    currentTemplate,
    setCurrentTemplate,
    selectedDay,
    setSelectedDay,
    elapsedTime,
    timerStatus: timerState.timerStatus,
    pauseWorkoutTimer,
    resumeWorkoutTimer,
    workoutStartTime,
    setWorkoutStartTime,
    saveWorkoutState,
    restoreWorkoutState,
    clearWorkoutState,
  };
};
