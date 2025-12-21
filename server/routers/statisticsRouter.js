import { Router } from "express";
import supabase from "../util/supabaseUtil.js";
import { getWeekNumber } from "../util/workoutUtils.js";

const router = Router();

router.get("/api/stats/weekly-duration/:userId", async (req, res) => {
  const { userId } = req.params;
  
  // 12 weeks ago from today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (12 * 7));

  try {
    const { data, error } = await supabase
      .from("workouts")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .gte("start_time", startDate.toISOString());

    if (error) throw error;

    // Prepare buckets for last 12 weeks
    const stats = [];
    const now = new Date();
    
    // Align to current week's Monday for cleaner buckets
    const currentMonday = new Date(now);
    const day = currentMonday.getDay() || 7; 
    currentMonday.setDate(currentMonday.getDate() - (day - 1));
    currentMonday.setHours(0,0,0,0);

    // Generate 12 buckets (11 weeks ago + current week)
    for (let i = 11; i >= 0; i--) {
        const start = new Date(currentMonday);
        start.setDate(start.getDate() - (i * 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        
        stats.push({
            start,
            end,
            label: `Week ${getWeekNumber(start)}`,
            hours: 0
        });
    }

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

  try {
    // Join workout_exercises with exercises and filter by user via workouts
    const { data, error } = await supabase
      .from("workout_exercises")
      .select(`
        exercises (
          primary_muscle_group
        ),
        workouts!inner (
          user_id
        )
      `)
      .eq("workouts.user_id", userId);

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
