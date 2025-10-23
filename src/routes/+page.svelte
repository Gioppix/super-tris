<script lang="ts">
    import type { PageProps } from './$types';
    import { create_game } from './api/data.remote';

    let { data }: PageProps = $props();

    function handle_create_game() {
        create_game({
            name: 'example game',
            auth: data.auth_token
        });
    }
</script>

<button onclick={handle_create_game}> Create Game </button>
