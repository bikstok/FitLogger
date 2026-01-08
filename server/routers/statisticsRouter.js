import { Router } from "express";
import supabase from "../util/supabaseUtil.js";
import { getWeekNumber } from "../util/workoutUtils.js";

const router = Router();

router.get("/api/stats/weekly-duration/:userId", async (req, res) => {
  const { userId } = req.params;
  const { range = "3m" } = req.query;

  const now = new Date();
  const stats = [];

  // Generate Buckets based on range
  if (range === "1w") {
    // Daily buckets for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      stats.push({ start: d, end, label: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: 0 });
    }
  } else if (range === "1y") {
    // Monthly buckets for last 12 months
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const start = new Date(currentMonthStart);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      stats.push({ start, end, label: start.toLocaleDateString('en-US', { month: 'short' }), hours: 0 });
    }
  } else {
    // Weekly buckets (1m, 3m, 6m)
    let weeksCount = 12; // Default 3m
    if (range === "1m") weeksCount = 5;
    if (range === "6m") weeksCount = 26;

    const currentMonday = new Date(now);
    const day = currentMonday.getDay() || 7;
    currentMonday.setDate(currentMonday.getDate() - (day - 1));
    currentMonday.setHours(0, 0, 0, 0);

    for (let i = weeksCount - 1; i >= 0; i--) {
      const start = new Date(currentMonday);
      start.setDate(start.getDate() - (i * 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      stats.push({ start, end, label: `Week ${getWeekNumber(start)}`, hours: 0 });
    }
  }

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
