import fs from 'fs';
import fetch from 'node-fetch'; // Run 'npm install node-fetch' if needed

// 1. Read the JSON file
// Ensure workouts_seed.json is in the same folder
const workouts = JSON.parse(fs.readFileSync('./workouts.json', 'utf-8'));

const API_URL = 'http://localhost:8080/api/workouts';

async function seedWorkouts() {
  console.log(`Found ${workouts.length} workouts to seed...`);

  let successCount = 0;
  let failCount = 0;

  for (const [index, workout] of workouts.entries()) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });

      if (response.ok) {
        process.stdout.write('.'); // Progress dot
        successCount++;
      } else {
        const err = await response.json();
        console.error(`\nFailed workout "${workout.title}" (${workout.start_time}):`, err);
        failCount++;
      }
    } catch (error) {
      console.error(`\nNetwork Error on workout ${index + 1}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n\n--- Seeding Complete ---`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

seedWorkouts();