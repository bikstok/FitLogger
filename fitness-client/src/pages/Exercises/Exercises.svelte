<script>
	let exercises = $state([]);
	let error = $state(null);
	let loading = $state(true);
	let searchQuery = $state("");
	let selectedMuscleGroup = $state("");
	let selectedEquipment = $state("");

	$effect(() => {
		async function fetchExercises() {
			try {
				// Fetching from the backend API
				const response = await fetch('http://localhost:8080/api/exercises');
				
				if (!response.ok) {
					throw new Error('Failed to fetch exercises');
				}

				const result = await response.json();
				exercises = result.data;
			} catch (err) {
				error = err.message;
			} finally {
				loading = false;
			}
		}

		fetchExercises();
	});

	let muscleGroups = $derived(
		[...new Set(exercises.map((e) => e.primary_muscle_group))].sort()
	);

	let equipmentList = $derived(
		[...new Set(exercises.map((e) => e.equipment))].sort()
	);

	let filteredExercises = $derived(
		exercises.filter((exercise) => {
			const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesGroup = selectedMuscleGroup === "" || exercise.primary_muscle_group === selectedMuscleGroup;
			const matchesEquipment = selectedEquipment === "" || exercise.equipment === selectedEquipment;
			return matchesSearch && matchesGroup && matchesEquipment;
		})
	);
</script>

<div class="page">
	<h1>Exercises</h1>

	<div class="search-container">
		<input 
			type="text" 
			placeholder="Search exercises..." 
			bind:value={searchQuery} 
		/>
		<select bind:value={selectedMuscleGroup}>
			<option value="">All Muscle Groups</option>
			{#each muscleGroups as group}
				<option value={group}>{group}</option>
			{/each}
		</select>
		<select bind:value={selectedEquipment}>
			<option value="">All Equipment</option>
			{#each equipmentList as item}
				<option value={item}>{item}</option>
			{/each}
		</select>
	</div>

	{#if loading}
		<p class="loading">Loading exercises...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if filteredExercises.length === 0}
		<p>No exercises found.</p>
	{:else}
		<div class="grid">
			{#each filteredExercises as exercise (exercise.id)}
				<div class="card">
					{#if exercise.image_url}
						<video controls muted loop autoplay playsinline>
							<source src={`/exercise_videos/${exercise.image_url}`} type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					{:else}
						<div class="placeholder">No Video</div>
					{/if}
					<div class="details">
						<h2>{exercise.name}</h2>
						<p><strong>Equipment:</strong> {exercise.equipment}</p>
						<p><strong>Primary:</strong> {exercise.primary_muscle_group}</p>
						{#if exercise.secondary_muscle_group}
							<p><strong>Secondary:</strong> {exercise.secondary_muscle_group}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
	}

	.search-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	input, select {
		padding: 0.8rem;
		width: 100%;
		max-width: 400px;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.card {
		border: 1px solid #eee;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		transition: transform 0.2s;
		background: white;
	}

	.card:hover {
		transform: translateY(-2px);
	}

	video, .placeholder {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.placeholder {
		background-color: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
	}

	.details {
		padding: 1rem;
	}

	h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		color: #666;
	}

	p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
		color: #555;
	}

	.error {
		color: red;
		text-align: center;
	}
	
	.loading {
		text-align: center;
		color: #666;
	}
</style>