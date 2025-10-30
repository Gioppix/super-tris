import { can_make_move, is_game_completed, is_in_game, type MegaTris } from '$lib/logic';
import { z } from 'zod';
import type { ChatMessage, ChatMessageWithNames, CloseReason, Message } from './messages';
import { HEARTBEAT_BASE_MS } from '$lib';
import {
    get_name,
    create_game,
    get_game,
    update_game_player2,
    update_rematch_proposal,
    update_rematch_game_id,
    get_moves,
    insert_move,
    get_messages,
    insert_message,
    type Message as DbMessage
} from './database';

console.log('init backend');

let CLIENTS: Map<number, Client[]> = new Map();

// Helper to convert DB messages to ChatMessage
const to_chat_message = (db_message: DbMessage): ChatMessage => {
    return {
        content: db_message.content,
        user_id: db_message.user_id,
        timestamp: db_message.timestamp
    };
};

export const create_client_request = async (game_id: number, client: Client) => {
    const game = await get_game(game_id);

    if (!game) {
        close_client(client, 'game_not_found');
        return;
    }

    // Only allow owners and guests (if game not started)
    if (is_in_game(game, client.user_id) || !game.player2_id) {
        let current_clients = CLIENTS.get(game_id) ?? [];
        current_clients.push(client);
        CLIENTS.set(game_id, current_clients);

        notify(game_id, { type: 'game_state', game_state: game });
        check_presence(game_id);

        const db_messages = await get_messages(game_id);
        const messages = db_messages.map(to_chat_message);
        notify(game_id, {
            type: 'chat_messages',
            messages: await add_names_to_messages(messages)
        });
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

export const client_left = (stream_id: string, game_id: number) => {
    const clients = CLIENTS.get(game_id);
    if (clients) {
        CLIENTS.set(
            game_id,
            clients.filter((client) => client.stream.stream_id !== stream_id)
        );
    }
    check_presence(game_id);
};

export const player_2_join_game = async (
    join_game: JoinGame,
    user_id: string
): Promise<boolean> => {
    const game = await get_game(join_game.game_id);

    if (!game || game.player2_id) {
        return false;
    }

    if (user_id == game.player1_id) {
        return false;
    }

    // Update game in database
    await update_game_player2(join_game.game_id, user_id);

    // Remove guest clients when game starts
    const clients = CLIENTS.get(join_game.game_id) ?? [];
    const guests = clients.filter(
        (client) => client.user_id !== game.player1_id && client.user_id !== user_id
    );
    guests.forEach((guest) => {
        close_client(guest, 'game_started_with_others');
    });

    // Fetch updated game and notify
    const game_state = await get_game(join_game.game_id);
    if (!game_state) return false;

    notify(join_game.game_id, { type: 'game_state', game_state });
    check_presence(join_game.game_id);

    return true;
};

export const mouse_move_event = async (user_id: string, move: MouseMove): Promise<boolean> => {
    notify(move.game_id, {
        type: 'mouse_move',
        mouse_move: {
            user_id,
            coods: move.cursor_present ? { x: move.board_x, y: move.board_y } : null
        }
    });

    return true;
};

setInterval(() => {
    notify_all({ type: 'heartbeat' });
}, HEARTBEAT_BASE_MS);

const check_presence = async (game_id: number) => {
    const game = await get_game(game_id);
    if (!game) return;

    const clients = CLIENTS.get(game_id) ?? [];

    const player1_presence = clients.some((client) => client.user_id === game.player1_id);
    const player2_presence = game.player2_id
        ? clients.some((client) => client.user_id === game.player2_id)
        : false;

    notify(game_id, {
        type: 'player_presence',
        player1_presence,
        player2_presence
    });
};

const notify = (game_id: number, message: Message, exclude_user?: string) => {
    const clients = CLIENTS.get(game_id) ?? [];

    clients.forEach((client) => {
        if (exclude_user === client.user_id) {
            return;
        }

        send_message(client, message);
    });
};

const send_message = (client: Client, message: Message) => {
    const data = JSON.stringify(message);
    try {
        client.stream.controller.enqueue(`data: ${data}\n\n`);
    } catch (e) {
        console.error(`Removing client: ${e}`);

        // Remove this client from all games
        for (const [game_id, clients] of CLIENTS.entries()) {
            CLIENTS.set(
                game_id,
                clients.filter((c) => c !== client)
            );
        }
    }
};

export const notify_all = async (message: Message) => {
    // Get all game IDs that have active clients
    const all_game_ids = Array.from(CLIENTS.keys());
    all_game_ids.forEach((game_id) => {
        notify(game_id, message);
    });
};

export const try_make_move = async (
    game_id: number,
    game: Game,
    user_id: string,
    x: number,
    y: number
): Promise<boolean> => {
    if (!game.player2_id) {
        return false;
    }

    if (!can_make_move(game, user_id, x, y)) {
        return false;
    }

    // Insert move into database
    await insert_move(game_id, x, y);

    // Fetch updated game state
    const updated_game = await get_game(game_id);
    if (!updated_game) return false;

    notify(game_id, { type: 'game_state', game_state: updated_game });

    return true;
};

export const handle_rematch = async (
    game_id: number,
    game: Game,
    user_id: string
): Promise<boolean> => {
    if (!game.player2_id) {
        return false;
    }

    if (game.first_rematch_sent_by) {
        // This is an accept
        // Switch sides
        const new_game_id = await create_insert_game(game.name, game.player2_id, game.player1_id);
        await update_rematch_game_id(game_id, new_game_id);
        notify(game_id, { type: 'new_game', game_id: new_game_id });
    } else {
        // This is a proposal
        await update_rematch_proposal(game_id, user_id);

        const updated_game = await get_game(game_id);
        if (!updated_game) return false;

        notify(game_id, { type: 'game_state', game_state: updated_game });
    }

    return true;
};

const add_name_to_message = async (message: ChatMessage): Promise<ChatMessageWithNames> => {
    return {
        ...message,
        name: await get_name(message.user_id)
    } satisfies ChatMessageWithNames;
};

const add_names_to_messages = async (messages: ChatMessage[]): Promise<ChatMessageWithNames[]> => {
    const messages_with_names = await Promise.all(messages.map(add_name_to_message));

    return messages_with_names;
};

export const handle_message = async (game_id: number, user_id: string, content: string) => {
    const db_message = await insert_message(game_id, user_id, content);
    const message = to_chat_message(db_message);

    notify(game_id, { type: 'chat_message', message: await add_name_to_message(message) });
};

export const create_insert_game = async (
    name: string | undefined,
    player1_id: string,
    player2_id?: string
): Promise<number> => {
    const game_id = await create_game(name, player1_id, player2_id);
    return game_id;
};

export const GameId = z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.int().min(0).max(2147483646));
export type GameId = z.infer<typeof GameId>;

export const CreateGame = z.object({
    name: z.string().optional()
});
export type CreateGame = z.infer<typeof CreateGame>;

export const JoinGame = z.object({
    game_id: z.int().positive()
});
export type JoinGame = z.infer<typeof JoinGame>;

export const MakeMove = z.object({
    game_id: z.int().positive(),
    x: z.int().min(0).max(8),
    y: z.int().min(0).max(8)
});
export type MakeMove = z.infer<typeof MakeMove>;

export const SendRematch = z.object({
    game_id: z.int().positive()
});
export type SendRematch = z.infer<typeof SendRematch>;

export const MouseMove = z
    .object({
        game_id: z.int().positive()
    })
    .and(
        z.union([
            z.object({
                cursor_present: z.literal(true),
                board_x: z.number().min(0.0).max(100.0),
                board_y: z.number().min(0.0).max(100.0)
            }),
            z.object({
                cursor_present: z.literal(false)
            })
        ])
    );
export type MouseMove = z.infer<typeof MouseMove>;

export const SendMessage = z.object({
    game_id: z.int().positive(),
    message: z.string().trim().min(1).max(500)
});
export type SendMessage = z.infer<typeof SendMessage>;

export interface Game {
    name?: string;
    player1_id: string;
    player2_id?: string;
    state: MegaTris;
    first_rematch_sent_by?: string;
    rematch_game_id?: number;
}

export interface Client {
    user_id: string;
    stream: {
        stream_id: string;
        controller: ReadableStreamDefaultController<any>;
    };
}
