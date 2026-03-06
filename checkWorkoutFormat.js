import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './src/firebase/config.js';

async function checkUserData() {
    console.log("Fetching workouts...");
    const q = query(collection(db, 'workouts'), where('completed', '==', true), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0].data();
        console.log("Exercises sample:", JSON.stringify(first.exercises?.[0], null, 2));
    }
    
    process.exit(0);
}

checkUserData().catch(console.error);
