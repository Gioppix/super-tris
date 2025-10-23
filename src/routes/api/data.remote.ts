import { command } from '$app/server';
import {
    CreateGame,
    GAMES,
    JoinGame,
    MakeMove,
    player_2_join_game,
    try_make_move
} from '$lib/server/game';

export const create_game = command(CreateGame, (create_game): string => {
    const id = crypto.randomUUID();
    GAMES.set(id, {
        is_temp: true,
        name: create_game.name,
        player1_auth: create_game.auth
    });

    return id;
});

export const join_game = command(JoinGame, (join_game: JoinGame): boolean => {
    return player_2_join_game(join_game);
});

export const make_move = command(MakeMove, (move: MakeMove): boolean => {
    const game = GAMES.get(move.game_id);

    if (!game || game.is_temp) {
        return false;
    }

    return try_make_move(move.game_id, game, move.auth, move.x, move.y);
});
