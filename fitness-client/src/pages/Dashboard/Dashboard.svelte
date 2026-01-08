<script>
    import { onMount, tick } from 'svelte';
    import { user } from '../../lib/stores/authStore.js';
    import Chart from 'chart.js/auto';
    import toastr from 'toastr';
    import { fetchGet } from '../../util/fetchUtil.js';

    let barChartCanvas;
    let pieChartCanvas;
    let barChart;
    let pieChart;
    let loading = $state(true);
    let timeRange = $state("3m");

    const rangeOptions = [
        { value: "1w", label: "1W" },
        { value: "1m", label: "1M" },
        { value: "3m", label: "3M" },
        { value: "6m", label: "6M" },
        { value: "1y", label: "1Y" }
    ];

    async function loadDurationStats() {
        if (!$user) return;
        const res = await fetchGet(`/api/stats/weekly-duration/${$user.id}?range=${timeRange}`);
        
        if (!res.error && barChart) {
            barChart.data.labels = res.data.map(d => d.label);
            barChart.data.datasets[0].data = res.data.map(d => d.hours);
            barChart.update();
        }
    }

    onMount(async () => {
        if (!$user) return;

        try {
            const [durationRes, muscleRes] = await Promise.all([
                fetchGet(`/api/stats/weekly-duration/${$user.id}?range=${timeRange}`),
                fetchGet(`/api/stats/muscle-distribution/${$user.id}`)
            ]);

            if (!durationRes.error && !muscleRes.error) {
                loading = false;
                await tick();
                renderBarChart(durationRes.data);
                renderPieChart(muscleRes.data);
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
                        text: 'Workout Duration'
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
                    <div class="chart-header">
                        <div class="range-controls">
                            {#each rangeOptions as option}
                                <button 
                                    class="range-btn" 
                                    class:active={timeRange === option.value}
                                    onclick={() => { timeRange = option.value; loadDurationStats(); }}
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>
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
    .chart-wrapper { position: relative; height: 400px; width: 100%; display: flex; flex-direction: column; }

    .chart-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10px;
        z-index: 10;
    }

    .range-controls {
        display: flex;
        background: #f3f4f6;
        padding: 4px;
        border-radius: 8px;
        gap: 2px;
    }

    .range-btn {
        background: none;
        border: none;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
    }

    .range-btn:hover { color: #374151; }
    .range-btn.active { background: white; color: #4f46e5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    
    :global(body.dark-mode) .range-controls { background: #374151; }
    :global(body.dark-mode) .range-btn { color: #9ca3af; }
    :global(body.dark-mode) .range-btn.active { background: #4b5563; color: #fff; }
</style>
