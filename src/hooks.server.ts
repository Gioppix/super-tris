import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

export async function handle({ event, resolve }) {
    // Fetch current session from Better Auth
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    // Make session and user available on server
    if (session) {
        event.locals.user_id = session.user.id;
    }

    return svelteKitHandler({ event, resolve, auth, building });
}

export function handleError({ error }) {
    console.error(error);
    return { message: 'Something went wrong' };
}
