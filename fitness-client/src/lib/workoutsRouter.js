import { Router } from "express";
import supabase from "../util/supabaseUtil.js";

const router = Router();

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
      // 1. Calculate Duration
      let duration = "";
      if (workout.start_time && workout.end_time) {
        const diff = new Date(workout.end_time) - new Date(workout.start_time);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      }

      // 2. Calculate Total Volume
      let total_volume = 0;
      if (workout.workout_exercises) {
        workout.workout_exercises.forEach((ex) => {
          if (ex.sets) {
            ex.sets.forEach((set) => {
              total_volume += (set.weight_kg || 0) * (set.reps || 0);
            });
          }
        });
      }

      return { ...workout, duration, total_volume };
    });

    res.status(200).send({ data: enrichedData });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Internal server error" });
  }
});

export default router;
