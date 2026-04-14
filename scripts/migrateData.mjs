import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// 1. Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(await fs.readFile('./firebaseAuth.json', 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin Initialized");
} catch (e) {
  console.error("❌ Failed to init Firebase:", e.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL or Anon Key missing in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log("✅ Supabase Client Initialized");

// Helper to convert Firestore Timestamp to ISO string
const castTimestamp = (val) => {
  if (val && val.toDate) {
    return val.toDate().toISOString();
  }
  return new Date().toISOString(); // fallback
};

async function migrateUsers() {
  console.log("Migrating Users...");
  const snapshot = await db.collection('users').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // In our new schema we use 'profiles'
    const { error } = await supabase.from('profiles').insert({
      id: doc.id, // using string id natively now
      display_name: data.displayName || data.name || '',
      email: data.email || '',
      age: data.age || null,
      bodyweight_kg: data.bodyweight || data.weight || null,
      training_frequency: data.trainingFrequency || null,
      preferred_progression_style: data.progressionStyle || '',
      created_at: castTimestamp(data.createdAt)
    });
    if (error) console.error("Error migrating user:", doc.id, error);
    else count++;
  }
  console.log(`✅ Migrated ${count} users.`);
}

async function migrateWorkoutTemplates() {
  console.log("Migrating Workout Templates...");
  const snapshot = await db.collection('workoutTemplates').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { error } = await supabase.from('workout_templates').insert({
      user_id: data.userId || null,
      name: data.name || 'Unnamed Template',
      description: data.description || '',
      estimated_duration_minutes: parseInt((data.estimatedDuration || data.duration || '0').toString().replace(/\D/g, ''), 10) || null,
      is_custom: data.isCustom !== undefined ? data.isCustom : true,
      exercises: data.exercises || [],
      created_at: castTimestamp(data.createdAt)
    });
    if (error) console.error("Error migrating template:", doc.id, error);
    else count++;
  }
  console.log(`✅ Migrated ${count} templates.`);
}

async function migrateWorkoutPrograms() {
  console.log("Migrating Workout Programs...");
  const snapshot = await db.collection('workoutPrograms').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { error } = await supabase.from('workout_programs').insert({
      user_id: data.userId || null,
      name: data.name || 'Unnamed Program',
      description: data.description || '',
      schedule: data.schedule || data.workouts || [],
      created_at: castTimestamp(data.createdAt)
    });
    if (error) console.error("Error migrating program:", doc.id, error);
    else count++;
  }
  console.log(`✅ Migrated ${count} programs.`);
}

async function migrateWorkouts() {
  console.log("Migrating Historical Workouts...");
  const snapshot = await db.collection('workouts').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // We also need to fetch matching exercises from the 'exercises' collection for this workout
    const exSnapshot = await db.collection('exercises').where('workoutId', '==', doc.id).get();
    const exerciseList = exSnapshot.docs.map(e => e.data());

    const { error } = await supabase.from('workouts').insert({
      user_id: data.userId || null,
      name: data.name || 'Unnamed Workout',
      timestamp: castTimestamp(data.date || data.createdAt),
      duration_seconds: parseInt((data.duration || '0').toString().replace(/\D/g, ''), 10) || null,
      total_volume_kg: data.totalVolume || null,
      notes: data.notes || '',
      exercises: exerciseList || [], // Dump all attached exercises into the JSONB array
      created_at: castTimestamp(data.createdAt)
    });
    if (error) console.error("Error migrating workout:", doc.id, error);
    else count++;
  }
  console.log(`✅ Migrated ${count} workouts.`);
}

async function migrateGoals() {
  console.log("Migrating Goals...");
  const snapshot = await db.collection('goals').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const { error } = await supabase.from('goals').insert({
      user_id: data.userId || null,
      type: data.type || data.goalType || 'general',
      target_value: data.targetValue || 0,
      current_value: data.currentValue || 0,
      deadline: data.deadline ? castTimestamp(data.deadline) : null,
      exercise_name: data.exerciseName || data.exercise || null,
      created_at: castTimestamp(data.createdAt)
    });
    if (error) console.error("Error migrating goal:", doc.id, error);
    else count++;
  }
  console.log(`✅ Migrated ${count} goals.`);
}

async function migrateMergedDataLibrary() {
  console.log("Migrating MergedData.json to Supabase Exercises Database...");
  try {
    const raw = await fs.readFile('./MergedData.json', 'utf8');
    const data = JSON.parse(raw);
    const exercises = data.products || [];
    let count = 0;
    
    // Process in batches so we don't blow up the Supabase Edge API
    const BATCH_SIZE = 50;
    for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
      const batch = exercises.slice(i, i + BATCH_SIZE).map(ex => {
        // Build equipment string from array
        const equipmentText = Array.isArray(ex.equipment_needed) 
          ? ex.equipment_needed.join(', ') 
          : (ex.equipment_needed || null);
          
        return {
          slug: ex.slug || ex.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: ex.title,
          description: ex.description || '',
          steps: ex.steps || [],
          body_part: ex.primary_muscle || null,
          target_muscle: ex.primary_muscle || null,
          equipment: equipmentText,
          muscles: [...(ex.secondary_muscles || []), ex.primary_muscle].filter(Boolean),
          difficulty: ex.difficulty || null,
          video_urls: ex.video_urls || {}
        };
      });
      
      const { error } = await supabase.from('exercises').insert(batch);
      if (error) {
        // Just log one error if batch fails
        console.error(`Error inserting batch ${i}:`, error.message);
      } else {
        count += batch.length;
      }
    }
    console.log(`✅ Migrated ${count} exercises from MergedData.json.`);
  } catch (e) {
    console.error("❌ Failed to map MergedData.json:", e.message);
  }
}

async function runAll() {
  console.log("🚀 Starting FitForge Data Migration Script...");
  await migrateUsers();
  await migrateWorkoutTemplates();
  await migrateWorkoutPrograms();
  await migrateWorkouts();
  await migrateGoals();
  await migrateMergedDataLibrary();
  console.log("🎉 Migration Complete!");
}

runAll();
