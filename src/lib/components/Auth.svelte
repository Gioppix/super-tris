<script lang="ts">
    import { auth_client } from '$lib/client';

    let { class: className = '' }: { class?: string } = $props();
</script>

<button
    class="cursor-pointer {className}"
    onclick={async () => {
        await auth_client.signIn.social({
            provider: 'google'
        });
    }}
>
    Sign in with Google
</button>

<button
    class="cursor-pointer {className}"
    onclick={async () => {
        await auth_client.signIn.anonymous();
    }}
>
    Play anonymously
</button>
