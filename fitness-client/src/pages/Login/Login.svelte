<script>
  import { navigate } from "svelte-routing";
  import toastr from "toastr";
  import { loadSession } from '../../lib/stores/authStore.js';

  let email = "";
  let password = "";

  async function handleLogin() {
    if (!email || !password) {
      toastr.error("Both fields are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toastr.error(data.error || "Login failed");
        return;
      }
      // Refresh auth state so protected routes render immediately
      await loadSession();
      navigate("/dashboard");
      toastr.success("Logged in!");

    } catch (err) {
      console.error(err);
      toastr.error("Network error");
    }
  }
</script>

<main>
  <h1>Login</h1>

  <form on:submit|preventDefault={handleLogin}>
    <label>
      Email:
      <input type="email" bind:value={email} placeholder="Enter email" />
    </label>

    <label>
      Password:
      <input type="password" bind:value={password} placeholder="Enter password" />
    </label>

    <button type="submit">Login</button>
  </form>
</main>

<style>
  main {
    max-width: 400px;
    margin: 3em auto;
    padding: 2em;
    border: 1px solid #ccc;
    border-radius: 1em;
    text-align: center;
  }

  input {
    width: 100%;
    margin-bottom: 1em;
    padding: 0.5em;
    font-size: 1em;
  }

  button {
    padding: 0.7em 1.5em;
    font-size: 1em;
    cursor: pointer;
  }

  button:hover {
    background-color: #646cffaa;
    color: white;
  }

  label {
    display: block;
    text-align: left;
    margin-bottom: 0.5em;
  }
</style>
