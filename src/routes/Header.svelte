<script lang="ts">
    import { auth_client } from '$lib/client';

    let {
        data
    }: { data: ReturnType<ReturnType<typeof auth_client.useSession>['get']>['data'] | null } =
        $props();
</script>

<div class="bg-gray-700 p-2">
    <div class="flex justify-between">
        <a class="text-xl font-bold text-blue-400" href="/">Super Tris</a>

        <div>
            {#if data?.user}
                <div class="flex gap-2">
                    <p>
                        {data.user.name}
                    </p>
                    <button
                        class="cursor-pointer underline"
                        onclick={async () => {
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
