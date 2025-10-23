import { can_make_move, is_game_completed, type MegaTris } from '$lib/logic';
import { z } from 'zod';
import type { Message } from './messages';
import { HEARTBEAT_INTERVAL_MS } from '$lib';

export const GAMES: Map<string, Game | TempGame> = new Map();
GAMES.set('d3d4dfff-b8d1-41e5-9332-15a6ab6a8835', {
    is_temp: true,
    player1_auth: 'd3d4dfff-b8d1-41e5-9332-15a6ab6a8836'
});

let CLIENTS: Map<string, Client[]> = new Map();

export const create_client = (game_id: string, client: Client) => {
    console.log(game_id, client.auth);

    const clients = CLIENTS.get(game_id) ?? [];
    clients.push(client);
    CLIENTS.set(game_id, clients);

    let matching_games = GAMES.values()
        .filter(
            (g) =>
                g.player1_auth == client.auth || (g.is_temp ? true : g.player2_auth == client.auth)
        )
        .toArray();

    let game = matching_games.at(0);

    if (!game) return;

    notify(game_id, { type: 'ok' });
    notify(game_id, { type: 'game_state', game_state: game });
    check_presence(game_id);
};

export const client_left = (client_id: string, game_id: string) => {
    const clients = CLIENTS.get(game_id);
    if (clients) {
        CLIENTS.set(
            game_id,
            clients.filter((client) => client.stream.id !== client_id)
        );
    }
    check_presence(game_id);
};

export const player_2_join_game = (join_game: JoinGame): boolean => {
    const game = GAMES.get(join_game.game_id);

    if (!game || !game.is_temp) {
        return false;
    }

    if (join_game.auth == game.player1_auth) {
        return false;
    }

    const new_game = {
        is_temp: false,
        player1_auth: game.player1_auth,
        player2_auth: join_game.auth,
        state: { moves: [] },
        name: game.name
    };

    GAMES.set(join_game.game_id, new_game);

    notify(join_game.game_id, { type: 'game_state', game_state: new_game });

    check_presence(join_game.game_id);

    return true;
};

setInterval(() => {
    notify_all({ type: 'heartbeat' });
}, HEARTBEAT_INTERVAL_MS);

const check_presence = (game_id: string) => {
    const game = GAMES.get(game_id);
    if (!game) return;

    const clients = CLIENTS.get(game_id) ?? [];

    const player1_presence = clients.some((client) => client.auth === game.player1_auth);
    const player2_presence = game.is_temp
        ? false
        : clients.some((client) => client.auth === game.player2_auth);

    notify(game_id, {
        type: 'player_presence',
        player1_presence,
        player2_presence
    });
};

export const notify = (game_id: string, message: Message) => {
    const clients = CLIENTS.get(game_id) ?? [];
    const data = JSON.stringify(message);

    clients.forEach((client) => {
        console.log('here!');
        client.stream.controller.enqueue(`data: ${data}\n\n`);
    });

    // controller.close();
};

export const notify_all = (message: Message) => {
    const all_game_ids = Array.from(GAMES.keys());
    all_game_ids.forEach((game_id) => {
        notify(game_id, message);
    });
};

export const try_make_move = (
    game_id: string,
    game: Game,
    auth: string,
    x: number,
    y: number
): boolean => {
    if (game.is_temp) {
        return false;
    }

    if (!can_make_move(game, auth, x, y)) {
        return false;
    }

    game.state.moves.push([x, y]);

    notify(game_id, { type: 'game_state', game_state: game });

    if (is_game_completed(game.state)) {
        notify(game_id, { type: 'game_ended' });
    }

    return true;
};

export const CreateGame = z.object({
    name: z.string().optional(),
    auth: z.string()
});
export type CreateGame = z.infer<typeof CreateGame>;

export const JoinGame = z.object({
    game_id: z.uuidv4(),
    auth: z.string()
});
export type JoinGame = z.infer<typeof JoinGame>;

export const MakeMove = z.object({
    game_id: z.uuidv4(),
    x: z.int().min(0).max(8),
    y: z.int().min(0).max(8),
    auth: z.string()
});
export type MakeMove = z.infer<typeof MakeMove>;

type GameBase = {
    name?: string;
    player1_auth: string;
};

export type TempGame = GameBase & {
    is_temp: true;
};

export type Game = GameBase & {
    is_temp: false;
    state: MegaTris;
    player2_auth: string;
};

export interface Client {
    auth: string;
    stream: {
        id: string;
        controller: ReadableStreamDefaultController<any>;
    };
}
