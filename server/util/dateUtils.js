import { getWeekNumber } from "./workoutUtils.js";

export function getStartDateForRange(range) {
  const now = new Date();
  
  if (range === "1w") {
    const date = new Date(now);
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  
  if (range === "1y") {
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = new Date(currentMonthStart);
    start.setMonth(start.getMonth() - 11);
    return start;
  }

  // Weekly buckets (1m, 3m, 6m)
  let weeksCount = 12; // Default 3m
  if (range === "1m") weeksCount = 5;
  if (range === "6m") weeksCount = 26;

  const currentMonday = new Date(now);
  const day = currentMonday.getDay() || 7;
  currentMonday.setDate(currentMonday.getDate() - (day - 1));
  currentMonday.setHours(0, 0, 0, 0);

  const start = new Date(currentMonday);
  start.setDate(start.getDate() - ((weeksCount - 1) * 7));
  return start;
}

export function generateTimeBuckets(range) {
  const now = new Date();
  const buckets = [];

  if (range === "1w") {
    // Daily buckets for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      buckets.push({ start: d, end, label: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: 0 });
    }
  } else if (range === "1y") {
    // Monthly buckets for last 12 months
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      const start = new Date(currentMonthStart);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      buckets.push({ start, end, label: start.toLocaleDateString('en-US', { month: 'short' }), hours: 0 });
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
      buckets.push({ start, end, label: `Week ${getWeekNumber(start)}`, hours: 0 });
    }
  }
  return buckets;
}
