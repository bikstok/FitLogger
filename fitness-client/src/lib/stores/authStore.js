import { writable } from "svelte/store";

export const user = writable(undefined);

export async function loadSession() {
  try {
    const res = await fetch("http://localhost:8080/api/session", {
      credentials: "include",
    });

    if (!res.ok) {
      user.set(null);
      return null;
    }

    const data = await res.json();
    if (data && data.user) {
      user.set(data.user);
      return data.user;
    }

    user.set(null);
    return null;
  } catch (err) {
    console.error("Error loading session:", err);
    user.set(null);
    return null;
  }
}

export function clearUser() {
  user.set(null);
}
