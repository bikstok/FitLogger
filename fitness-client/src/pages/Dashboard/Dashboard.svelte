<script>
    import { onMount, tick } from 'svelte';
    import { user } from '../../lib/stores/authStore.js';
    import Chart from 'chart.js/auto';
    import toastr from 'toastr';

    let barChartCanvas;
    let pieChartCanvas;
    let barChart;
    let pieChart;
    let loading = $state(true);

    onMount(async () => {
        if (!$user) return;

        try {
            const [weeklyRes, muscleRes] = await Promise.all([
                fetch(`http://localhost:8080/api/stats/weekly-duration/${$user.id}`),
                fetch(`http://localhost:8080/api/stats/muscle-distribution/${$user.id}`)
            ]);

            if (weeklyRes.ok && muscleRes.ok) {
                const weeklyData = await weeklyRes.json();
                const muscleData = await muscleRes.json();
                
                loading = false;
                await tick();
                renderBarChart(weeklyData.data);
                renderPieChart(muscleData.data);
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

    function renderBarChart(data) {
        if (!barChartCanvas) return;
        
        const ctx = barChartCanvas.getContext('2d');
        barChart = new Chart(ctx, {
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

    function renderPieChart(data) {
        if (!pieChartCanvas) return;

        const ctx = pieChartCanvas.getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
                        '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Muscle Group Distribution'
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
            <div class="charts-grid">
                <div class="chart-wrapper">
                    <canvas bind:this={barChartCanvas}></canvas>
                </div>
                <div class="chart-wrapper">
                    <canvas bind:this={pieChartCanvas}></canvas>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .page { max-width: 1000px; margin: 0 auto; padding: 1rem; }
    .stats-container { background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    
    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }
    .chart-wrapper { position: relative; height: 400px; width: 100%; }
</style>
