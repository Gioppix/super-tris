<script lang="ts">
    import type { PageProps } from './$types';
    import PlayerInfo from './PlayerInfo.svelte';
    import GameBoard from './GameBoard.svelte';
    import { join_game, make_move } from '$lib/data.remote';
    import { auth_client } from '$lib/client';

    const session = auth_client.useSession();

    let { data }: PageProps = $props();
    let overall_state = $derived(data.overall_state);

    let user_id = $derived.by(() => {
        const user_id = $session.data?.user.id;
        if (!user_id) throw new Error('No user_id');

        return user_id;
    });

    let game_state = $derived($overall_state.game_state);
    let is_draft = $derived(game_state?.is_draft ?? false);
    let is_owner = $derived(game_state?.player1_id === user_id);
    let game_ended = $derived($overall_state.game_ended);
    let error = $derived($overall_state.error);

    let current_player_symbol = $derived.by(() => {
        if (!game_state || game_state.is_draft) return null;
        if (game_state.player1_id === user_id) return 'X' as const;
        if (game_state.player2_id === user_id) return 'O' as const;
        return null;
    });

    let is_player1 = $derived(game_state?.player1_id === user_id);
    let is_player2 = $derived(
        game_state && game_state.is_draft ? false : game_state?.player2_id === user_id
    );
    let move_count = $derived(game_state?.is_draft === false ? game_state.state.moves.length : 0);
    let is_player1_turn = $derived(move_count % 2 === 0);
    let is_player_turn = $derived(
        !game_state?.is_draft &&
            ((is_player1 && is_player1_turn) || (is_player2 && !is_player1_turn))
    );

    async function handle_move(x: number, y: number) {
        await make_move({
            game_id: data.game_id,
            x,
            y
        });
    }

    async function handle_join() {
        await join_game({
            game_id: data.game_id
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
</script>

<div class="p-4">
    <div class="mx-auto max-w-4xl">
        <PlayerInfo
            player1_presence={$overall_state.player1_presence}
            player2_presence={$overall_state.player2_presence}
            {current_player_symbol}
            {is_player_turn}
        />

        {#if game_ended}
            <div class="mb-4 rounded bg-yellow-600 p-4 text-center font-bold">Game Ended</div>
        {/if}

        {#if error}
            <div class="text-red-400">{error}</div>
        {:else if is_draft}
            <div class="rounded bg-gray-800 p-8 text-center">
                {#if is_owner}
                    <div class="text-xl text-gray-400">Waiting for opponent to join...</div>
                    <div class="mt-4 text-sm text-gray-500">Share this URL to invite a player</div>
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
        {:else if game_state && !game_state.is_draft}
            <GameBoard {game_state} {user_id} on_move={handle_move} />
        {:else}
            <div class="text-gray-400">Waiting for game to start...</div>
        {/if}
    </div>
</div>
