const exerciseOptions = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
        'X-RapidAPI-Host': import.meta.env.VITE_RAPIDAPI_HOST
    }
};

console.log('API Options:', {
    key: import.meta.env.VITE_RAPIDAPI_KEY?.slice(0, 10) + '...',
});

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
        console.log(`Fetched ${data.length} exercises (limit: ${limit}, offset: ${offset})`);
        return data;

    } catch (error) {
        console.error('Error fetching exercises:', error);
        throw error;
    }
};

export const fetchExercisesByBodyPart = async (bodyPart, limit = 10, offset = 0) => {
    try {
        const response = await fetch(
            `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`, 
            exerciseOptions
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format received from API');
        }
        return data;
    } catch (error) {
        console.error('Error fetching exercises by body part:', error);
        throw error;
    }
};

export const fetchExercisesByTarget = async (target) => {
    try {
        const response = await fetch(`${API_BASE_URL}/exercises/target/${target}?limit=20`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching exercises by target:', error);
        throw error;
    }
};
export const fetchExercisesByTarget = async (target) => {
    try {
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/target/${target}`, exerciseOptions);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching exercises by target:', error);
        throw error;
    }
};

export const fetchExercisesByEquipment = async (equipment) => {
    try {
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/equipment/${equipment}`, exerciseOptions);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching exercises by equipment:', error);
        throw error;
    }
};

export const fetchExerciseById = async (id) => {
    try {
        const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`, exerciseOptions);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching exercise by id:', error);
        throw error;
    }
};

export const fetchExerciseImage = async (exerciseId, resolution = '360') => {
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
        console.error('Error fetching exercise image:', error);
        throw error;
    }
};