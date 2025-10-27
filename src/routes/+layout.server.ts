import { auth } from '$lib/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
    const initial_session = await auth.api.getSession({
        headers: request.headers
    });

    return {
        initial_session
    };
};
