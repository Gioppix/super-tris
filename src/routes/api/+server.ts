import { is_prod } from '$lib/server';
import { notify_all } from '$lib/server/game.js';
import { db } from '$lib/server/database.js';

export async function GET() {
    if (is_prod()) {
        return new Response('Unauthorized', { status: 401 });
    }

    await notify_all({ type: 'heartbeat' });

    // Fetch all games from database for debugging
    const result = await db.query(`
        SELECT g.*,
               COALESCE(m.moves, '[]') as moves
        FROM game g
        LEFT JOIN LATERAL (
            SELECT json_agg(
            to_json(move)
                ORDER BY move.created_at
            ) as moves
            FROM move
            WHERE move.game_id = g.game_id
        ) m ON true
        ORDER BY g.created_at DESC
	`);

    return new Response(JSON.stringify(result.rows, null, 4));
}
