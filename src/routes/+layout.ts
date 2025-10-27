import { auth_client } from '$lib/client';
import { writable } from 'svelte/store';
import type { LayoutLoad } from './$types';

export const prerender = true;
export const ssr = true;

export const load: LayoutLoad = async ({ data }) => {
    const session = auth_client.useSession();
    const session_data = writable(data.initial_session);

    session.subscribe(({ isPending, data }) => {
        if (!isPending) {
            session_data.set(data);
        }
    });

    return {
        session_data
    };
};
