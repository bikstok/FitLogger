<script>
	let exercises = $state([]);
	let error = $state(null);
	let loading = $state(true);

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
</script>

<div class="page">
	<h1>Exercises</h1>

	{#if loading}
		<p class="loading">Loading exercises...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if exercises.length === 0}
		<p>No exercises found.</p>
	{:else}
		<div class="grid">
			{#each exercises as exercise (exercise.id)}
				<div class="card">
					{#if exercise.image_url}
						<img src={exercise.image_url} alt={exercise.name} />
					{:else}
						<div class="placeholder">No Image</div>
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

	img, .placeholder {
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