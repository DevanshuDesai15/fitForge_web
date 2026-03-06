import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './src/firebase/config.js';

async function checkUserData() {
    console.log("Fetching workouts...");
    // Let's use the local dev user ID that is typically logged in, or we can just fetch all workouts.
    const q = query(collection(db, 'workouts'), where('completed', '==', true));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.docs.length} completed workouts in total.`);
    
    if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0].data();
        console.log("Sample workout userId:", first.userId);
        console.log("Sample workout date:", first.timestamp?.toDate ? first.timestamp.toDate() : first.timestamp);
    }
    
    process.exit(0);
}

checkUserData().catch(console.error);
