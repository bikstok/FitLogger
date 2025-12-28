<script>
  import { Router, Link, Route, navigate } from "svelte-routing";
  import { onMount } from 'svelte';
  import { user, loadSession, clearUser } from './lib/stores/authStore.js';
  import { theme } from './lib/stores/themeStore.js';
  import Register from './pages/Register/Register.svelte';
  import Login from './pages/Login/Login.svelte'; 
  import Dashboard from './pages/Dashboard/Dashboard.svelte';
  import Exercises from './pages/Exercises/Exercises.svelte';
  import Workouts from './pages/Workouts/Workouts.svelte';
  import CreateRoutine from './pages/CreateRoutine/CreateRoutine.svelte';
  import CreateWorkout from './pages/CreateWorkout/CreateWorkout.svelte';
  import MyRoutines from './pages/MyRoutines/MyRoutines.svelte';
  import PrivateRoute from './lib/PrivateRoute.svelte';
  import fitnessLogo from '/fitness_favicon.png';
  import darkModeIcon from './assets/dark_mode.png';
  import lightModeIcon from './assets/light_mode.png';
  import toastr from 'toastr';
  import { fetchPost } from './util/fetchUtil.js';
  import io from "socket.io-client";

  let activeUsers = $state(0);

  async function handleLogout() {
    try {
      const result = await fetchPost("/api/logout", {});

      if (!result.error) {
        toastr.success("Logged out successfully");
        clearUser();
        navigate("/");
      } else {
        toastr.error("Logout failed");
      }
    } catch (err) {
      toastr.error("Network error");
    }
  }

  onMount(() => {
    loadSession();
    theme.init();

    const socket = io("http://localhost:8080", {
      withCredentials: true
    });
    socket.on("user_count", (count) => {
      activeUsers = count;
    });
    socket.on("workout_created", (data) => {
      if ($user?.id === data.user_id) return;
      toastr.info(`${data.username} just finished a workout: ${data.title}`);
    });

    return () => {
      socket.disconnect();
    };
  });
</script>

<Router>
  <header>
    <button class="theme-toggle" on:click={theme.toggle} title="Toggle Dark and Light Mode">
      {#if $theme}
        <img src={lightModeIcon} class="icon" alt="Light Mode Logo" />
      {:else}
        <img src={darkModeIcon} class="icon" alt="Dark Mode Logo" />
      {/if}
    </button>
    <div class="active-users">
      <span class="dot">●</span> {activeUsers} FitLogger Users Online
    </div>
    <div class="nav-container">
      <div class="nav-left">
        <a href="/" class="logo-link">
          <img src={fitnessLogo} class="logo" alt="Fitness Logo" />
        </a>
        <nav>
          {#if $user !== undefined && $user !== null}
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/exercises">Exercises</Link>
            <Link to="/workouts">Workouts</Link>
            <Link to="/my-routines">Routines</Link>
          {:else}
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          {/if}
        </nav>
      </div>
      <div class="logout-button">
        {#if $user !== undefined && $user !== null}
          <button on:click={handleLogout}>Logout</button>
        {/if}
      </div>
    </div>
  </header>

  <main>
    <PrivateRoute path="/dashboard" exact>
      <Dashboard />
    </PrivateRoute>
    <Route path="/exercises"><Exercises /></Route>
    <Route path="/workouts"><Workouts /></Route>
    <Route path="/create-routine"><CreateRoutine /></Route>
    <Route path="/create-workout"><CreateWorkout /></Route>
    <Route path="/my-routines"><MyRoutines /></Route>
    <Route path="/login"><Login /></Route>
    <Route path="/register"><Register /></Route>
    <Route path="/" exact>
      <h1>Welcome to the FitLogger</h1>
      <p>Track your fitness activities with ease!</p>
    </Route>
  </main>
</Router>

<style>
  header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    z-index: 1000;
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1000px;
    margin: 0 auto;
    padding: 0.3em 1em; /* reduced vertical padding */
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 1.5em; /* slightly tighter spacing */
  }

  .logo {
    height: 2.5em; /* smaller logo */
    transition: filter 0.3s;
  }

  .logo:hover {
    filter: drop-shadow(0 0 0.8em #646cffaa);
  }

  .icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  nav {
    display: flex;
    gap: 0.8em; /* tighter spacing between links */
  }

  nav a {
    text-decoration: none;
    color: #646cff;
    font-weight: 500;
    font-size: 0.95rem; /* smaller font */
    padding: 0.3em 0.5em; /* less padding */
    transition: color 0.2s;
  }

  nav a:hover {
    color: #ff3e00;
    text-decoration: underline;
  }

  main {
    margin-top: 4.5em; /* leave less space for thinner header */
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    padding: 2em;
  }

  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    color: #333;
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .active-users {
    position: absolute;
    right: 2rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9rem;
    font-weight: 600;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .dot {
    font-size: 0.8rem;
    animation: pulse 2s infinite;
  }

  /* Global Light Mode Styles (Default) */
  :global(body) {
    background-color: #f3f4f6;
    color: #1f2937;
    margin: 0;
  }

  /* Global Dark Mode Styles */
  :global(body.dark-mode) {
    background-color: #121212;
    color: #e0e0e0;
  }
  :global(body.dark-mode) .theme-toggle {
    color: #fbbf24;
  }
  :global(body.dark-mode) header {
    background-color: #1f2937;
    border-bottom: 1px solid #374151;
  }
  :global(body.dark-mode) .card,
  :global(body.dark-mode) .workout-card,
  :global(body.dark-mode) .exercise-card,
  :global(body.dark-mode) .modal-content,
  :global(body.dark-mode) .stats-container {
    background-color: #1f2937;
    border-color: #374151;
    color: #e0e0e0;
  }
  :global(body.dark-mode) h1, :global(body.dark-mode) h2, :global(body.dark-mode) h3 {
    color: #f3f4f6;
  }
  :global(body.dark-mode) input, :global(body.dark-mode) select {
    background-color: #374151;
    border-color: #4b5563;
    color: white;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
</style>
