import { subWeeks, subMonths, isWithinInterval } from "date-fns";

export const getTimeRangeData = (data, timeRange) => {
  if (!data || data.length === 0) return [];

  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "1week":
      startDate = subWeeks(now, 1);
      break;
    case "1month":
      startDate = subMonths(now, 1);
      break;
    case "3months":
      startDate = subMonths(now, 3);
      break;
    case "6months":
      startDate = subMonths(now, 6);
      break;
    case "1year":
      startDate = subMonths(now, 12);
      break;
    default:
      return data;
  }

  return data.filter((item) =>
    isWithinInterval(item.date, { start: startDate, end: now })
  );
};

export const calculateTrendLine = (data) => {
  if (data.length < 2) return { slope: 0, intercept: 0 };

  const points = data.map((point, index) => ({
    x: index,
    y: Array.isArray(point.sets)
      ? Math.max(...point.sets.map((s) => s.weight || 0))
      : point.weight,
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

export const identifyPlateauPoints = (data) => {
  const plateauPoints = [];

  for (let i = 1; i < data.length; i++) {
    const currentWeight = Array.isArray(data[i].sets)
      ? Math.max(...data[i].sets.map((s) => s.weight || 0))
      : data[i].weight;
    const previousWeight = Array.isArray(data[i - 1].sets)
      ? Math.max(...data[i - 1].sets.map((s) => s.weight || 0))
      : data[i - 1].weight;

    // Consider it a plateau if weight hasn't increased
    if (currentWeight <= previousWeight) {
      plateauPoints.push(i);
    }
  }

  return plateauPoints;
};

export const calculateGoalProgress = (goal, exercises) => {
  const exerciseRecords = exercises.filter(
    (ex) => ex.exerciseName === goal.exerciseName
  );
  if (exerciseRecords.length === 0) return 0;

  const latestRecord = exerciseRecords.reduce((latest, current) =>
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  );

  const latestWeight = Math.max(
    ...(Array.isArray(latestRecord.sets)
      ? latestRecord.sets.map((s) => parseFloat(s.weight || 0))
      : [parseFloat(latestRecord.weight || 0)])
  );

  const weightProgress = goal.targetWeight
    ? (latestWeight / parseFloat(goal.targetWeight)) * 100
    : 100;

  const repsProgress =
    goal.targetReps && latestRecord.reps
      ? (parseFloat(latestRecord.reps) / parseFloat(goal.targetReps)) * 100
      : 100;

  const setsProgress =
    goal.targetSets && latestRecord.sets
      ? (Array.isArray(latestRecord.sets)
          ? latestRecord.sets.length
          : parseFloat(latestRecord.sets) / parseFloat(goal.targetSets)) * 100
      : 100;

  return Math.min((weightProgress + repsProgress + setsProgress) / 3, 100);
};
