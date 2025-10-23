<script lang="ts">
    import type { PageProps } from './$types';
    import { make_move, join_game } from '../../api/data.remote';
    import PlayerInfo from './PlayerInfo.svelte';
    import GameBoard from './GameBoard.svelte';

    let { data }: PageProps = $props();
    let overall_state = $derived(data.overall_state);

    let game_state = $derived($overall_state.game_state);
    let is_draft = $derived(game_state?.is_temp ?? false);
    let is_owner = $derived(game_state?.player1_auth === data.auth_token);
    let game_ended = $derived($overall_state.game_ended);
    let error = $derived($overall_state.error);

    let current_player_symbol = $derived.by(() => {
        if (!game_state || game_state.is_temp) return null;
        if (game_state.player1_auth === data.auth_token) return 'X' as const;
        if (game_state.player2_auth === data.auth_token) return 'O' as const;
        return null;
    });

    let is_player1 = $derived(game_state?.player1_auth === data.auth_token);
    let is_player2 = $derived(
        game_state && game_state.is_temp ? false : game_state?.player2_auth === data.auth_token
    );
    let move_count = $derived(game_state?.is_temp === false ? game_state.state.moves.length : 0);
    let is_player1_turn = $derived(move_count % 2 === 0);
    let is_player_turn = $derived(
        !game_state?.is_temp &&
            ((is_player1 && is_player1_turn) || (is_player2 && !is_player1_turn))
    );

    async function handle_move(x: number, y: number) {
        await make_move({
            game_id: data.id,
            auth: data.auth_token,
            x,
            y
        });
    }

    async function handle_join() {
        await join_game({
            game_id: data.id,
            auth: data.auth_token
        });
    }
</script>

<div class="min-h-screen bg-gray-900 p-4 text-white">
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
        {:else if game_state && !game_state.is_temp}
            <GameBoard {game_state} auth_token={data.auth_token} on_move={handle_move} />
        {:else}
            <div class="text-gray-400">Waiting for game to start...</div>
        {/if}
    </div>
</div>
