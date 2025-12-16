<script>
	import { user } from '../../lib/stores/authStore.js';
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

<style>
	main {
		max-width: 600px;
		margin: 3rem auto;
		padding: 2rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		text-align: center;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
	}

	h1 {
		color: #2a7ae2;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.05rem;
	}

	a {
		color: #2a7ae2;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>

