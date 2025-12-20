<script>
	import { user } from '../../lib/stores/authStore.js';
	let workouts = $state([]);
	let error = $state(null);
	let loading = $state(true);
	let selectedWorkout = $state(null);

	$effect(() => {
		if (!$user) return;

		async function fetchWorkouts() {
			try {
				const response = await fetch(`http://localhost:8080/api/workouts/${$user.id}`);
				if (!response.ok) {
					throw new Error('Failed to fetch workouts');
				}
				const result = await response.json();
				workouts = result.data;
			} catch (err) {
				error = err.message;
			} finally {
				loading = false;
			}
		}
		fetchWorkouts();
	});

	function formatDate(dateString) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getDuration(start, end) {
		if (!start || !end) return '';
		const diff = new Date(end) - new Date(start);
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) return `${hours}h ${mins}m`;
		return `${mins}m`;
	}

	function getVolume(workout) {
		let total = 0;
		if (workout.workout_exercises) {
			for (const ex of workout.workout_exercises) {
				if (ex.sets) {
					for (const set of ex.sets) {
						total += (set.weight_kg || 0) * (set.reps || 0);
					}
				}
			}
		}
		return total.toLocaleString();
	}

	function openWorkout(workout) {
		selectedWorkout = workout;
	}

	function closeWorkout() {
		selectedWorkout = null;
	}
</script>

{#snippet exerciseList(exercises)}
	{#each exercises as item}
		<div class="exercise-item">
			<div class="exercise-info">
				{#if item.exercises.image_url}
					<video 
						class="thumb" 
						muted 
						loop 
						playsinline
						onmouseenter={(e) => e.target.play()}
						onmouseleave={(e) => e.target.pause()}
					>
						<source src={`/exercise_videos/${item.exercises.image_url}`} type="video/mp4" />
					</video>
				{/if}
				<h3>{item.exercises.name}</h3>
			</div>
			<div class="sets-container">
				{#each item.sets as set}
					<div class="set-badge">
						{set.weight_kg}kg x {set.reps}
					</div>
				{/each}
			</div>
		</div>
	{/each}
{/snippet}

<div class="page">
	<h1>Past Workouts</h1>

	{#if loading}
		<p class="loading">Loading workouts...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if workouts.length === 0}
		<p>No workouts recorded yet.</p>
	{:else}
		<div class="workouts-list">
			{#each workouts as workout (workout.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="workout-card" onclick={() => openWorkout(workout)}>
					<div class="workout-header">
						<div>
							<h2>{workout.title}</h2>
							<span class="date">{formatDate(workout.start_time)}</span>
						</div>
						<div class="workout-stats">
							<div class="stat">
								<span class="stat-label">Duration</span>
								<span class="stat-value">{getDuration(workout.start_time, workout.end_time)}</span>
							</div>
							<div class="stat">
								<span class="stat-label">Volume</span>
								<span class="stat-value">{getVolume(workout)} kg</span>
							</div>
						</div>
					</div>

					<div class="exercises-list">
						{@render exerciseList(workout.workout_exercises.slice(0, 3))}
					</div>
					
					{#if workout.workout_exercises.length > 3}
						<div class="see-more">
							See {workout.workout_exercises.length - 3} more exercises...
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if selectedWorkout}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={closeWorkout}>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<button class="close-btn" onclick={closeWorkout}>&times;</button>
				<div class="modal-header">
					<h2>{selectedWorkout.title}</h2>
					<div class="modal-meta">
						<span>{formatDate(selectedWorkout.start_time)}</span>
						<span>•</span>
						<span>{getDuration(selectedWorkout.start_time, selectedWorkout.end_time)}</span>
						<span>•</span>
						<span>{getVolume(selectedWorkout)} kg</span>
					</div>
				</div>
				<div class="modal-body">
					{@render exerciseList(selectedWorkout.workout_exercises)}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 { text-align: center; margin-bottom: 2rem; }
	.loading, .error { text-align: center; color: #666; }
	.error { color: red; }

	.workout-card {
		background: white;
		border: 1px solid #eee;
		border-radius: 8px;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.workout-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}

	.workout-header {
		background: #f9f9f9;
		padding: 1rem;
		border-bottom: 1px solid #eee;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.workout-header h2 { margin: 0; font-size: 1.25rem; color: #333; }
	.date { color: #666; font-size: 0.9rem; }

	.workout-stats {
		display: flex;
		gap: 1rem;
		text-align: right;
	}

	.stat { display: flex; flex-direction: column; }
	.stat-label { font-size: 0.75rem; color: #888; text-transform: uppercase; }
	.stat-value { font-weight: 600; color: #4f46e5; font-size: 0.95rem; }

	.exercise-item {
		padding: 1rem;
		border-bottom: 1px solid #f0f0f0;
	}
	.exercise-item:last-child { border-bottom: none; }

	.exercise-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
	.exercise-info h3 { margin: 0; font-size: 1.1rem; color: #333; }
	
	.thumb { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: #eee; }

	.sets-container { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-left: 3.5rem; }
	.set-badge {
		background: #eef2ff; color: #4f46e5; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; font-weight: 500;
	}

	.see-more {
		padding: 0.8rem;
		text-align: center;
		background: #fcfcfc;
		color: #666;
		font-size: 0.9rem;
		font-weight: 500;
		border-top: 1px solid #eee;
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0; left: 0; width: 100%; height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 10px 25px rgba(0,0,0,0.2);
	}

	.close-btn {
		position: absolute;
		top: 1rem; right: 1rem;
		background: none; border: none;
		font-size: 1.5rem; cursor: pointer; color: #666;
	}

	.modal-header { padding: 1.5rem; border-bottom: 1px solid #eee; }
	.modal-header h2 { margin: 0 0 0.5rem 0; }
	.modal-meta { color: #666; font-size: 0.9rem; display: flex; gap: 0.5rem; }
	.modal-body { padding: 0; }

</style>
