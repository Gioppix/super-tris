<script lang="ts">
    import '../app.css';
    import Header from './Header.svelte';
    import type { LayoutData } from './$types';

    let { children, data }: { children?: any; data: LayoutData } = $props();

    let session_data = $derived(data.session_data);
</script>

<div class="flex min-h-dvh w-dvw flex-col bg-gray-900 text-white">
    <Header data={$session_data} />
    <div class="flex min-h-0 grow flex-col">
        {@render children?.()}
    </div>
</div>
