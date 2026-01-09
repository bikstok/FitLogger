<script>
    import { user } from "../../lib/stores/authStore.js";
    import { fetchDelete } from "../../util/fetchUtil.js";
    import toastr from "toastr";

    async function deleteAllWorkouts() {
        if (!confirm("Are you sure you want to delete ALL your workouts? This action cannot be undone.")) {
            return;
        }

        const result = await fetchDelete(`/api/workouts/all/${$user.id}`);
        
        if (result.error) {
            toastr.error(result.error);
        } else {
            toastr.success("All workouts deleted successfully");
        }
    }
</script>

<div class="page">
    <h1>Profile</h1>
    
    {#if $user}
        <div class="profile-card">
            <div class="info-group">
                <label for="username">Username</label>
                <p id="username">{$user.username}</p>
            </div>
            <div class="info-group">
                <label for="email">Email</label>
                <p id="email">{$user.email}</p>
            </div>
            <div class="danger-zone">
                <p>Deleting all workouts is permanent and cannot be recovered.</p>
                <button class="btn-danger" onclick={deleteAllWorkouts}>Delete All Workouts</button>
            </div>
        </div>
    {:else}
        <p>Loading profile...</p>
    {/if}
</div>

<style>
    .page { max-width: 600px; margin: 0 auto; padding: 2rem; }
    .profile-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee; }
    
    .info-group { margin-bottom: 1.5rem; }
    .info-group label { display: block; font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
    .info-group p { font-size: 1.125rem; color: #1f2937; font-weight: 500; margin: 0; }
    
    .danger-zone { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #fee2e2; }
    .danger-zone h3 { color: #dc2626; margin: 0 0 0.5rem 0; }
    .danger-zone p { color: #7f1d1d; font-size: 0.9rem; margin-bottom: 1rem; }
    
    .btn-danger { background-color: #dc2626; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-danger:hover { background-color: #b91c1c; }
    
    :global(body.dark-mode) .profile-card { background: #1f2937; border-color: #374151; }
    :global(body.dark-mode) .info-group p { color: #f3f4f6; }
    :global(body.dark-mode) .info-group label { color: #9ca3af; }
    :global(body.dark-mode) .danger-zone { border-color: #7f1d1d; }
</style>
