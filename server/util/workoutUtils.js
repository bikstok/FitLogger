export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "";
  const diff = new Date(endTime) - new Date(startTime);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function calculateTotalVolume(workoutExercises) {
  let totalVolume = 0;
  if (workoutExercises) {
    workoutExercises.forEach((ex) => {
      if (ex.sets) {
        ex.sets.forEach((set) => {
          totalVolume += (set.weight_kg || 0) * (set.reps || 0);
        });
      }
    });
  }
  return totalVolume;
}
