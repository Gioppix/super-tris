import { DATABASE_URL } from '$env/static/private';
import { LRUCache } from 'lru-cache';
import { Pool } from 'pg';

export const db = new Pool({
    connectionString: DATABASE_URL
});

export const cache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60,
    // While hosting, RAM is much more expensive than the computation required to clear
    ttlAutopurge: true
});

export const get_name = async (user_id: string) => {
    const cache_key = `user:${user_id}:name`;
    const cached = cache.get(cache_key);
    if (cached) {
        return cached;
    }

    const result = await db.query('SELECT name FROM "user" WHERE id = $1 LIMIT 1', [user_id]);

    const user_record = result.rows[0];

    const name = user_record?.name ?? 'Unknown User';
    cache.set(cache_key, name, { ttl: 1000 * 60 * 5 });
    return name;
};

// Game database functions

export interface Game {
    game_id: number;
    name?: string;
    player1_id: string;
    player2_id?: string;
    first_rematch_sent_by?: string;
    rematch_game_id?: number;
    created_at: Date;
}

export interface Move {
    move_id: number;
    game_id: number;
    x: number;
    y: number;
    created_at: Date;
}

export interface Message {
    message_id: number;
    game_id: number;
    user_id: string;
    content: string;
    timestamp: Date;
}

export const create_game = async (
    name: string | undefined,
    player1_id: string,
    player2_id?: string
): Promise<number> => {
    const result = await db.query(
        `INSERT INTO game (name, player1_id, player2_id)
         VALUES ($1, $2, $3)
         RETURNING game_id`,
        [name ?? null, player1_id, player2_id ?? null]
    );
    return result.rows[0].game_id;
};

export const get_game = async (game_id: number): Promise<Game | null> => {
    const result = await db.query(
        `SELECT game_id, name, player1_id, player2_id, first_rematch_sent_by, rematch_game_id, created_at
         FROM game
         WHERE game_id = $1`,
        [game_id]
    );
    return result.rows[0] ?? null;
};

export const update_game_player2 = async (game_id: number, player2_id: string): Promise<void> => {
    await db.query(
        `UPDATE game
         SET player2_id = $2
         WHERE game_id = $1`,
        [game_id, player2_id]
    );
};

export const update_rematch_proposal = async (game_id: number, user_id: string): Promise<void> => {
    await db.query(
        `UPDATE game
         SET first_rematch_sent_by = $2
         WHERE game_id = $1`,
        [game_id, user_id]
    );
};

export const update_rematch_game_id = async (
    game_id: number,
    rematch_game_id: number
): Promise<void> => {
    await db.query(
        `UPDATE game
         SET rematch_game_id = $2
         WHERE game_id = $1`,
        [game_id, rematch_game_id]
    );
};

export const get_moves = async (game_id: number): Promise<Move[]> => {
    const result = await db.query(
        `SELECT move_id, game_id, x, y, created_at
         FROM move
         WHERE game_id = $1
         ORDER BY move_id ASC`,
        [game_id]
    );
    return result.rows;
};

export const insert_move = async (game_id: number, x: number, y: number): Promise<void> => {
    await db.query(
        `INSERT INTO move (game_id, x, y)
         VALUES ($1, $2, $3)`,
        [game_id, x, y]
    );
};

export const get_messages = async (game_id: number): Promise<Message[]> => {
    const result = await db.query(
        `SELECT message_id, game_id, user_id, content, timestamp
         FROM message
         WHERE game_id = $1
         ORDER BY timestamp ASC`,
        [game_id]
    );
    return result.rows;
};

export const insert_message = async (
    game_id: number,
    user_id: string,
    content: string
): Promise<Message> => {
    const result = await db.query(
        `INSERT INTO message (game_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING message_id, game_id, user_id, content, timestamp`,
        [game_id, user_id, content]
    );
    return result.rows[0];
};
