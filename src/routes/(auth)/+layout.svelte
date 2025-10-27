<script lang="ts">
    import Auth from '$lib/components/Auth.svelte';
    import type { LayoutData } from './$types';

    let { children, data }: { children?: any; data: LayoutData } = $props();
    let session_data = $derived(data.session_data);
</script>

{#if $session_data?.user.id}
    {@render children?.()}
{:else}
    <div class="flex grow flex-col items-center justify-center">
        <Auth />
    </div>
{/if}
