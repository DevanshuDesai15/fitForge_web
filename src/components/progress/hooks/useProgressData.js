import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useSupabase } from "../../../hooks/useSupabase";

export const useProgressData = () => {
  const { currentUser } = useAuth();
  const supabase = useSupabase();

  // Fetch Goals
  const { 
    data: goals = [], 
    isLoading: loadingGoals,
    refetch: loadGoals
  } = useQuery({
    queryKey: ['goals', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", currentUser.uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map(d => ({
        ...d,
        userId: d.user_id,
        title: d.title,
        description: d.description,
        category: d.category,
        targetValue: d.target_value,
        currentValue: d.current_value,
        unit: d.unit,
        exerciseName: d.exercise_name,
        priority: d.priority,
        completed: d.completed,
        targetWeight: d.target_weight,
        targetReps: d.target_reps,
        targetSets: d.target_sets,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Workouts
  const { 
    data: workouts = [], 
    isLoading: loadingWorkouts,
    error: workoutsError,
    refetch: loadData
  } = useQuery({
    queryKey: ['historicalWorkouts', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from("workouts")
        .select("timestamp, exercises")
        .eq("user_id", currentUser.uid)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  // Derived: Flattened Exercises
  const exercises = useMemo(() => {
    const flattened = [];
    workouts.forEach(workout => {
      if (workout.exercises && Array.isArray(workout.exercises)) {
        workout.exercises.forEach(ex => {
          flattened.push({
            ...ex,
            timestamp: workout.timestamp
          });
        });
      }
    });
    return flattened;
  }, [workouts]);

  // Derived: Unique Available Exercises
  const availableExercises = useMemo(() => {
    return [...new Set(exercises.map((ex) => ex.exerciseName))].sort();
  }, [exercises]);

  // Derived: Weight Progress (group and sort)
  const progressData = useMemo(() => {
    const exerciseGroups = exercises.reduce((groups, exercise) => {
      const name = exercise.exerciseName;
      if (!groups[name]) groups[name] = [];
      groups[name].push({
        ...exercise,
        date: new Date(exercise.timestamp),
        weight: parseFloat(exercise.weight) || 0,
      });
      return groups;
    }, {});

    Object.keys(exerciseGroups).forEach((name) => {
      exerciseGroups[name].sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return exerciseGroups;
  }, [exercises]);

  // Derived: Personal Records
  const personalRecords = useMemo(() => {
    const records = exercises.reduce((acc, exercise) => {
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

    return Object.values(records).sort((a, b) => b.weight - a.weight);
  }, [exercises]);

  return {
    exercises,
    goals,
    loading: loadingGoals || loadingWorkouts,
    error: workoutsError ? workoutsError.message : "",
    progressData,
    personalRecords,
    availableExercises,
    loadData,
    loadGoals,
    setError: () => {}, // No-op since we depend on react-query error state now
  };
};
