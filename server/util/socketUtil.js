import supabase from "./supabaseUtil.js";

export async function emitWorkoutCreated(io, userId, title) {
  if (!io) return;

  try {
    const { data: user } = await supabase
      .from("users")
      .select("user_name")
      .eq("id", userId)
      .single();

    io.emit("workout_created", { title, username: user?.user_name, user_id: userId });
  } catch (error) {
    console.error("Socket emit error:", error);
  }
}

export function emitUserCount(io, count) {
  if (!io) return;
  io.emit("user_count", count);
}