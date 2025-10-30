<script lang="ts">
    import type { Game } from '$lib/server/game';
    import { get_possible_moves } from '$lib/logic';
    import MiniBoard from './MiniBoard.svelte';
    import { MousePointer2 } from '@lucide/svelte';
    import type { Spring } from 'svelte/motion';
    import { fade } from 'svelte/transition';

    interface Props {
        game_state: Game;
        user_id: string;
        on_move: (x: number, y: number) => void;
        on_mouse_move: (coords?: { x: number; y: number }) => void;
        opponent_mouse: Spring<{ x: number; y: number }> | null;
    }

    let { game_state, user_id, on_move, on_mouse_move, opponent_mouse }: Props = $props();

    let possible_moves_array = $derived(get_possible_moves(game_state, user_id));
    let possible_moves_set = $derived(new Set(possible_moves_array.map(([x, y]) => `${x},${y}`)));

    let is_player1 = $derived(game_state.player1_id === user_id);
    let is_player2 = $derived(game_state.player2_id === user_id);
    let move_count = $derived(game_state.state.moves.length);
    let is_player1_turn = $derived(move_count % 2 === 0);
    let is_player_turn = $derived(
        (is_player1 && is_player1_turn) || (is_player2 && !is_player1_turn)
    );

    function get_highlighted_mini_boards(): Set<string> {
        const state = game_state.state;
        const highlighted = new Set<string>();

        if (state.moves.length === 0) {
            // First move: all mini boards are highlighted
            for (let mx = 0; mx < 3; mx++) {
                for (let my = 0; my < 3; my++) {
                    highlighted.add(`${mx},${my}`);
                }
            }
            return highlighted;
        }

        // Get mini boards that have available moves
        for (const [x, y] of possible_moves_array) {
            const mini_x = Math.floor(x / 3);
            const mini_y = Math.floor(y / 3);
            highlighted.add(`${mini_x},${mini_y}`);
        }

        return highlighted;
    }

    let highlighted_mini_boards = $derived(get_highlighted_mini_boards());

    function handle_cell_click(x: number, y: number) {
        if (!is_player_turn) return;
        if (!possible_moves_set.has(`${x},${y}`)) return;
        on_move(x, y);
    }

    function handle_mouse_move(
        event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }
    ) {
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        on_mouse_move({ x, y });
    }

    function handle_mouse_out() {
        on_mouse_move();
    }
</script>

<div class="flex w-full flex-col items-center justify-center">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        onmousemove={handle_mouse_move}
        onmouseleave={handle_mouse_out}
        class="relative grid w-full max-w-lg grid-cols-3 gap-2 rounded bg-gray-800 p-2"
    >
        {#each Array(3) as _, mini_y}
            {#each Array(3) as _, mini_x}
                {@const is_highlighted = highlighted_mini_boards.has(`${mini_x},${mini_y}`)}

                <MiniBoard
                    {mini_x}
                    {mini_y}
                    game_state={game_state.state}
                    {is_highlighted}
                    possible_moves={possible_moves_set}
                    on_cell_click={handle_cell_click}
                    {is_player_turn}
                />
            {/each}
        {/each}
        {#if opponent_mouse && opponent_mouse.current.x != 0 && opponent_mouse.current.y != 0}
            <div
                class="pointer-events-none absolute h-4 w-4 opacity-70"
                style="left: {opponent_mouse.current.x}%; top: {opponent_mouse.current.y}%;"
                in:fade
                out:fade
            >
                <MousePointer2 class="h-4 w-4" />
            </div>
        {/if}
    </div>
</div>
