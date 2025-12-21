<script>
    import { onMount } from 'svelte';
    import { user } from '../../lib/stores/authStore.js';
    import { Link, navigate } from 'svelte-routing';
    import toastr from 'toastr';

    let routines = $state([]);
    let loading = $state(true);

    onMount(async () => {
        if (!$user) return;
        try {
            const res = await fetch(`http://localhost:8080/api/routines/${$user.id}`);
            const result = await res.json();
            if (res.ok) {
                routines = result.data;
            } else {
                toastr.error(result.error);
            }
        } catch (e) {
            toastr.error("Failed to load routines");
        } finally {
            loading = false;
        }
    });

    function startRoutine(routineId) {
        // Navigate to CreateWorkout with the routine ID to pre-fill data
        navigate(`/create-workout?routineId=${routineId}`);
    }
</script>

<div class="page">
    <div class="header">
        <h1>My Routines</h1>
        <Link to="/create-routine" class="btn-primary">Create New Routine</Link>
    </div>

    {#if loading}
        <p>Loading...</p>
    {:else if routines.length === 0}
        <p>No routines found. Create one to get started!</p>
    {:else}
        <div class="grid">
            {#each routines as routine}
                <div class="card">
                    <h2>{routine.name}</h2>
                    {#if routine.description}
                        <p class="desc">{routine.description}</p>
                    {/if}
                    <div class="exercises-preview">
                        {#each routine.routine_exercises as re}
                            <span class="tag">{re.exercises.name}</span>
                        {/each}
                    </div>
                    <button class="btn-start" onclick={() => startRoutine(routine.id)}>Start Workout</button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page { max-width: 800px; margin: 0 auto; padding: 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    h2 { margin: 0 0 0.5rem 0; color: #333; }
    .desc { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    .exercises-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .tag { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; color: #555; }
    .btn-primary { background: #4f46e5; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .btn-start { width: 100%; background: #10b981; color: white; border: none; padding: 0.8rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem; }
    .btn-start:hover { background: #059669; }
</style>