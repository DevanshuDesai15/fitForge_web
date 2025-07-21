// wger Exercise API - Free alternative to RapidAPI
// Documentation: https://wger.de/en/software/api

const WGER_BASE_URL = "https://wger.de/api/v2";

// No API key needed for public endpoints!
const wgerOptions = {
  method: "GET",
  headers: {
    Accept: "application/json",
  },
};

console.log("🆓 Using FREE wger Exercise API - No API key needed!");

// Cache for muscle names, categories, and equipment to avoid repeated API calls
let muscleCache = null;
let categoryCache = null;
let equipmentCache = null;

// Helper function to load and cache reference data
const loadReferenceData = async () => {
  try {
    if (!muscleCache || !categoryCache || !equipmentCache) {
      console.log("📚 Loading reference data from wger API...");

      const [muscleResponse, categoryResponse, equipmentResponse] =
        await Promise.all([
          fetch(`${WGER_BASE_URL}/muscle/`, wgerOptions),
          fetch(`${WGER_BASE_URL}/exercisecategory/`, wgerOptions),
          fetch(`${WGER_BASE_URL}/equipment/`, wgerOptions),
        ]);

      const muscleData = await muscleResponse.json();
      const categoryData = await categoryResponse.json();
      const equipmentData = await equipmentResponse.json();

      // Create lookup maps
      muscleCache = muscleData.results.reduce((acc, muscle) => {
        acc[muscle.id] = muscle.name_en || muscle.name;
        return acc;
      }, {});

      categoryCache = categoryData.results.reduce((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {});

      equipmentCache = equipmentData.results.reduce((acc, equipment) => {
        acc[equipment.id] = equipment.name;
        return acc;
      }, {});

      console.log("✅ Reference data loaded:", {
        muscles: Object.keys(muscleCache).length,
        categories: Object.keys(categoryCache).length,
        equipment: Object.keys(equipmentCache).length,
      });
    }
  } catch (error) {
    console.error("Error loading reference data:", error);
  }
};

// No longer need separate translation function - exerciseinfo includes everything!

// Enhanced function to fetch exercises with complete information
export const fetchExercises = async (limit = 20, offset = 0) => {
  try {
    // Load reference data if not already cached
    await loadReferenceData();

    // Use exerciseinfo endpoint for complete data with translations (language=2 for English)
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=${limit}&offset=${offset}&language=2`,
      wgerOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform wger exerciseinfo data to match our app's expected format
    const exercises = data.results.map((exercise) => {
      // Get the English translation (language=2)
      const englishTranslation = exercise.translations.find(
        (t) => t.language === 2
      );

      // Extract muscle names directly from the response
      const primaryMuscles = exercise.muscles
        .map((muscle) => muscle.name_en || muscle.name)
        .filter(Boolean);
      const secondaryMuscles = exercise.muscles_secondary
        .map((muscle) => muscle.name_en || muscle.name)
        .filter(Boolean);

      // Extract equipment names directly from the response
      const equipmentList = exercise.equipment
        .map((eq) => eq.name)
        .filter(Boolean);

      return {
        id: `wger-${exercise.id}`,
        name: englishTranslation?.name || `Exercise ${exercise.id}`,
        description: englishTranslation?.description || "",
        bodyPart: exercise.category?.name || "Unknown",
        target: primaryMuscles.length > 0 ? primaryMuscles[0] : "Unknown",
        equipment: equipmentList.length > 0 ? equipmentList[0] : "bodyweight",
        muscles: primaryMuscles,
        muscles_secondary: secondaryMuscles,
        category: exercise.category?.name || "Unknown",
        uuid: exercise.uuid,
        images: exercise.images || [],
      };
    });

    console.log(
      `✅ Fetched ${exercises.length} exercises with proper names from wger exerciseinfo API`
    );
    return exercises;
  } catch (error) {
    console.error("Error fetching exercises from wger:", error);
    throw error;
  }
};

// Function to test loading ALL exercises in a single request
export const testLoadAllExercises = async () => {
  try {
    console.log("🧪 Testing if we can load ALL exercises in one request...");

    // First, get the total count
    const countResponse = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=1&language=2`,
      wgerOptions
    );
    const countData = await countResponse.json();
    const totalCount = countData.count;

    console.log(`📊 Total exercises available: ${totalCount}`);

    // Try to fetch ALL exercises with limit=totalCount
    const startTime = Date.now();
    const allResponse = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=${totalCount}&language=2`,
      wgerOptions
    );

    if (!allResponse.ok) {
      throw new Error(`HTTP error! status: ${allResponse.status}`);
    }

    const allData = await allResponse.json();
    const loadTime = Date.now() - startTime;

    console.log(
      `🎉 SUCCESS! Loaded ${allData.results.length} exercises in ${loadTime}ms`
    );
    console.log(
      `⚡ Single request vs pagination: ${loadTime}ms vs ~${
        Math.ceil(totalCount / 50) * 100
      }ms estimated`
    );

    return {
      success: true,
      count: allData.results.length,
      loadTime,
      canLoadAll: allData.results.length === totalCount,
    };
  } catch (error) {
    console.error("❌ Failed to load all exercises at once:", error);
    return {
      success: false,
      error: error.message,
      canLoadAll: false,
    };
  }
};

// Enhanced function to fetch ALL exercises (optimized approach)
export const fetchAllExercises = async () => {
  try {
    console.log("🚀 Fetching all exercises from wger API...");

    // First, test if we can load everything at once
    const testResult = await testLoadAllExercises();

    if (testResult.success && testResult.canLoadAll) {
      console.log("✅ Using single-request approach for maximum speed!");

      const response = await fetch(
        `${WGER_BASE_URL}/exerciseinfo/?limit=${testResult.count}&language=2`,
        wgerOptions
      );

      const data = await response.json();

      // Transform the data
      const exercises = data.results.map((exercise) => {
        const englishTranslation = exercise.translations.find(
          (t) => t.language === 2
        );
        const primaryMuscles = exercise.muscles
          .map((muscle) => muscle.name_en || muscle.name)
          .filter(Boolean);
        const secondaryMuscles = exercise.muscles_secondary
          .map((muscle) => muscle.name_en || muscle.name)
          .filter(Boolean);
        const equipmentList = exercise.equipment
          .map((eq) => eq.name)
          .filter(Boolean);

        return {
          id: `wger-${exercise.id}`,
          name: englishTranslation?.name || `Exercise ${exercise.id}`,
          description: englishTranslation?.description || "",
          bodyPart: exercise.category?.name || "Unknown",
          target: primaryMuscles.length > 0 ? primaryMuscles[0] : "Unknown",
          equipment: equipmentList.length > 0 ? equipmentList[0] : "bodyweight",
          muscles: primaryMuscles,
          muscles_secondary: secondaryMuscles,
          category: exercise.category?.name || "Unknown",
          uuid: exercise.uuid,
          images: exercise.images || [],
        };
      });

      console.log(
        `🎉 Successfully loaded ${exercises.length} exercises in a single request!`
      );
      return exercises;
    }

    // Fallback to pagination if single request fails
    console.log("📦 Using pagination approach...");

    let allExercises = [];
    let offset = 0;
    const limit = 100; // Increase batch size for better performance
    let hasMore = true;

    while (hasMore) {
      console.log(`📦 Fetching batch at offset ${offset}...`);

      const batch = await fetchExercises(limit, offset);

      if (batch.length === 0) {
        hasMore = false;
      } else {
        allExercises.push(...batch);

        // If we got less than the limit, we've reached the end
        if (batch.length < limit) {
          hasMore = false;
        } else {
          offset += limit;

          // Add a small delay to be nice to the API
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Safety check to prevent infinite loops
      if (offset > 5000) {
        console.warn("⚠️ Safety limit reached, stopping pagination");
        break;
      }
    }

    console.log(
      `✅ Fetched ${allExercises.length} total exercises using pagination`
    );
    return allExercises;
  } catch (error) {
    console.error("❌ Error in fetchAllExercises:", error);
    throw error;
  }
};

// Function to get exercise count
export const getExerciseCount = async () => {
  try {
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=1&language=2`,
      wgerOptions
    );
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error("Error getting exercise count:", error);
    return 0;
  }
};

// Function to fetch exercises by body part/category
export const fetchExercisesByBodyPart = async (
  bodyPart,
  limit = 20,
  offset = 0
) => {
  try {
    // Use exerciseinfo and filter by category name
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=${limit}&offset=${offset}&language=2`,
      wgerOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter exercises by body part/category
    const filteredExercises = data.results.filter(
      (exercise) =>
        exercise.category?.name.toLowerCase() === bodyPart.toLowerCase()
    );

    const exercises = filteredExercises.map((exercise) => {
      const englishTranslation = exercise.translations.find(
        (t) => t.language === 2
      );
      const primaryMuscles = exercise.muscles
        .map((muscle) => muscle.name_en || muscle.name)
        .filter(Boolean);
      const equipmentList = exercise.equipment
        .map((eq) => eq.name)
        .filter(Boolean);

      return {
        id: `wger-${exercise.id}`,
        name: englishTranslation?.name || `Exercise ${exercise.id}`,
        description: englishTranslation?.description || "",
        bodyPart: bodyPart,
        target: primaryMuscles.length > 0 ? primaryMuscles[0] : "Unknown",
        equipment: equipmentList.length > 0 ? equipmentList[0] : "bodyweight",
        muscles: primaryMuscles,
        category: bodyPart,
      };
    });

    console.log(`Fetched ${exercises.length} ${bodyPart} exercises from wger`);
    return exercises;
  } catch (error) {
    console.error(`Error fetching ${bodyPart} exercises:`, error);
    throw error;
  }
};

// Function to fetch exercises by target muscle
export const fetchExercisesByTarget = async (targetMuscle) => {
  try {
    // Use exerciseinfo and filter by muscle name
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseinfo/?limit=50&language=2`,
      wgerOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter exercises by target muscle (case insensitive)
    const filteredExercises = data.results.filter((exercise) => {
      const muscleNames = [
        ...exercise.muscles.map((m) => m.name_en || m.name),
        ...exercise.muscles_secondary.map((m) => m.name_en || m.name),
      ];
      return muscleNames.some((name) =>
        name.toLowerCase().includes(targetMuscle.toLowerCase())
      );
    });

    const exercises = filteredExercises.map((exercise) => {
      const englishTranslation = exercise.translations.find(
        (t) => t.language === 2
      );
      const primaryMuscles = exercise.muscles
        .map((muscle) => muscle.name_en || muscle.name)
        .filter(Boolean);
      const equipmentList = exercise.equipment
        .map((eq) => eq.name)
        .filter(Boolean);

      return {
        id: `wger-${exercise.id}`,
        name: englishTranslation?.name || `Exercise ${exercise.id}`,
        description: englishTranslation?.description || "",
        target: targetMuscle,
        equipment: equipmentList.length > 0 ? equipmentList[0] : "bodyweight",
        muscles: primaryMuscles,
        bodyPart: exercise.category?.name || "Unknown",
      };
    });

    console.log(
      `Fetched ${exercises.length} exercises targeting ${targetMuscle} from wger`
    );
    return exercises;
  } catch (error) {
    console.error(`Error fetching exercises for ${targetMuscle}:`, error);
    throw error;
  }
};

// Function to get available muscle targets
export const fetchTargetList = async () => {
  try {
    await loadReferenceData();
    return Object.values(muscleCache).filter(Boolean);
  } catch (error) {
    console.error("Error fetching target list:", error);
    return [];
  }
};

// Function to get available body parts/categories
export const fetchBodyPartList = async () => {
  try {
    await loadReferenceData();
    return Object.values(categoryCache).filter(Boolean);
  } catch (error) {
    console.error("Error fetching body part list:", error);
    return [];
  }
};

// Function to fetch exercise images from wger API
export const fetchExerciseImage = async (exerciseId) => {
  try {
    // Extract the numeric ID from wger-xxx format
    const numericId = exerciseId.replace("wger-", "");

    console.log(`🖼️ Fetching image for exercise ${numericId}...`);

    // Fetch exercise images for this exercise
    const response = await fetch(
      `${WGER_BASE_URL}/exerciseimage/?exercise_base=${numericId}&is_main=True`,
      wgerOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Return the main image URL
      const imageUrl = data.results[0].image;
      console.log(`✅ Found image for exercise ${numericId}: ${imageUrl}`);
      return imageUrl;
    } else {
      // No image available
      console.log(`📷 No image available for exercise ${numericId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching image for exercise ${exerciseId}:`, error);
    return null;
  }
};

// Function to fetch all images for an exercise (main + additional)
export const fetchExerciseImages = async (exerciseId) => {
  try {
    const numericId = exerciseId.replace("wger-", "");

    const response = await fetch(
      `${WGER_BASE_URL}/exerciseimage/?exercise_base=${numericId}`,
      wgerOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.results.map((img) => ({
      url: img.image,
      isMain: img.is_main,
      uuid: img.uuid,
    }));
  } catch (error) {
    console.error(`Error fetching images for exercise ${exerciseId}:`, error);
    return [];
  }
};

// Export configuration for easy switching
export const API_CONFIG = {
  name: "wger",
  baseUrl: WGER_BASE_URL,
  requiresAuth: false,
  rateLimit: "none",
  documentation: "https://wger.de/en/software/api",
};

console.log("✅ wger Exercise API service loaded successfully!");
