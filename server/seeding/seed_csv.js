import fs from 'fs';
import csv from 'csv-parser';
import fetch from 'node-fetch'; 

const FILE_PATH = './hevy_workouts.csv'; 
const API_URL = 'http://localhost:8080/api/workouts';
const USER_ID = 8; 

const exerciseMap = {
  'Shoulder Press (Dumbbell)': 1, 'Lat Pulldown (Cable)': 2, 'Bench Press (Smith Machine)': 3,
  'Bench Press (Barbell)': 4, 'Bench Press (Dumbbell)': 5, 'Seated Cable Row - V Grip (Cable)': 6,
  'Rear Delt Reverse Fly (Machine)': 7, 'Lateral Raise (Cable)': 8, 'Skullcrusher (Barbell)': 9,
  'EZ Bar Biceps Curl': 10, 'Seated Incline Curl (Dumbbell)': 11, 'Lying Leg Curl (Machine)': 12,
  'Leg Press Horizontal (Machine)': 13, 'Leg Extension (Machine)': 14, 'Back Extension (Machine)': 15,
  'Crunch (Machine)': 16, 'Calf Press (Machine)': 17, 'Incline Bench Press (Smith Machine)': 18,
  'Chest Fly (Machine)': 19, 'Lat Pulldown - Close Grip (Cable)': 20, 'Hip Abduction (Machine)': 21,
  'Hip Adduction (Machine)': 22, 'Iso-Lateral High Row (Machine)': 23, 'Iso-Lateral Chest Press (Machine)': 24,
  'Single Arm Triceps Pushdown (Cable)': 25, 'Iso-Lateral Low Row': 26, 'Behind the Back Curl (Cable)': 27,
  'Hip Thrust (Barbell)': 28, 'Hack Squat (Machine)': 29, 'Cable Crunch': 30, 'Pull Up (Assisted)': 31,
  'Bulgarian Split Squat': 32, 'Seated Leg Curl (Machine)': 33, 'Back Extension (Weighted Hyperextension)': 34,
  'Seated Shoulder Press (Machine)': 35, 'Bicep Curl (Machine)': 36, 'Single Arm Lateral Raise (Cable)': 37,
  'Leg Press (Machine)': 38, 'Chest Press (Machine)': 39, 'Back Extension Plank': 40, 'Single Arm Curl (Cable)': 42,
  'Skullcrusher (Dumbbell)': 43, 'Cable Fly Crossovers': 44, 'Bent Over Row (Barbell)': 45,
  'Seated Row (Machine)': 46, 'Triceps Extension (Cable)': 47, 'Face Pull': 48,
  'Single Leg Standing Calf Raise (Dumbbell)': 49, 'Lat Pulldown (Machine)': 50,
  'Incline Bench Press (Dumbbell)': 51, 'Seated Cable Row - Bar Wide Grip': 52,
  'Standing Calf Raise (Machine)': 53, 'Iso-Lateral Row (Machine)': 54, 'Preacher Curl (Barbell)': 55,
  'Lateral Raise (Dumbbell)': 56, 'Bicep Curl (Cable)': 57, 'Standing Calf Raise (Smith)': 58
};

// Helper: Convert "18/12/2025 14.09" -> "2025-12-18 14:09:00"
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  // If it's already standard ISO (YYYY-MM-DD...), leave it
  if (dateStr.includes('-') && dateStr.includes(':')) return dateStr;

  try {
    // Expected format: "DD/MM/YYYY HH.MM"
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    let [hour, minute] = timePart.split('.');
    
    // Safety check for seconds (sometimes missing)
    if (!minute) minute = '00';
    
    return `${year}-${month}-${day} ${hour}:${minute}:00`;
  } catch (e) {
    console.warn(`Warning: Could not parse date "${dateStr}". Sending as-is.`);
    return dateStr;
  }
}

async function processAndSeed() {
  const workoutsMap = new Map();

  // 1. Detect Separator
  let fileContent = fs.readFileSync(FILE_PATH, { encoding: 'utf-8', start: 0, end: 500 });
  const separator = fileContent.includes(';') ? ';' : ',';
  console.log(`Using separator: "${separator}"`);

  fs.createReadStream(FILE_PATH)
    .pipe(csv({ 
        separator: separator,
        mapHeaders: ({ header }) => header.trim() 
    }))
    .on('data', (row) => {
      // 2. Fix the Date Format here
      const rawStart = row.start_time;
      if (!rawStart) return;

      const formattedStart = formatDate(rawStart);
      const formattedEnd = formatDate(row.end_time);

      if (!workoutsMap.has(formattedStart)) {
        workoutsMap.set(formattedStart, {
          user_id: USER_ID,
          title: row.title,
          start_time: formattedStart,
          end_time: formattedEnd,
          description: row.description && row.description !== 'nan' ? row.description : "",
          exercisesMap: new Map() 
        });
      }

      const workout = workoutsMap.get(formattedStart);
      const exerciseName = row.exercise_title;
      const exerciseId = exerciseMap[exerciseName];

      if (!exerciseId) return;

      if (!workout.exercisesMap.has(exerciseId)) {
        workout.exercisesMap.set(exerciseId, {
          exercise_id: exerciseId,
          notes: row.exercise_notes && row.exercise_notes !== 'nan' ? row.exercise_notes : "",
          sets: []
        });
      }

      const exercise = workout.exercisesMap.get(exerciseId);
      
      const cleanFloat = (val) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          // Handle "20,5" -> 20.5
          return parseFloat(String(val).replace(',', '.')) || 0;
      };

      exercise.sets.push({
        set_index: parseInt(row.set_index) || 0,
        set_type: row.set_type || 'normal',
        weight_kg: cleanFloat(row.weight_kg),
        reps: cleanFloat(row.reps)
      });
    })
    .on('end', async () => {
      console.log('Parsing complete. Uploading...');
      
      const workoutsPayload = Array.from(workoutsMap.values()).map(w => ({
        ...w,
        exercises: Array.from(w.exercisesMap.values())
      }));

      let success = 0;
      let fail = 0;

      for (const workout of workoutsPayload) {
        delete workout.exercisesMap; 
        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workout)
          });
          if (res.ok) {
            process.stdout.write('.');
            success++;
          } else {
             // Print error only for first few failures to avoid spam
             if (fail < 3) {
                 const txt = await res.text();
                 console.error(`\nFailed: ${txt}`);
             } else {
                 process.stdout.write('x');
             }
             fail++;
          }
        } catch (e) {
            fail++;
        }
      }
      console.log(`\n\nSuccess: ${success}, Failed: ${fail}`);
    });
}

processAndSeed();