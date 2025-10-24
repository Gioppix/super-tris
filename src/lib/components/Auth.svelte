<script lang="ts">
    import { auth_client } from '$lib/client';
</script>

<button
    class="cursor-pointer"
    onclick={async () => {
        await auth_client.signIn.social({
            provider: 'google'
        });
    }}
>
    Log In with Google
</button>

<button
    class="cursor-pointer"
    onclick={async () => {
        await auth_client.signIn.anonymous();
    }}
>
    Play anonymously
</button>
