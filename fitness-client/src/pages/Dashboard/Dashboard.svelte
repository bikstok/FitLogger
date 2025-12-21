<script>
    import { onMount, tick } from 'svelte';
    import { user } from '../../lib/stores/authStore.js';
    import Chart from 'chart.js/auto';
    import toastr from 'toastr';

    let chartCanvas;
    let chart;
    let loading = $state(true);

    onMount(async () => {
        if (!$user) return;

        try {
            const res = await fetch(`http://localhost:8080/api/stats/weekly-duration/${$user.id}`);
            const result = await res.json();

            if (res.ok) {
                loading = false;
                await tick();
                renderChart(result.data);
            } else {
                toastr.error("Failed to load stats");
                loading = false;
            }
        } catch (e) {
            console.error(e);
            toastr.error("Network error");
            loading = false;
        }
    });

    function renderChart(data) {
        if (!chartCanvas) return;
        
        const ctx = chartCanvas.getContext('2d');
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.label),
                datasets: [{
                    label: 'Hours Worked Out',
                    data: data.map(d => d.hours),
                    backgroundColor: '#4f46e5',
                    borderRadius: 4,
                    hoverBackgroundColor: '#4338ca'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Weekly Workout Duration (Last 12 Weeks)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }
</script>

<main>
	{#if $user === undefined}
		<p>Checking session…</p>
	{:else if $user === null}
		<h1>Not logged in</h1>
		<p>
			<a href="/login">Go to Login</a>
		</p>
	{:else}
		<h1>Logged in successfully</h1>
		<p>Your user id: <strong>{$user.id}</strong></p>
	{/if}
</main>

<div class="page">
    <h1>Dashboard</h1>
    
    <div class="stats-container">
        {#if loading}
            <p>Loading statistics...</p>
        {:else}
            <div class="chart-wrapper">
                <canvas bind:this={chartCanvas}></canvas>
            </div>
        {/if}
    </div>
</div>

<style>
    .page { max-width: 1000px; margin: 0 auto; padding: 1rem; }
    .stats-container { background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .chart-wrapper { position: relative; height: 400px; width: 100%; }
</style>
