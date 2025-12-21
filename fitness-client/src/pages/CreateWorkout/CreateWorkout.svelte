<script>
	import { onMount } from 'svelte';
	import { user } from '../../lib/stores/authStore.js';
	import { navigate } from 'svelte-routing';
	import toastr from 'toastr';

	let title = $state("New Workout");
	let startTime = $state("");
	let endTime = $state("");
	let description = $state("");
	
	let availableExercises = $state([]);
	let selectedExercises = $state([]); 
	let selectedExerciseId = $state("");

	onMount(async () => {
		const now = new Date();
		// Adjust for timezone to show correct local time in datetime-local input
		const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
		startTime = localIso;
		
		try {
			const res = await fetch('http://localhost:8080/api/exercises');
			const result = await res.json();
			availableExercises = result.data || [];
		} catch (e) {
			console.error(e);
			toastr.error("Failed to load exercises");
		}

		// Check if we are starting a routine
		const urlParams = new URLSearchParams(window.location.search);
		const routineId = urlParams.get('routineId');
		
		if (routineId) {
			try {
				const res = await fetch(`http://localhost:8080/api/routines/detail/${routineId}`);
				const result = await res.json();
				
				if (res.ok && result.data) {
					const r = result.data;
					title = r.name; // Pre-fill title with routine name
					
					// Map routine exercises to workout exercises format
					selectedExercises = r.routine_exercises.map(re => ({
						exercise_id: re.exercise_id,
						name: re.exercises.name,
						sets: re.routine_sets.map(rs => ({
							weight_kg: rs.target_weight_kg,
							reps: rs.target_reps
						}))
					}));
				}
			} catch (e) {
				toastr.error("Failed to load routine template");
			}
		}
	});

	function addExercise() {
		if (!selectedExerciseId) return;
		const exercise = availableExercises.find(e => e.id == selectedExerciseId);
		if (exercise) {
			selectedExercises = [...selectedExercises, {
				exercise_id: exercise.id,
				name: exercise.name,
				sets: [{ weight_kg: 0, reps: 0 }]
			}];
			selectedExerciseId = "";
		}
	}

	function addSet(exerciseIndex) {
		const exercises = [...selectedExercises];
		const ex = exercises[exerciseIndex];
		// Copy previous set values for convenience
		const lastSet = ex.sets[ex.sets.length - 1];
		const newSet = lastSet ? { ...lastSet } : { weight_kg: 0, reps: 0 };
		
		ex.sets.push(newSet);
		selectedExercises = exercises;
	}

	function removeSet(exerciseIndex, setIndex) {
		const exercises = [...selectedExercises];
		exercises[exerciseIndex].sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
		selectedExercises = exercises;
	}

	function removeExercise(index) {
		selectedExercises = selectedExercises.filter((_, i) => i !== index);
	}

	function updateSet(exIndex, setIndex, field, value) {
		const exercises = [...selectedExercises];
		exercises[exIndex].sets[setIndex][field] = Number(value);
		selectedExercises = exercises;
	}

	async function saveWorkout() {
		if (!$user) {
			toastr.error("You must be logged in");
			return;
		}
		if (!title) {
			toastr.warning("Please enter a title");
			return;
		}
		
		const payload = {
			user_id: $user.id,
			title,
			start_time: new Date(startTime).toISOString(),
			end_time: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
			description,
			exercises: selectedExercises
		};

		try {
			const res = await fetch('http://localhost:8080/api/workouts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (res.ok) {
				toastr.success("Workout saved!");
				navigate('/workouts');
			} else {
				const err = await res.json();
				toastr.error(err.error || "Failed to save");
			}
		} catch (e) {
			toastr.error("Network error");
		}
	}
</script>

<div class="page">
	<h1>Log Workout</h1>
	
	<div class="form-section">
		<div class="form-group">
			<label for="title">Title</label>
			<input id="title" type="text" bind:value={title} placeholder="e.g. Push Day" />
		</div>

		<div class="row">
			<div class="form-group">
				<label for="start">Start Time</label>
				<input id="start" type="datetime-local" bind:value={startTime} />
			</div>
			<div class="form-group">
				<label for="end">End Time</label>
				<input id="end" type="datetime-local" bind:value={endTime} />
			</div>
		</div>
	</div>

	<hr />

	<div class="add-exercise-bar">
		<select bind:value={selectedExerciseId}>
			<option value="">Select Exercise...</option>
			{#each availableExercises as ex}
				<option value={ex.id}>{ex.name}</option>
			{/each}
		</select>
		<button class="btn-primary" onclick={addExercise} disabled={!selectedExerciseId}>Add Exercise</button>
	</div>

	<div class="exercises-list">
		{#each selectedExercises as ex, i}
			<div class="exercise-card">
				<div class="card-header">
					<h3>{ex.name}</h3>
					<button class="btn-icon" onclick={() => removeExercise(i)}>&times;</button>
				</div>
				
				<div class="sets-header">
					<span>Set</span>
					<span>kg</span>
					<span>Reps</span>
					<span></span>
				</div>
				
				{#each ex.sets as set, j}
					<div class="set-row">
						<span class="set-num">{j + 1}</span>
						<input type="number" value={set.weight_kg} oninput={(e) => updateSet(i, j, 'weight_kg', e.target.value)} />
						<input type="number" value={set.reps} oninput={(e) => updateSet(i, j, 'reps', e.target.value)} />
						<button class="btn-icon remove-set" onclick={() => removeSet(i, j)}>&times;</button>
					</div>
				{/each}
				
				<button class="btn-secondary" onclick={() => addSet(i)}>+ Add Set</button>
			</div>
		{/each}
	</div>

	<div class="actions">
		<button class="btn-save" onclick={saveWorkout}>Save Workout</button>
	</div>
</div>

<style>
	.page { max-width: 800px; margin: 0 auto; padding: 1rem; }
	.form-section { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
	.row { display: flex; gap: 1rem; }
	.form-group { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
	input, select { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
	hr { border: 0; border-top: 1px solid #eee; margin: 1.5rem 0; }
	
	.add-exercise-bar { display: flex; gap: 1rem; margin-bottom: 2rem; }
	.add-exercise-bar select { flex: 1; }
	
	.exercise-card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
	.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.card-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
	
	.sets-header, .set-row { display: grid; grid-template-columns: 40px 1fr 1fr 40px; gap: 1rem; align-items: center; margin-bottom: 0.5rem; }
	.sets-header { font-size: 0.85rem; color: #666; font-weight: 600; text-align: center; }
	.set-num { text-align: center; color: #888; }
	
	.btn-primary { background: #4f46e5; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
	.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
	.btn-secondary { background: #eef2ff; color: #4f46e5; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; margin-top: 0.5rem; }
	.btn-save { background: #10b981; color: white; border: none; padding: 1rem 2rem; border-radius: 6px; font-size: 1.1rem; cursor: pointer; width: 100%; }
	.btn-icon { background: none; border: none; font-size: 1.2rem; color: #999; cursor: pointer; }
	.btn-icon:hover { color: #ef4444; }
	
	.actions { margin-top: 2rem; }
</style>