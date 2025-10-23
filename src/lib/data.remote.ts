import { command, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import {
    CreateGame,
    GAMES,
    JoinGame,
    MakeMove,
    player_2_join_game,
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

    const id = crypto.randomUUID();
    GAMES.set(id, {
        is_draft: true,
        name: create_game.name,
        player1_id: user_id
    });

    return id;
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
