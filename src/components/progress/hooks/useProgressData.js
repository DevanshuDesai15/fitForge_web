import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";

export const useProgressData = (activeMainTab) => {
  const [exercises, setExercises] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressData, setProgressData] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);

  const { currentUser } = useAuth();

  const processWeightProgress = useCallback((exerciseData) => {
    // Group exercises by name and sort by date
    const exerciseGroups = exerciseData.reduce((groups, exercise) => {
      const name = exercise.exerciseName;
      if (!groups[name]) groups[name] = [];
      groups[name].push({
        ...exercise,
        date: new Date(exercise.timestamp),
        weight: parseFloat(exercise.weight) || 0,
      });
      return groups;
    }, {});

    // Sort each group by date (oldest first)
    Object.keys(exerciseGroups).forEach((name) => {
      exerciseGroups[name].sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    setProgressData(exerciseGroups);
  }, []);

  const processPersonalRecords = useCallback((exerciseData) => {
    const records = exerciseData.reduce((acc, exercise) => {
      const name = exercise.exerciseName;
      const weight = Math.max(
        ...(Array.isArray(exercise.sets)
          ? exercise.sets.map((s) => parseFloat(s.weight || 0))
          : [parseFloat(exercise.weight || 0)])
      );

      if (!acc[name] || weight > acc[name].weight) {
        acc[name] = {
          exerciseName: name,
          weight: weight,
          reps: exercise.reps,
          sets: exercise.sets,
          date: new Date(exercise.timestamp),
          timestamp: exercise.timestamp,
        };
      }
      return acc;
    }, {});

    const recordsArray = Object.values(records).sort(
      (a, b) => b.weight - a.weight
    );
    setPersonalRecords(recordsArray);
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const goalsQuery = query(
        collection(db, "goals"),
        where("userId", "==", currentUser.uid)
      );
      const goalDocs = await getDocs(goalsQuery);
      const goalData = goalDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort in JavaScript instead of Firestore query
      goalData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setGoals(goalData);
    } catch (err) {
      console.error("Error loading goals:", err);
    }
  }, [currentUser.uid]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Load exercises
      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
      );
      const exerciseDocs = await getDocs(exercisesQuery);
      const exerciseData = exerciseDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExercises(exerciseData);

      // Extract unique exercise names for goal setting
      const uniqueExercises = [
        ...new Set(exerciseData.map((ex) => ex.exerciseName)),
      ].sort();
      setAvailableExercises(uniqueExercises);

      // Load data based on active main tab
      if (activeMainTab === 0) {
        // AI Dashboard
        processWeightProgress(exerciseData);
      } else if (activeMainTab === 1) {
        // Overview
        processWeightProgress(exerciseData);
        processPersonalRecords(exerciseData);
      } else if (activeMainTab === 2) {
        // Goals
        await loadGoals();
        processWeightProgress(exerciseData);
      } else if (activeMainTab === 3) {
        // Achievements
        processPersonalRecords(exerciseData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error loading progress data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    activeMainTab,
    currentUser.uid,
    processWeightProgress,
    processPersonalRecords,
    loadGoals,
  ]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [loadData, currentUser]);

  return {
    exercises,
    goals,
    loading,
    error,
    progressData,
    personalRecords,
    availableExercises,
    loadData,
    loadGoals,
    setError,
  };
};
