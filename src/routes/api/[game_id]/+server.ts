import { client_left, create_client_request } from '$lib/server/game.js';

export function GET({ params: { game_id }, locals }) {
    const stream_id = crypto.randomUUID();
    const game_id_num = parseInt(game_id, 10);

    if (game_id_num < 1 || game_id_num > 2147483647) {
        return new Response('Invalid game ID', { status: 400 });
    }

    const stream = new ReadableStream({
        start(controller) {
            create_client_request(game_id_num, {
                user_id: locals.user_id,
                stream: {
                    controller,
                    stream_id
                }
            });
        },
        cancel() {
            client_left(stream_id, game_id_num);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
    });
}
