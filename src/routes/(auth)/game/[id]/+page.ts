import { get, readable } from 'svelte/store';
import type { PageLoad } from './$types';
import type { ChatMessageWithNames, Message } from '$lib/server/messages';
import type { Game } from '$lib/server/game';
import { HEARTBEAT_BASE_MS, HEARTBEAT_FRONTEND_MULTIPLIER } from '$lib';
import { goto } from '$app/navigation';
import { is_game_completed } from '$lib/logic';
import { Spring } from 'svelte/motion';

interface GameState {
    game_state: Game | null;
    player1_presence: boolean;
    player2_presence: boolean;
    game_ended: boolean;
    error: string | null;
    chat?: ChatMessageWithNames[];
    opponent_mouse: Spring<{ x: number; y: number }> | null;
}

// This load function is used for realtime; can't be server-side rendered
export const ssr = false;

export const load: PageLoad = async ({ params: { id }, data, parent }) => {
    const initial_game = data.initial_game;
    const parent_data = await parent();

    const overall_state = readable<GameState>(
        {
            game_state: initial_game,
            player1_presence: false,
            player2_presence: false,
            game_ended: false,
            error: initial_game == null ? 'Game not found' : null,
            opponent_mouse: null
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
                        overall_state.game_state && overall_state.game_state.player2_id
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
                        case 'mouse_move':
                            const current_user_id = get(parent_data.session_data)?.user.id;
                            if (message.mouse_move.coods === null || !current_user_id) {
                                // Remove the spring if cursor left the board or the current user is not authenticated
                                return {
                                    ...overall_state,
                                    opponent_mouse: null
                                };
                            } else {
                                // Ignore own moves
                                if (current_user_id === message.mouse_move.user_id) {
                                    return overall_state;
                                }

                                // Update existing spring or create new one
                                if (overall_state.opponent_mouse) {
                                    console.log(
                                        message.mouse_move.coods.x,
                                        message.mouse_move.coods.y
                                    );
                                    overall_state.opponent_mouse.set(message.mouse_move.coods, {
                                        preserveMomentum: 500
                                    });
                                    return overall_state;
                                } else {
                                    console.log('new s', message.mouse_move.coods);
                                    const opponent_mouse = new Spring(message.mouse_move.coods, {
                                        stiffness: 0.05,
                                        damping: 0.4
                                    });

                                    // This is to fix a bug that makes the spring start at 0,0 every time
                                    opponent_mouse.set(message.mouse_move.coods, {
                                        instant: true
                                    });
                                    return {
                                        ...overall_state,
                                        opponent_mouse
                                    };
                                }
                            }
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
