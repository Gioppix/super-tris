<script lang="ts">
    import type { PageProps } from './$types';
    import PlayerInfo from './PlayerInfo.svelte';
    import GameBoard from './GameBoard.svelte';
    import { join_game, make_move, send_mouse_move, send_rematch } from '$lib/data.remote';
    import { auth_client } from '$lib/client';
    import Chat from './Chat.svelte';
    import { Spring } from 'svelte/motion';

    const session = auth_client.useSession();

    let { data }: PageProps = $props();
    let overall_state = $derived(data.overall_state);

    let session_data = $derived(data.session_data);
    let user_id = $derived.by(() => {
        const user_id = $session_data?.user.id;
        if (!user_id) throw new Error('No user_id');

        return user_id;
    });

    let game_state = $derived($overall_state.game_state);
    let is_draft = $derived(!game_state?.player2_id);
    let is_owner = $derived(game_state?.player1_id === user_id);
    let game_ended = $derived($overall_state.game_ended);
    let error = $derived($overall_state.error);

    let current_player_symbol = $derived.by(() => {
        if (!game_state || !game_state.player2_id || game_ended) return null;
        if (game_state.player1_id === user_id) return 'X' as const;
        if (game_state.player2_id === user_id) return 'O' as const;
        return null;
    });

    let is_player1 = $derived(game_state?.player1_id === user_id);
    let is_player2 = $derived(game_state?.player2_id === user_id);
    let move_count = $derived(game_state?.player2_id ? game_state.state.moves.length : 0);
    let is_player1_turn = $derived(move_count % 2 === 0);
    let is_player_turn = $derived(
        game_state?.player2_id
            ? (is_player1 && is_player1_turn) || (is_player2 && !is_player1_turn)
            : false
    );
    let maybe_mouse = $derived($overall_state.opponent_mouse);

    let game_id_num = $derived(
        typeof data.game_id === 'string' ? parseInt(data.game_id, 10) : data.game_id
    );

    async function handle_move(x: number, y: number) {
        await make_move({
            game_id: game_id_num,
            x,
            y
        });
    }

    async function handle_join() {
        await join_game({
            game_id: game_id_num
        });
    }

    let copy_button_text = $state<'Copy' | 'Copied!'>('Copy');
    let copy_timer: ReturnType<typeof setTimeout> | null = null;

    function handle_copy() {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            copy_button_text = 'Copied!';

            if (copy_timer) {
                clearTimeout(copy_timer);
            }

            copy_timer = setTimeout(() => {
                copy_button_text = 'Copy';
                copy_timer = null;
            }, 2000);
        }
    }

    function handle_rematch() {
        send_rematch({ game_id: game_id_num });
    }

    let last_mouse_send = 0;
    let mouse_timer: ReturnType<typeof setTimeout> | null = null;
    const MOUSE_DEBOUNCE_MS = 100;
    const TRESHOLD_PERCENTAGE = 0.01;

    function on_mouse_move(coords?: { x: number; y: number }) {
        if (navigator.maxTouchPoints > 0) {
            return;
        }

        const now = Date.now();

        // Clear any pending timer
        if (mouse_timer) {
            clearTimeout(mouse_timer);
            mouse_timer = null;
        }

        // Schedule a send (immediately if enough time has passed, or delayed otherwise)
        const delay = Math.max(0, MOUSE_DEBOUNCE_MS - (now - last_mouse_send));
        mouse_timer = setTimeout(() => {
            last_mouse_send = Date.now();

            const in_bounds_and_exists =
                coords &&
                coords.x >= TRESHOLD_PERCENTAGE &&
                coords.x <= 100 - TRESHOLD_PERCENTAGE &&
                coords.y >= TRESHOLD_PERCENTAGE &&
                coords.y <= 100 - TRESHOLD_PERCENTAGE;

            if (in_bounds_and_exists) {
                send_mouse_move({
                    game_id: game_id_num,
                    cursor_present: true,
                    board_x: Math.round(coords.x * 1000) / 1000,
                    board_y: Math.round(coords.y * 1000) / 1000
                });
            } else {
                send_mouse_move({
                    game_id: game_id_num,
                    cursor_present: false
                });
            }
            mouse_timer = null;
        }, delay);
    }
</script>

<div class="p-4">
    <div class="mx-auto max-w-4xl">
        <PlayerInfo
            player1_presence={$overall_state.player1_presence}
            player2_presence={$overall_state.player2_presence}
            player_symbol={is_player1 ? 'X' : 'O'}
            {current_player_symbol}
            {is_player_turn}
        />

        {#if game_ended}
            {@const gs = $overall_state.game_state?.player2_id ? $overall_state.game_state : null}
            {@const first_rematch_sent_by = gs?.first_rematch_sent_by}

            <div class="mb-2 rounded bg-yellow-600 p-4 text-center">
                <div class="mb-3 text-lg font-bold">Game Ended</div>
                {#if gs?.rematch_game_id}
                    <a
                        class="rounded bg-blue-600 px-6 py-3 font-bold transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        href="/game/{gs.rematch_game_id}"
                    >
                        Join rematch
                    </a>
                {:else}
                    <button
                        onclick={handle_rematch}
                        disabled={first_rematch_sent_by === user_id}
                        class="rounded bg-blue-600 px-6 py-3 font-bold transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {#if first_rematch_sent_by === user_id}
                            Rematch Sent
                        {:else if first_rematch_sent_by}
                            Accept Rematch
                        {:else}
                            Request Rematch
                        {/if}
                    </button>
                {/if}
            </div>
        {/if}

        {#if error}
            <div class="text-red-400">{error}</div>
        {:else}
            {#if is_draft}
                <div class="rounded bg-gray-800 p-8 text-center">
                    {#if is_owner}
                        <div class="text-xl text-gray-400">Waiting for opponent to join...</div>
                        <div class="mt-4 text-sm text-gray-500">
                            Share this URL to invite a player
                        </div>
                        <div class="mt-4 flex items-center justify-center gap-2">
                            <input
                                type="text"
                                readonly
                                value={typeof window !== 'undefined' ? window.location.href : ''}
                                class="rounded bg-gray-700 px-4 py-2 text-sm text-gray-300"
                            />
                            <button
                                onclick={handle_copy}
                                class="w-24 rounded bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600"
                            >
                                {copy_button_text}
                            </button>
                        </div>
                    {:else}
                        <div class="mb-4 text-xl text-gray-400">Ready to play?</div>
                        <button
                            onclick={handle_join}
                            class="rounded bg-blue-600 px-6 py-3 font-bold transition-colors hover:bg-blue-700"
                        >
                            Join Game
                        </button>
                    {/if}
                </div>
            {:else if game_state && game_state.player2_id}
                <GameBoard
                    opponent_mouse={$overall_state.opponent_mouse}
                    {on_mouse_move}
                    {game_state}
                    {user_id}
                    on_move={handle_move}
                />
            {:else}
                <div class="text-gray-400">Waiting for game to start...</div>
            {/if}
            <Chat game_id={game_id_num} messages={$overall_state.chat} {user_id} />
        {/if}
    </div>
</div>
