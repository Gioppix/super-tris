import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const prerender = false;

// Eventsource must run in browser
export const ssr = false;

export const load: LayoutServerLoad = async ({ cookies }) => {
    let auth_token = cookies.get('auth');

    if (!auth_token) {
        auth_token = crypto.randomUUID();
        cookies.set('auth', auth_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: env.PRODUCTION !== 'false',
            maxAge: 60 * 60 * 24 * 365
        });
    }

    return {
        auth_token
    };
};
