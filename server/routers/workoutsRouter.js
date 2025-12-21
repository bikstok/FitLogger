import { Router } from "express";
import supabase from "../util/supabaseUtil.js";
import { calculateDuration, calculateTotalVolume } from "../util/workoutUtils.js";

const router = Router();

// POST /api/workouts
router.post("/api/workouts", async (req, res) => {
  const {
    user_id, // Integer (e.g., 6)
    title,
    start_time,
    end_time,
    description,
    exercises // Array of exercises with sets
  } = req.body;

  if (!user_id || !title || !start_time) {
    return res.status(400).send({ 
      error: "Missing required fields: user_id, title, start_time" 
    });
  }

  try {
    // 1. Create Workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert([{
        user_id: user_id,
        title,
        start_time,
        end_time,
        description
      }])
      .select()
      .single();

    if (workoutError) throw workoutError;
    const workoutId = workout.id;

    // 2. Loop Exercises
    if (exercises && exercises.length > 0) {
      for (const exercise of exercises) {
        
        // A. Insert Workout_Exercise Link
        const { data: workoutExercise, error: weError } = await supabase
          .from("workout_exercises")
          .insert([{
            workout_id: workoutId,
            exercise_id: exercise.exercise_id, 
            notes: exercise.notes || ""
          }])
          .select()
          .single();

        if (weError) throw weError;

        // B. Insert Sets (No RPE/Distance/Seconds)
        if (exercise.sets && exercise.sets.length > 0) {
          const setsPayload = exercise.sets.map((set, index) => ({
            workout_exercise_id: workoutExercise.id,
            set_index: index,
            set_type: set.set_type || 'normal',
            weight_kg: set.weight_kg || 0,
            reps: set.reps || 0
          }));

          const { error: setsError } = await supabase
            .from("sets")
            .insert(setsPayload);

          if (setsError) throw setsError;
        }
      }
    }

    res.status(201).send({ 
      message: "Workout created successfully", 
      workout_id: workoutId 
    });

  } catch (error) {
    console.error("Error creating workout:", error);
    res.status(500).send({ error: error.message || "Internal Server Error" });
  }
});

router.get("/api/workouts/:userId", async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(`
        *,
        workout_exercises (
          *,
          sets (*),
          exercises (*)
        )
      `)
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(error);
      return res.status(500).send({ error: "Could not fetch workouts" });
    }

    // Calculate derived fields (Volume & Duration) on the server
    const enrichedData = data.map((workout) => {
      const duration = calculateDuration(workout.start_time, workout.end_time);
      const total_volume = calculateTotalVolume(workout.workout_exercises);

      return { ...workout, duration, total_volume };
    });

    res.status(200).send({ data: enrichedData });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Internal server error" });
  }
});

router.delete("/api/workouts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) {
      console.error(error);
      return res.status(500).send({ error: "Could not delete workout" });
    }

    res.status(200).send({ message: "Workout deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Internal server error" });
  }
});

export default router;