import { command, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
    create_insert_game,
    CreateGame,
    GAMES,
    handle_rematch,
    JoinGame,
    MakeMove,
    player_2_join_game,
    SendRematch,
    try_make_move
} from '$lib/server/game';

const get_user_id = async () => {
    const req = getRequestEvent();
    const session = await auth.api.getSession({ headers: req.request.headers });

    return session?.user.id;
};

export const create_game = command(CreateGame, async (create_game): Promise<string | null> => {
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

    const game = GAMES.get(move.game_id);

    if (!game || game.is_draft) {
        return false;
    }

    return try_make_move(move.game_id, game, user_id, move.x, move.y);
});

export const send_rematch = command(SendRematch, async (move: SendRematch): Promise<boolean> => {
    let user_id = await get_user_id();
    if (!user_id) return false;

    const game = GAMES.get(move.game_id);

    if (!game || game.is_draft) {
        return false;
    }

    return handle_rematch(move.game_id, game, user_id);
});
