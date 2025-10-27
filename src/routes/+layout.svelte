<script lang="ts">
    import '../app.css';
    import favicon from '$lib/assets/favicon.svg';
    import Header from './Header.svelte';
    import { auth_client } from '$lib/client';
    import Auth from '$lib/components/Auth.svelte';

    let { children } = $props();

    const session = auth_client.useSession();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh w-dvw flex-col bg-gray-900 text-white">
    <Header />
    <div class="">
        {#if $session.data?.user.id}
            {@render children?.()}
        {:else}
            <div class="flex h-full flex-col items-center justify-center">
                <Auth />
            </div>
        {/if}
    </div>
</div>
