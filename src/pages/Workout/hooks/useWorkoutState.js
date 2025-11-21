import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";

export const useWorkoutState = () => {
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);

  const { currentUser } = useAuth();

  const saveWorkoutState = useCallback(() => {
    if (workoutStarted && currentUser) {
      const state = {
        userId: currentUser.uid,
        workoutStarted,
        exercises,
        currentTemplate,
        selectedDay,
        elapsedTime,
        workoutStartTime,
        timestamp: Date.now(),
      };
      localStorage.setItem("workoutState", JSON.stringify(state));
    }
  }, [
    workoutStarted,
    exercises,
    currentTemplate,
    selectedDay,
    elapsedTime,
    workoutStartTime,
    currentUser,
  ]);

  const restoreWorkoutState = useCallback(() => {
    const savedState = localStorage.getItem("workoutState");
    if (savedState && currentUser) {
      try {
        const state = JSON.parse(savedState);

        // Verify the state belongs to the current user
        if (state.userId !== currentUser.uid) {
          localStorage.removeItem("workoutState");
          return false;
        }

        // Check if the saved state is not too old (2 hours)
        const timeDiff = Date.now() - state.timestamp;
        const twoHours = 2 * 60 * 60 * 1000;

        if (timeDiff > twoHours) {
          localStorage.removeItem("workoutState");
          return false;
        }

        // Restore state
        setWorkoutStarted(state.workoutStarted || false);
        setExercises(state.exercises || []);
        setCurrentTemplate(state.currentTemplate || null);
        setSelectedDay(state.selectedDay || null);
        setElapsedTime(state.elapsedTime || 0);
        setWorkoutStartTime(state.workoutStartTime || null);

        return true;
      } catch (error) {
        console.error("Error restoring workout state:", error);
        localStorage.removeItem("workoutState");
        return false;
      }
    }
    return false;
  }, [currentUser]);

  const clearWorkoutState = useCallback(() => {
    localStorage.removeItem("workoutState");
    setWorkoutStarted(false);
    setExercises([]);
    setCurrentTemplate(null);
    setSelectedDay(null);
    setElapsedTime(0);
    setWorkoutStartTime(null);
  }, []);

  // Auto-save workout state when it changes
  useEffect(() => {
    if (workoutStarted) {
      saveWorkoutState();
    }
  }, [
    workoutStarted,
    exercises,
    currentTemplate,
    selectedDay,
    elapsedTime,
    saveWorkoutState,
  ]);

  // Restore workout state on component mount
  useEffect(() => {
    if (currentUser) {
      restoreWorkoutState();
    }
  }, [currentUser, restoreWorkoutState]);

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
    setElapsedTime,
    workoutStartTime,
    setWorkoutStartTime,
    saveWorkoutState,
    restoreWorkoutState,
    clearWorkoutState,
  };
};
