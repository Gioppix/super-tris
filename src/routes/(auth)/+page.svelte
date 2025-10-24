<script lang="ts">
    import { goto } from '$app/navigation';
    import { create_game } from '$lib/data.remote';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();

    async function handle_create_game() {
        let game_id = await create_game({
            name: 'example game'
        });

        goto(`/game/${game_id}`);
    }
</script>

<div class="flex h-full w-full items-center justify-center">
    <button class="cursor-pointer" onclick={handle_create_game}> Create Game </button>
</div>
