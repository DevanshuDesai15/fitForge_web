const exerciseOptions = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": import.meta.env.VITE_RAPIDAPI_KEY,
    "X-RapidAPI-Host": import.meta.env.VITE_RAPIDAPI_HOST,
  },
};

console.log("API Options:", {
  key: import.meta.env.VITE_RAPIDAPI_KEY?.slice(0, 10) + "...",
});

// Enhanced function to fetch exercises with automatic plan detection
export const fetchExercises = async (limit = 10, offset = 0) => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises?limit=${limit}&offset=${offset}`,
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      `Fetched ${data.length} exercises (limit: ${limit}, offset: ${offset})`
    );
    return data;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }
};

// New function to fetch ALL exercises (handles both free and paid plans)
export const fetchAllExercises = async () => {
  try {
    console.log("🚀 Attempting to fetch all exercises...");

    // First, try to get all exercises with limit=0 (works for paid plans)
    const allExercises = await fetchExercises(0, 0);

    // If we got more than 10 exercises, we're on a paid plan
    if (allExercises.length > 10) {
      console.log(
        `✅ Fetched ${allExercises.length} exercises (paid plan detected)`
      );
      return allExercises;
    }

    // If we got exactly 10 or fewer, we might be on free plan
    // Let's try pagination to get more
    console.log(
      "🔄 Paid plan limit not detected, using pagination approach..."
    );

    let allExercisesList = [];
    let offset = 0;
    const batchSize = 10;
    let hasMore = true;

    while (hasMore) {
      console.log(`📦 Fetching batch at offset ${offset}...`);

      const batch = await fetchExercises(batchSize, offset);

      if (batch.length === 0) {
        // No more exercises
        hasMore = false;
      } else {
        allExercisesList.push(...batch);

        // If we got less than the batch size, we've reached the end
        if (batch.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Safety check to prevent infinite loops
      if (offset > 10000) {
        console.warn("⚠️ Safety limit reached, stopping pagination");
        break;
      }
    }

    console.log(
      `✅ Pagination complete! Fetched ${allExercisesList.length} total exercises`
    );
    return allExercisesList;
  } catch (error) {
    console.error("❌ Error in fetchAllExercises:", error);
    throw error;
  }
};

// Function to get exercise count (useful for debugging plan limits)
export const getExerciseCount = async () => {
  try {
    // Try to get just 1 exercise to check API response
    const sample = await fetchExercises(1, 0);
    console.log("📊 API is working, sample exercise:", sample[0]?.name);

    // Try to get all exercises to determine total count
    const allExercises = await fetchAllExercises();
    return allExercises.length;
  } catch (error) {
    console.error("Error getting exercise count:", error);
    return 0;
  }
};

// Legacy function for backward compatibility
export const fetchExercisesByBodyPart = async (bodyPart) => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`,
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} ${bodyPart} exercises`);
    return data;
  } catch (error) {
    console.error(`Error fetching ${bodyPart} exercises:`, error);
    throw error;
  }
};

export const fetchExercisesByEquipment = async (equipment) => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/equipment/${equipment}`,
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} ${equipment} exercises`);
    return data;
  } catch (error) {
    console.error(`Error fetching ${equipment} exercises:`, error);
    throw error;
  }
};

export const fetchExercisesByTarget = async (target) => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/target/${target}`,
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} ${target} exercises`);
    return data;
  } catch (error) {
    console.error(`Error fetching ${target} exercises:`, error);
    throw error;
  }
};

export const fetchExerciseById = async (id) => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`,
      exerciseOptions
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching exercise by id:", error);
    throw error;
  }
};

export const fetchTargetList = async () => {
  try {
    const response = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises/targetList",
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Available target muscles:", data);
    return data;
  } catch (error) {
    console.error("Error fetching target list:", error);
    throw error;
  }
};

export const fetchBodyPartList = async () => {
  try {
    const response = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises/bodyPartList",
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Available body parts:", data);
    return data;
  } catch (error) {
    console.error("Error fetching body part list:", error);
    throw error;
  }
};

export const fetchExerciseImage = async (exerciseId, resolution = "360") => {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=${resolution}`,
      exerciseOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // The API returns the image as a blob
    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    return imageUrl;
  } catch (error) {
    console.error("Error fetching exercise image:", error);
    throw error;
  }
};
