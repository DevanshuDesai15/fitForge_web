import { collection, getDocs, addDoc, query, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fetchExercises } from './exerciseAPI';

// Add this function to clear the database if needed
export const clearExerciseDatabase = async () => {
    try {
        const exercisesRef = collection(db, 'exerciseDatabase');
        const snapshot = await getDocs(exercisesRef);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('Database cleared');
    } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
};

export const initializeExerciseDatabase = async () => {
    try {
        // First, clear the existing database
        await clearExerciseDatabase();
        console.log('Starting fresh initialization...');

        // Fetch all exercises from the API
        const exercises = await fetchExercises();
        console.log('Fetched exercises from API:', exercises.length);

        // Remove duplicates by name
        const uniqueExercises = Array.from(
            new Map(exercises.map(ex => [ex.name.toLowerCase(), ex])).values()
        );
        console.log('Unique exercises to store:', uniqueExercises.length);

        // Use batched writes for better performance
        const batches = [];
        const batchSize = 500;

        // Store initialization status
        const exercisesRef = collection(db, 'exerciseDatabase');
        await addDoc(exercisesRef, {
            initialized: true,
            timestamp: new Date().toISOString(),
            totalExercises: uniqueExercises.length
        });

        // Store exercises in batches
        for (let i = 0; i < uniqueExercises.length; i += batchSize) {
            const batch = writeBatch(db);
            const batchExercises = uniqueExercises.slice(i, i + batchSize);
            
            batchExercises.forEach(exercise => {
                const docRef = doc(exercisesRef);
                batch.set(docRef, {
                    name: exercise.name,
                    bodyPart: exercise.bodyPart,
                    equipment: exercise.equipment,
                    gifUrl: exercise.gifUrl,
                    target: exercise.target,
                    type: 'api'
                });
            });
            
            batches.push(batch.commit());
        }

        await Promise.all(batches);
        console.log('Successfully initialized exercise database');
        
        return uniqueExercises.length;
    } catch (error) {
        console.error('Error initializing exercise database:', error);
        throw error;
    }
};

export const getAllExercises = async () => {
    try {
        const exercisesRef = collection(db, 'exerciseDatabase');
        const snapshot = await getDocs(exercisesRef);
        
        // Create a Map to store unique exercises by name
        const uniqueExercises = new Map();
        
        snapshot.docs
            .filter(doc => {
                const data = doc.data();
                return data.type === 'api' && !data.initialized;
            })
            .forEach(doc => {
                const exercise = {
                    id: doc.id,
                    ...doc.data()
                };
                // Only add if we haven't seen this exercise name before
                if (!uniqueExercises.has(exercise.name.toLowerCase())) {
                    uniqueExercises.set(exercise.name.toLowerCase(), exercise);
                }
            });

        // Convert Map back to array and sort
        const exercises = Array.from(uniqueExercises.values())
            .sort((a, b) => a.name.localeCompare(b.name));

        console.log('Total unique exercises fetched:', exercises.length);
        return exercises;
    } catch (error) {
        console.error('Error fetching exercises:', error);
        throw error;
    }
};

export const checkExerciseDatabase = async () => {
    try {
        const exercisesRef = collection(db, 'exerciseDatabase');
        const snapshot = await getDocs(exercisesRef);
        const exercises = snapshot.docs.filter(doc => !doc.data().initialized);
        
        return {
            total: snapshot.docs.length,
            exercises: exercises.length
        };
    } catch (error) {
        console.error('Error checking database:', error);
        throw error;
    }
};