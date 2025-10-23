import { auth_client } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    const { data, error } = await auth_client.getSession({});

    if (error || !data) {
        redirect(302, '/');
    }

    return {
        user_id: data.user.id
    };
};
