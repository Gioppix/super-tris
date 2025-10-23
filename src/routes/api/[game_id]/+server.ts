import { client_left, create_client, GAMES } from '$lib/server/game.js';

export function GET({ params: { game_id }, cookies }) {
    const auth = cookies.get('auth');
    if (!auth) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (GAMES.get(game_id) === undefined) {
        return new Response('Game not found', { status: 404 });
    }

    const id = crypto.randomUUID();

    const stream = new ReadableStream({
        start(controller) {
            create_client(game_id, {
                auth,
                stream: {
                    controller,
                    id
                }
            });
        },
        cancel() {
            client_left(id, game_id);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
    });
}
