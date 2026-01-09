import supabase from "./supabaseUtil.js";
import csv from "csv-parser";
import { Readable } from "stream";

function parseHevyDate(dateStr) {
  if (!dateStr) return null;
  const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
  try {
    const cleanStr = dateStr.replace(/,/g, ''); 
    const parts = cleanStr.split(' ');
    if (parts.length < 4) return null;
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]];
    const year = parts[2];
    const time = parts[3];
    if (!month) return null;
    return `${year}-${month}-${day} ${time}:00`;
  } catch (e) { return null; }
}

export async function importWorkoutsFromCsv(userId, fileBuffer) {
  // 1. Build Dynamic Exercise Map (Name -> ID) from DB
  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .select("id, name");
  
  if (exError) throw exError;
  
  const exerciseMap = {};
  exercises.forEach(e => {
      exerciseMap[e.name] = e.id;
  });

  // 2. Parse CSV
  const workoutsMap = new Map();
  const stream = Readable.from(fileBuffer.toString());

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        const rawStart = row.start_time;
        if (!rawStart) return;
        const formattedStart = parseHevyDate(rawStart);
        const formattedEnd = parseHevyDate(row.end_time);
        if (!formattedStart) return;

        if (!workoutsMap.has(formattedStart)) {
          workoutsMap.set(formattedStart, {
            user_id: userId,
            title: row.title,
            start_time: formattedStart,
            end_time: formattedEnd,
            description: row.description || "",
            exercisesMap: new Map()
          });
        }

        const workout = workoutsMap.get(formattedStart);
        const exerciseName = row.exercise_title;
        const exerciseId = exerciseMap[exerciseName];

        if (!exerciseId) return; // Skip unknown exercises

        if (!workout.exercisesMap.has(exerciseId)) {
          workout.exercisesMap.set(exerciseId, {
            exercise_id: exerciseId,
            notes: row.exercise_notes || "",
            sets: []
          });
        }

        const exercise = workout.exercisesMap.get(exerciseId);
        const cleanFloat = (val) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(',', '.')) || 0;
        };

        exercise.sets.push({
          set_index: parseInt(row.set_index) || 0,
          set_type: row.set_type || 'normal',
          weight_kg: cleanFloat(row.weight_kg),
          reps: cleanFloat(row.reps)
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // 3. Insert Data
  const workoutsPayload = Array.from(workoutsMap.values()).map(w => ({
      ...w,
      exercises: Array.from(w.exercisesMap.values())
  }));

  let successCount = 0;

  for (const wData of workoutsPayload) {
      const { data: workout, error: wError } = await supabase
          .from("workouts")
          .insert([{ user_id: userId, title: wData.title, start_time: wData.start_time, end_time: wData.end_time, description: wData.description }])
          .select().single();
      
      if (wError) continue;

      for (const exData of wData.exercises) {
          const { data: we, error: weError } = await supabase.from("workout_exercises").insert([{ workout_id: workout.id, exercise_id: exData.exercise_id, notes: exData.notes }]).select().single();
          if (weError) continue;
          const setsPayload = exData.sets.map((s, i) => ({ workout_exercise_id: we.id, set_index: i, set_type: s.set_type, weight_kg: s.weight_kg, reps: s.reps }));
          await supabase.from("sets").insert(setsPayload);
      }
      successCount++;
  }

  return successCount;
}
