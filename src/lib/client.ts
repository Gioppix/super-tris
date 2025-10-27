import { createAuthClient } from 'better-auth/svelte';
import { anonymousClient } from 'better-auth/client/plugins';

export const auth_client = createAuthClient({
    plugins: [anonymousClient()]
});

type SessionData = ReturnType<ReturnType<typeof auth_client.useSession>['get']>['data'] | null;
