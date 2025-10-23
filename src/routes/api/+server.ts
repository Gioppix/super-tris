import { is_prod } from '$lib/server';
import { GAMES, notify_all } from '$lib/server/game.js';

export function GET() {
    if (is_prod()) {
        return new Response('Unauthorized', { status: 401 });
    }

    notify_all({ type: 'heartbeat' });

    return new Response(JSON.stringify(GAMES.entries().toArray(), null, 4));
}
