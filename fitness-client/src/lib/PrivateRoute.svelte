<script>
  import { Route, navigate } from 'svelte-routing';
  import { user } from './stores/authStore.js';

  export let path;
  export let exact = false;

  $: if (typeof window !== 'undefined' && path) {
    const pathname = window.location.pathname || '';
    const matches = exact ? pathname === path : pathname.startsWith(path);
    if (matches && $user === null) {
      navigate('/login');
    }
  }
</script>

<Route {path} {exact}>
  {#if $user !== undefined && $user !== null}
    <slot />
  {/if}
</Route>


