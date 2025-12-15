/**
 * Local Exercise Service
 * Uses local JSON data instead of external API for better performance and reliability
 */

// Import the exercise data
import mergedData from '../../MergedData.json' with { type: 'json' };

// Cache the exercises data for performance
let cachedExercises = null;
let exerciseCategories = null;
let equipmentTypes = null;
let muscleGroups = null;

/**
 * Initialize and cache exercise data with processed categories
 */
const initializeData = () => {
  if (cachedExercises) return cachedExercises;
  
  console.log('📊 Initializing local exercise data...');
  
  // Transform the JSON data to match the expected format in the app
  cachedExercises = mergedData.products.map((exercise) => ({
    id: exercise.id,
    name: exercise.title,
    title: exercise.title,
    slug: exercise.slug,
    description: exercise.description || '',
    steps: exercise.steps || [],
    bodyPart: exercise.muscle_groups?.[0] || 'Unknown',
    target: exercise.muscle_groups?.[0] || 'Unknown',
    equipment: exercise.equipment?.[0] || 'bodyweight',
    muscles: exercise.muscle_groups || [],
    muscle_groups: exercise.muscle_groups || [],
    exercise_types: exercise.exercise_types || [],
    difficulty: exercise.difficulty || 'Beginner',
    category: exercise.muscle_groups?.[0] || 'Unknown',
    images: [], // No static images in this data, but we have videos
    videos: exercise.video_urls ? [
      { quality: '720p', url: exercise.video_urls['720p'] },
      { quality: '480p', url: exercise.video_urls['480p'] }
    ] : [],
    video_urls: exercise.video_urls || {},
    url: exercise.url,
    type: 'local'
  }));
  
  // Extract unique categories for filtering
  exerciseCategories = [...new Set(cachedExercises.map(ex => ex.bodyPart))].filter(Boolean).sort();
  equipmentTypes = [...new Set(cachedExercises.map(ex => ex.equipment))].filter(Boolean).sort();
  muscleGroups = [...new Set(cachedExercises.flatMap(ex => ex.muscles))].filter(Boolean).sort();
  
  console.log(`✅ Loaded ${cachedExercises.length} exercises with ${exerciseCategories.length} categories`);
  console.log('📋 Categories:', exerciseCategories.slice(0, 5), '...');
  console.log('🏋️ Equipment:', equipmentTypes.slice(0, 5), '...');
  console.log('💪 Muscle Groups:', muscleGroups.slice(0, 5), '...');
  
  return cachedExercises;
};

/**
 * Get all exercises with optional pagination
 */
export const fetchExercises = async (limit = 20, offset = 0) => {
  try {
    const exercises = initializeData();
    const paginatedExercises = exercises.slice(offset, offset + limit);
    
    console.log(`📄 Fetched ${paginatedExercises.length} exercises (offset: ${offset}, limit: ${limit})`);
    return paginatedExercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};

/**
 * Get all exercises (no pagination)
 */
export const fetchAllExercises = async () => {
  try {
    const exercises = initializeData();
    console.log(`🚀 Fetched all ${exercises.length} exercises from local data`);
    return exercises;
  } catch (error) {
    console.error('Error fetching all exercises:', error);
    throw error;
  }
};

/**
 * Get exercise count
 */
export const getExerciseCount = async () => {
  try {
    const exercises = initializeData();
    return exercises.length;
  } catch (error) {
    console.error('Error getting exercise count:', error);
    return 0;
  }
};

/**
 * Search exercises by name
 */
export const fetchExercisesByName = async (searchTerm, limit = 50) => {
  try {
    console.log(`🔍 Searching exercises by name: "${searchTerm}"`);
    
    const exercises = initializeData();
    const searchLower = searchTerm.toLowerCase();
    
    // Filter exercises by name (case insensitive)
    const filteredExercises = exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(searchLower) ||
      exercise.description.toLowerCase().includes(searchLower) ||
      exercise.muscles.some(muscle => muscle.toLowerCase().includes(searchLower))
    );
    
    // Sort by relevance: exact matches first, then starts with, then contains
    const sortedExercises = filteredExercises.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match
      if (aName === searchLower) return -1;
      if (bName === searchLower) return 1;
      
      // Starts with search term
      if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
      if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1;
      
      // Alphabetical order for same relevance
      return aName.localeCompare(bName);
    });
    
    const results = sortedExercises.slice(0, limit);
    console.log(`✅ Found ${results.length} exercises matching "${searchTerm}"`);
    return results;
  } catch (error) {
    console.error(`Error searching exercises by name "${searchTerm}":`, error);
    throw error;
  }
};

/**
 * Fetch exercises by body part/category
 */
export const fetchExercisesByBodyPart = async (bodyPart, limit = 20, offset = 0) => {
  try {
    console.log(`🎯 Fetching exercises for body part: ${bodyPart}`);
    
    const exercises = initializeData();
    
    // Filter exercises by muscle groups (case insensitive)
    const filteredExercises = exercises.filter((exercise) =>
      exercise.muscles.some(muscle => muscle.toLowerCase() === bodyPart.toLowerCase())
    );
    
    const paginatedResults = filteredExercises.slice(offset, offset + limit);
    
    console.log(`✅ Found ${paginatedResults.length} ${bodyPart} exercises`);
    return paginatedResults;
  } catch (error) {
    console.error(`Error fetching ${bodyPart} exercises:`, error);
    throw error;
  }
};

/**
 * Fetch exercises by target muscle
 */
export const fetchExercisesByTarget = async (targetMuscle) => {
  try {
    console.log(`🎯 Fetching exercises for target muscle: ${targetMuscle}`);
    
    const exercises = initializeData();
    
    // Filter exercises by target muscle (case insensitive)
    const filteredExercises = exercises.filter((exercise) =>
      exercise.muscles.some(muscle => 
        muscle.toLowerCase().includes(targetMuscle.toLowerCase())
      ) || exercise.target.toLowerCase().includes(targetMuscle.toLowerCase())
    );
    
    console.log(`✅ Found ${filteredExercises.length} exercises targeting ${targetMuscle}`);
    return filteredExercises;
  } catch (error) {
    console.error(`Error fetching exercises by target ${targetMuscle}:`, error);
    throw error;
  }
};

/**
 * Get available muscle targets/categories
 */
export const fetchTargetList = async () => {
  try {
    initializeData();
    return muscleGroups;
  } catch (error) {
    console.error('Error fetching target list:', error);
    return [];
  }
};

/**
 * Get available equipment types
 */
export const fetchEquipmentList = async () => {
  try {
    initializeData();
    return equipmentTypes;
  } catch (error) {
    console.error('Error fetching equipment list:', error);
    return [];
  }
};

/**
 * Get available exercise categories
 */
export const fetchCategoryList = async () => {
  try {
    initializeData();
    return exerciseCategories;
  } catch (error) {
    console.error('Error fetching category list:', error);
    return [];
  }
};

/**
 * Get exercise by ID
 */
export const fetchExerciseById = async (exerciseId) => {
  try {
    const exercises = initializeData();
    const exercise = exercises.find(ex => ex.id === exerciseId);
    
    if (!exercise) {
      throw new Error(`Exercise with id ${exerciseId} not found`);
    }
    
    console.log(`✅ Found exercise: ${exercise.name}`);
    return exercise;
  } catch (error) {
    console.error(`Error fetching exercise by id ${exerciseId}:`, error);
    throw error;
  }
};

/**
 * Filter exercises by multiple criteria
 */
export const fetchExercisesByFilter = async (filters = {}) => {
  try {
    const exercises = initializeData();
    const { 
      bodyPart, 
      equipment, 
      difficulty, 
      muscleGroup, 
      exerciseType,
      limit = 50 
    } = filters;
    
    let filteredExercises = exercises;
    
    if (bodyPart) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.bodyPart.toLowerCase() === bodyPart.toLowerCase()
      );
    }
    
    if (equipment) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.equipment.toLowerCase() === equipment.toLowerCase()
      );
    }
    
    if (difficulty) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }
    
    if (muscleGroup) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.muscles.some(muscle => muscle.toLowerCase() === muscleGroup.toLowerCase())
      );
    }
    
    if (exerciseType) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.exercise_types.some(type => type.toLowerCase() === exerciseType.toLowerCase())
      );
    }
    
    const results = filteredExercises.slice(0, limit);
    
    console.log(`🎯 Filtered ${results.length} exercises with criteria:`, filters);
    return results;
  } catch (error) {
    console.error('Error filtering exercises:', error);
    throw error;
  }
};

/**
 * Get exercise images (for compatibility with existing components)
 * Since our local data uses videos instead of images, this returns empty array
 * But preserves the videos in the exercise data
 */
export const fetchExerciseImages = async (exerciseId) => {
  try {
    console.log(`🖼️ Fetching images for exercise: ${exerciseId} (using videos instead)`);
    // Our local data uses videos instead of images, so return empty array
    // The exercise data itself already contains video URLs
    return [];
  } catch (error) {
    console.error(`Error fetching images for exercise ${exerciseId}:`, error);
    return [];
  }
};

// Test function to verify the service works
export const testLocalService = async () => {
  try {
    console.log('🧪 Testing local exercise service...');
    
    const allExercises = await fetchAllExercises();
    console.log(`✅ Total exercises: ${allExercises.length}`);
    
    const searchResults = await fetchExercisesByName('kettlebell', 5);
    console.log(`✅ Search results: ${searchResults.length}`);
    
    const backExercises = await fetchExercisesByBodyPart('Back', 5);
    console.log(`✅ Back exercises: ${backExercises.length}`);
    
    const categories = await fetchCategoryList();
    console.log(`✅ Categories: ${categories.length}`);
    
    console.log('🎉 Local exercise service test completed!');
    return true;
  } catch (error) {
    console.error('❌ Local exercise service test failed:', error);
    return false;
  }
};
