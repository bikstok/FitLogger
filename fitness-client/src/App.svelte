<script>
  import { Router, Link, Route, navigate } from "svelte-routing";
  import { onMount } from 'svelte';
  import { user, loadSession, clearUser } from './lib/stores/authStore.js';
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
  import toastr from 'toastr';
  import { fetchPost } from './util/fetchUtil.js';

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
  // Load session once for the whole app so `$user` becomes available
  onMount(() => {
    loadSession();
  });
</script>

<Router>
  <header>
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
    background-color: #c5c7cf;
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
</style>
