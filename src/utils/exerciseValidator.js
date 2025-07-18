// Exercise name validation and fuzzy matching utilities

// Simple Levenshtein distance function for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

// Calculate similarity percentage between two strings
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// Normalize exercise name for comparison
const normalizeExerciseName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize spaces
    .replace(/\b(the|a|an)\b/g, "") // Remove articles
    .trim();
};

// Find similar exercises in existing data
export const findSimilarExercises = (
  inputName,
  existingExercises,
  threshold = 0.8
) => {
  const normalizedInput = normalizeExerciseName(inputName);
  const suggestions = [];

  existingExercises.forEach((exercise) => {
    const normalizedExisting = normalizeExerciseName(
      exercise.exerciseName || exercise.name
    );
    const similarity = calculateSimilarity(normalizedInput, normalizedExisting);

    if (similarity >= threshold && similarity < 1.0) {
      // Don't suggest exact matches
      suggestions.push({
        original: exercise.exerciseName || exercise.name,
        similarity: similarity,
        exercise: exercise,
      });
    }
  });

  // Sort by similarity (highest first)
  return suggestions.sort((a, b) => b.similarity - a.similarity);
};

// Check if exercise name already exists (exact match)
export const findExactMatch = (inputName, existingExercises) => {
  const normalizedInput = normalizeExerciseName(inputName);

  return existingExercises.find((exercise) => {
    const normalizedExisting = normalizeExerciseName(
      exercise.exerciseName || exercise.name
    );
    return normalizedInput === normalizedExisting;
  });
};

// Validate exercise name and return suggestions
export const validateExerciseName = (
  inputName,
  existingExercises,
  apiExercises = []
) => {
  if (!inputName || inputName.trim().length < 2) {
    return {
      isValid: false,
      error: "Exercise name must be at least 2 characters long",
      suggestions: [],
    };
  }

  const trimmedName = inputName.trim();
  const allExercises = [...existingExercises, ...apiExercises];

  // Check for exact match
  const exactMatch = findExactMatch(trimmedName, allExercises);
  if (exactMatch) {
    return {
      isValid: true,
      exactMatch: exactMatch,
      suggestions: [],
    };
  }

  // Find similar exercises
  const similarExercises = findSimilarExercises(trimmedName, allExercises, 0.7);

  if (similarExercises.length > 0) {
    return {
      isValid: false,
      warning: "Similar exercises found. Did you mean one of these?",
      suggestions: similarExercises.slice(0, 5), // Top 5 suggestions
      canProceed: true, // Allow user to proceed anyway
    };
  }

  return {
    isValid: true,
    isNew: true,
    suggestions: [],
  };
};

// Group similar exercises for data cleanup
export const groupSimilarExercises = (exercises, threshold = 0.85) => {
  const groups = [];
  const processed = new Set();

  exercises.forEach((exercise, index) => {
    if (processed.has(index)) return;

    const group = {
      main: exercise,
      similar: [],
      totalCount: 1,
    };

    // Find similar exercises
    exercises.forEach((otherExercise, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const similarity = calculateSimilarity(
        normalizeExerciseName(exercise.exerciseName),
        normalizeExerciseName(otherExercise.exerciseName)
      );

      if (similarity >= threshold) {
        group.similar.push({
          exercise: otherExercise,
          similarity: similarity,
        });
        group.totalCount++;
        processed.add(otherIndex);
      }
    });

    processed.add(index);

    // Only add groups that have similar exercises
    if (group.similar.length > 0) {
      groups.push(group);
    }
  });

  return groups.sort((a, b) => b.totalCount - a.totalCount);
};

// Auto-correct common exercise name mistakes
export const autoCorrectExerciseName = (inputName) => {
  const corrections = {
    // Common misspellings
    benchpress: "Bench Press",
    "bench press": "Bench Press",
    deadlift: "Deadlift",
    "dead lift": "Deadlift",
    squat: "Squat",
    squats: "Squat",
    pullup: "Pull-up",
    "pull up": "Pull-up",
    pushup: "Push-up",
    "push up": "Push-up",
    chinup: "Chin-up",
    "chin up": "Chin-up",
    "bicep curl": "Bicep Curl",
    "biceps curl": "Bicep Curl",
    "tricep extension": "Tricep Extension",
    "triceps extension": "Tricep Extension",
    "lat pulldown": "Lat Pulldown",
    "lateral raise": "Lateral Raise",
    "shoulder press": "Shoulder Press",
    "leg press": "Leg Press",
    "calf raise": "Calf Raise",
    "calf raises": "Calf Raise",
  };

  const normalized = inputName.toLowerCase().trim();
  return corrections[normalized] || inputName;
};

// Export utilities for use in components
export const exerciseValidationUtils = {
  findSimilarExercises,
  findExactMatch,
  validateExerciseName,
  groupSimilarExercises,
  autoCorrectExerciseName,
  normalizeExerciseName,
  calculateSimilarity,
};
