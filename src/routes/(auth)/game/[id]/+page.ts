import { readable } from 'svelte/store';
import type { PageLoad } from './$types';
import type { ChatMessageWithNames, Message } from '$lib/server/messages';
import type { Game, TempGame } from '$lib/server/game';
import { HEARTBEAT_BASE_MS, HEARTBEAT_FRONTEND_MULTIPLIER } from '$lib';
import { goto } from '$app/navigation';
import { is_game_completed } from '$lib/logic';

interface GameState {
    game_state: Game | TempGame | null;
    player1_presence: boolean;
    player2_presence: boolean;
    game_ended: boolean;
    error: string | null;
    chat?: ChatMessageWithNames[];
}

export const load: PageLoad = ({ params: { id } }) => {
    const overall_state = readable<GameState>(
        {
            game_state: null,
            player1_presence: false,
            player2_presence: false,
            game_ended: false,
            error: null
        },
        (_, update) => {
            const stream = new EventSource(`/api/${id}`);

            let heartbeat_timeout: ReturnType<typeof setTimeout> | null = null;

            const reset_heartbeat_timeout = () => {
                if (heartbeat_timeout) {
                    clearTimeout(heartbeat_timeout);
                }
                heartbeat_timeout = setTimeout(() => {
                    update((current_state) => ({
                        ...current_state,
                        error: 'Connection timeout: no heartbeat received'
                    }));
                }, HEARTBEAT_BASE_MS * HEARTBEAT_FRONTEND_MULTIPLIER);
            };

            reset_heartbeat_timeout();
            const stop = () => {
                if (heartbeat_timeout) {
                    clearTimeout(heartbeat_timeout);
                }
                stream.close();
            };

            stream.onmessage = (event) => {
                const message = JSON.parse(event.data) as Message;

                update((overall_state) => {
                    overall_state.game_ended =
                        overall_state.game_state && !overall_state.game_state.is_draft
                            ? is_game_completed(overall_state.game_state.state)
                            : false;

                    switch (message.type) {
                        case 'game_state':
                            return { ...overall_state, game_state: message.game_state };
                        case 'player_presence':
                            return {
                                ...overall_state,
                                player1_presence: message.player1_presence,
                                player2_presence: message.player2_presence
                            };
                        case 'ok':
                            return overall_state;
                        case 'heartbeat':
                            reset_heartbeat_timeout();
                            return overall_state;
                        case 'closing':
                            stop();
                            return { ...overall_state, error: message.reason };
                        case 'new_game':
                            goto(`/game/${message.game_id}`);
                            return overall_state;
                        case 'chat_messages':
                            return { ...overall_state, chat: message.messages };
                        case 'chat_message':
                            return {
                                ...overall_state,
                                chat: [...(overall_state.chat ?? []), message.message]
                            };
                        default:
                            ((x: never) => {
                                throw new Error(`Unhandled message type: ${x}`);
                            })(message);
                    }
                });
            };

            stream.onerror = (e) => {
                update((current_state) => ({
                    ...current_state,
                    error: 'Error opening connection'
                }));
                console.error(e);
            };

            return stop;
        }
    );

    return {
        game_id: id,
        overall_state
    };
};
