import { Router } from "express";
import supabase from "../util/supabaseUtil.js";
import { getStartDateForRange, generateTimeBuckets } from "../util/dateUtils.js";

const router = Router();

router.get("/api/stats/weekly-duration/:userId", async (req, res) => {
  const { userId } = req.params;
  const { range = "3m" } = req.query;

  const stats = generateTimeBuckets(range);

  const queryStartDate = stats[0].start.toISOString();

  try {
    const { data, error } = await supabase
      .from("workouts")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .gte("start_time", queryStartDate);

    if (error) throw error;

    // Fill buckets
    data.forEach(w => {
        if (!w.start_time || !w.end_time) return;
        const wStart = new Date(w.start_time);
        const duration = (new Date(w.end_time) - wStart) / (1000 * 60 * 60);
        
        const bucket = stats.find(s => wStart >= s.start && wStart < s.end);
        if (bucket) {
            bucket.hours += duration;
        }
    });

    res.send({ data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.get("/api/stats/muscle-distribution/:userId", async (req, res) => {
  const { userId } = req.params;
  const { range = "3m" } = req.query;
  const startDate = getStartDateForRange(range);

  try {
    // Join workout_exercises with exercises and filter by user via workouts
    const { data, error } = await supabase
      .from("workout_exercises")
      .select(`
        exercises (
          primary_muscle_group
        ),
        workouts!inner (
          user_id,
          start_time
        )
      `)
      .eq("workouts.user_id", userId)
      .gte("workouts.start_time", startDate.toISOString());

    if (error) throw error;

    // Aggregate counts by muscle group
    const distribution = {};
    data.forEach((item) => {
      const group = item.exercises?.primary_muscle_group;
      if (group) {
        distribution[group] = (distribution[group] || 0) + 1;
      }
    });

    const labels = Object.keys(distribution);
    const values = Object.values(distribution);

    res.send({ data: { labels, values } });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

export default router;
