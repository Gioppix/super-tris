import { can_make_move, is_game_completed, type MegaTris } from '$lib/logic';
import { z } from 'zod';
import type { CloseReason, Message } from './messages';
import { HEARTBEAT_BASE_MS } from '$lib';

export const GAMES: Map<string, Game | TempGame> = new Map();
GAMES.set('d3d4dfff-b8d1-41e5-9332-15a6ab6a8835', {
    is_draft: true,
    player1_id: 'd3d4dfff-b8d1-41e5-9332-15a6ab6a8836'
});

console.log('init backend');

let CLIENTS: Map<string, Client[]> = new Map();

export const create_client_request = (game_id: string, client: Client) => {
    const game = GAMES.get(game_id);

    if (!game) {
        close_client(client, 'game_not_found');
        return;
    }

    // Only allow owners and guests (if game not started)
    if (
        game.player1_id === client.user_id ||
        (game.is_draft ? true : game.player2_id == client.user_id)
    ) {
        let current_clients = CLIENTS.get(game_id) ?? [];
        current_clients.push(client);
        CLIENTS.set(game_id, current_clients);

        notify(game_id, { type: 'game_state', game_state: game });
        check_presence(game_id);
    } else {
        close_client(client, 'game_already_started');
    }
};

const close_client = (client: Client, reason: CloseReason) => {
    send_message(client, { type: 'closing', reason });
    client.stream.controller.close();

    // Could just check that game but this is to be extra sure
    for (const [game_id, clients] of CLIENTS.entries()) {
        CLIENTS.set(
            game_id,
            clients.filter((c) => c.stream.stream_id !== client.stream.stream_id)
        );
    }
};

export const client_left = (stream_id: string, game_id: string) => {
    const clients = CLIENTS.get(game_id);
    if (clients) {
        CLIENTS.set(
            game_id,
            clients.filter((client) => client.stream.stream_id !== stream_id)
        );
    }
    check_presence(game_id);
};

export const player_2_join_game = (join_game: JoinGame, user_id: string): boolean => {
    const game = GAMES.get(join_game.game_id);

    if (!game || !game.is_draft) {
        return false;
    }

    if (user_id == game.player1_id) {
        return false;
    }

    const new_game: Game = {
        is_draft: false,
        player1_id: game.player1_id,
        player2_id: user_id,
        state: { moves: [] },
        name: game.name
    };

    // Remove guest clients when game starts
    const clients = CLIENTS.get(join_game.game_id) ?? [];
    const guests = clients.filter(
        (client) => client.user_id !== game.player1_id && client.user_id !== user_id
    );
    guests.forEach((guest) => {
        close_client(guest, 'game_started_with_others');
    });

    GAMES.set(join_game.game_id, new_game);

    notify(join_game.game_id, { type: 'game_state', game_state: new_game });

    check_presence(join_game.game_id);

    return true;
};

setInterval(() => {
    notify_all({ type: 'heartbeat' });
}, HEARTBEAT_BASE_MS);

const check_presence = (game_id: string) => {
    const game = GAMES.get(game_id);
    if (!game) return;

    const clients = CLIENTS.get(game_id) ?? [];

    const player1_presence = clients.some((client) => client.user_id === game.player1_id);
    const player2_presence = game.is_draft
        ? false
        : clients.some((client) => client.user_id === game.player2_id);

    notify(game_id, {
        type: 'player_presence',
        player1_presence,
        player2_presence
    });
};

const notify = (game_id: string, message: Message) => {
    const clients = CLIENTS.get(game_id) ?? [];

    clients.forEach((client) => {
        send_message(client, message);
    });
};

const send_message = (client: Client, message: Message) => {
    const data = JSON.stringify(message);
    client.stream.controller.enqueue(`data: ${data}\n\n`);
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
    user_id: string,
    x: number,
    y: number
): boolean => {
    if (game.is_draft) {
        return false;
    }

    if (!can_make_move(game, user_id, x, y)) {
        return false;
    }

    game.state.moves.push([x, y]);

    notify(game_id, { type: 'game_state', game_state: game });

    return true;
};

export const handle_rematch = (game_id: string, game: Game, user_id: string): boolean => {
    if (game.first_rematch_sent_by) {
        // This is an accept
        // Switch sides
        const new_game_id = create_insert_game(game.name, game.player2_id, game.player1_id);
        notify(game_id, { type: 'new_game', game_id: new_game_id });
    } else {
        // This is a proposal
        game.first_rematch_sent_by = user_id;
        notify(game_id, { type: 'game_state', game_state: game });
    }

    return true;
};

export const create_insert_game = (
    name: string | undefined,
    player1_id: string,
    player2_id?: string
): string => {
    const id = crypto.randomUUID();

    if (player2_id) {
        GAMES.set(id, {
            is_draft: false,
            name,
            player1_id,
            player2_id,
            state: { moves: [] }
        });
    } else {
        GAMES.set(id, {
            is_draft: true,
            name,
            player1_id
        });
    }

    return id;
};

export const CreateGame = z.object({
    name: z.string().optional()
});
export type CreateGame = z.infer<typeof CreateGame>;

export const JoinGame = z.object({
    game_id: z.uuidv4()
});
export type JoinGame = z.infer<typeof JoinGame>;

export const MakeMove = z.object({
    game_id: z.uuidv4(),
    x: z.int().min(0).max(8),
    y: z.int().min(0).max(8)
});
export type MakeMove = z.infer<typeof MakeMove>;

export const SendRematch = z.object({
    game_id: z.uuidv4()
});
export type SendRematch = z.infer<typeof SendRematch>;

type GameBase = {
    name?: string;
    player1_id: string;
};

export type TempGame = GameBase & {
    is_draft: true;
};

export type Game = GameBase & {
    is_draft: false;
    state: MegaTris;
    player2_id: string;
    first_rematch_sent_by?: string;
};

export interface Client {
    user_id: string;
    stream: {
        stream_id: string;
        controller: ReadableStreamDefaultController<any>;
    };
}
