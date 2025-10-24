<script lang="ts">
    import { auth_client } from '$lib/client';
    import Auth from '$lib/components/Auth.svelte';
    const session = auth_client.useSession();
</script>

<div class="bg-gray-700 p-2">
    <div class="flex justify-between">
        <a class="text-lg underline" href="/">Super Tris</a>
        <div>
            {#if $session.data}
                <div class="flex gap-2">
                    <p>
                        {$session.data.user.name}
                    </p>
                    <button
                        class="cursor-pointer underline"
                        on:click={async () => {
                            await auth_client.signOut();
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            {:else}
                Not logged in
            {/if}
        </div>
    </div>
</div>
