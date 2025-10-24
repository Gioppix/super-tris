<script lang="ts">
    import type { MegaTris } from '$lib/logic';
    import Cell from './Cell.svelte';

    interface Props {
        mini_x: number;
        mini_y: number;
        game_state: MegaTris;
        is_highlighted: boolean;
        possible_moves: Set<string>;
        on_cell_click: (x: number, y: number) => void;
        is_player_turn: boolean;
    }

    let {
        mini_x,
        mini_y,
        game_state,
        is_highlighted,
        possible_moves,
        on_cell_click,
        is_player_turn
    }: Props = $props();

    function get_cell_value(x: number, y: number): 'X' | 'O' | null {
        const move_index = game_state.moves.findIndex(([mx, my]) => mx === x && my === y);
        if (move_index === -1) return null;
        return move_index % 2 === 0 ? 'X' : 'O';
    }

    function get_mini_winner(): 'X' | 'O' | 'draw' | null {
        const mini_moves: [number, number, boolean][] = [];
        for (let i = 0; i < game_state.moves.length; i++) {
            const [mx, my] = game_state.moves[i];
            const move_mini_x = Math.floor(mx / 3);
            const move_mini_y = Math.floor(my / 3);

            if (move_mini_x === mini_x && move_mini_y === mini_y) {
                mini_moves.push([mx % 3, my % 3, i % 2 === 0]);
            }
        }

        for (const is_player1 of [true, false]) {
            const moves = mini_moves.filter(([, , p]) => p === is_player1).map(([x, y]) => [x, y]);

            for (let row = 0; row < 3; row++) {
                if (moves.filter(([, y]) => y === row).length === 3) {
                    return is_player1 ? 'X' : 'O';
                }
            }

            for (let col = 0; col < 3; col++) {
                if (moves.filter(([x]) => x === col).length === 3) {
                    return is_player1 ? 'X' : 'O';
                }
            }

            if (moves.filter(([x, y]) => x === y).length === 3) return is_player1 ? 'X' : 'O';
            if (moves.filter(([x, y]) => x + y === 2).length === 3) return is_player1 ? 'X' : 'O';
        }

        if (mini_moves.length === 9) return 'draw';
        return null;
    }
    let mini_winner = $derived(get_mini_winner());

    function is_last_move(x: number, y: number): boolean {
        if (game_state.moves.length === 0) return false;
        const [last_x, last_y] = game_state.moves[game_state.moves.length - 1];
        return last_x === x && last_y === y;
    }
</script>

<div
    class="relative grid grid-cols-3 gap-1 rounded bg-gray-700 p-2 transition-all {is_highlighted &&
    is_player_turn
        ? 'ring-2 ring-blue-400'
        : ''}"
>
    {#if mini_winner}
        <div
            class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded bg-gray-900/80 text-6xl font-bold {mini_winner ===
            'X'
                ? 'text-blue-400'
                : mini_winner === 'O'
                  ? 'text-red-400'
                  : 'text-gray-500'}"
        >
            {mini_winner === 'draw' ? '—' : mini_winner}
        </div>
    {/if}
    {#each Array(3) as _, local_y}
        {#each Array(3) as _, local_x}
            {@const x = mini_x * 3 + local_x}
            {@const y = mini_y * 3 + local_y}
            {@const value = get_cell_value(x, y)}
            {@const is_possible_move = possible_moves.has(`${x},${y}`)}
            {@const is_last = is_last_move(x, y)}

            <Cell
                {value}
                {is_possible_move}
                {is_player_turn}
                {is_last}
                on_click={() => on_cell_click(x, y)}
            />
        {/each}
    {/each}
</div>
