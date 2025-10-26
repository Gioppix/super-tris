import { command, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
    create_insert_game,
    CreateGame,
    handle_message,
    handle_rematch,
    JoinGame,
    MakeMove,
    player_2_join_game,
    SendMessage,
    SendRematch,
    try_make_move
} from '$lib/server/game';
import { get_game, get_moves } from '$lib/server/database';
import { is_in_game } from './logic';

/**
 * Can **ONLY** be used inside server hooks, server load functions, actions, and endpoints (and functions called by them).
 */
const get_user_id = async () => {
    const req = getRequestEvent();
    const session = await auth.api.getSession({ headers: req.request.headers });

    return session?.user.id;
};

export const create_game = command(CreateGame, async (create_game): Promise<number | null> => {
    let user_id = await get_user_id();
    if (!user_id) return null;

    return create_insert_game(create_game.name, user_id);
});

export const join_game = command(JoinGame, async (join_game: JoinGame): Promise<boolean> => {
    let user_id = await get_user_id();
    if (!user_id) return false;

    return player_2_join_game(join_game, user_id);
});

export const make_move = command(MakeMove, async (move: MakeMove): Promise<boolean> => {
    let user_id = await get_user_id();
    if (!user_id) return false;

    const game = await get_game(move.game_id);

    if (!game || !game.player2_id) {
        return false;
    }

    const moves = await get_moves(move.game_id);
    const game_with_state = {
        name: game.name,
        player1_id: game.player1_id,
        player2_id: game.player2_id,
        state: {
            moves: moves.map((m) => [m.x, m.y] as [number, number])
        },
        first_rematch_sent_by: game.first_rematch_sent_by,
        rematch_game_id: game.rematch_game_id
    };

    if (!is_in_game(game_with_state, user_id)) {
        return false;
    }

    return try_make_move(move.game_id, game_with_state, user_id, move.x, move.y);
});

export const send_rematch = command(SendRematch, async (rematch: SendRematch): Promise<boolean> => {
    let user_id = await get_user_id();
    if (!user_id) return false;

    const game = await get_game(rematch.game_id);

    if (!game || !game.player2_id) {
        return false;
    }

    const moves = await get_moves(rematch.game_id);
    const game_with_state = {
        name: game.name,
        player1_id: game.player1_id,
        player2_id: game.player2_id,
        state: {
            moves: moves.map((m) => [m.x, m.y] as [number, number])
        },
        first_rematch_sent_by: game.first_rematch_sent_by,
        rematch_game_id: game.rematch_game_id
    };

    if (!is_in_game(game_with_state, user_id)) {
        return false;
    }

    return handle_rematch(rematch.game_id, game_with_state, user_id);
});

export const send_message = command(SendMessage, async (message: SendMessage): Promise<boolean> => {
    let user_id = await get_user_id();
    if (!user_id) return false;

    const game = await get_game(message.game_id);

    if (!game) {
        return false;
    }

    // For games without player2, anyone can send messages
    // For started games, only players can send messages
    if (game.player2_id) {
        const moves = await get_moves(message.game_id);
        const game_with_state = {
            name: game.name,
            player1_id: game.player1_id,
            player2_id: game.player2_id,
            state: {
                moves: moves.map((m) => [m.x, m.y] as [number, number])
            }
        };

        if (!is_in_game(game_with_state, user_id)) {
            return false;
        }
    }

    await handle_message(message.game_id, user_id, message.message);

    return true;
});
