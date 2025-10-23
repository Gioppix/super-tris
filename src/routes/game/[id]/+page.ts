import { readable } from 'svelte/store';
import type { PageLoad } from './$types';
import type { Message } from '$lib/server/messages';
import type { Game, TempGame } from '$lib/server/game';
import { HEARTBEAT_INTERVAL_MS } from '$lib';

interface GameState {
    game_state: Game | TempGame | null;
    player1_presence: boolean;
    player2_presence: boolean;
    game_ended: boolean;
    error: string | null;
}

export const load: PageLoad = ({ params: { id } }) => {
    const stream = new EventSource(`/api/${id}`);

    const overall_state = readable<GameState>(
        {
            game_state: null,
            player1_presence: false,
            player2_presence: false,
            game_ended: false,
            error: null
        },
        (_, update) => {
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
                }, HEARTBEAT_INTERVAL_MS * 1.1);
            };

            reset_heartbeat_timeout();

            stream.onmessage = (event) => {
                console.log('here');
                const message = JSON.parse(event.data) as Message;
                console.log(message);

                update((current_state) => {
                    switch (message.type) {
                        case 'game_state':
                            return { ...current_state, game_state: message.game_state };
                        case 'player_presence':
                            return {
                                ...current_state,
                                player1_presence: message.player1_presence,
                                player2_presence: message.player2_presence
                            };
                        case 'game_ended':
                            return { ...current_state, game_ended: true };
                        case 'ok':
                            return current_state;
                        case 'heartbeat':
                            return current_state;
                        default:
                            ((x: never) => {
                                throw new Error(`Unhandled message type: ${x}`);
                            })(message);
                    }
                });

                reset_heartbeat_timeout();
            };

            stream.onerror = (e) => {
                update((current_state) => ({
                    ...current_state,
                    error: 'Error opening connection'
                }));
                console.error(e);
            };

            return () => {
                if (heartbeat_timeout) {
                    clearTimeout(heartbeat_timeout);
                }
                stream.close();
            };
        }
    );

    return {
        id,
        overall_state
    };
};
