import { createAuthClient } from 'better-auth/svelte';
import { anonymousClient } from 'better-auth/client/plugins';

export const auth_client = createAuthClient({
    plugins: [anonymousClient()]
});
