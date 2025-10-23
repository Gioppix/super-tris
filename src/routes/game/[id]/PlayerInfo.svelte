<script lang="ts">
    interface Props {
        player1_presence: boolean;
        player2_presence: boolean;
        current_player_symbol: 'X' | 'O' | null;
        is_player_turn: boolean;
    }

    let { player1_presence, player2_presence, current_player_symbol, is_player_turn }: Props =
        $props();
</script>

<div class="mb-4 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Super Tris</h1>
    <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-2">
            <span
                class="{player1_presence ? 'text-green-400' : 'text-gray-500'} {current_player_symbol ===
                'X'
                    ? 'font-bold ring-2 ring-blue-400 rounded px-2 py-1'
                    : ''}"
            >
                Player 1 (X) {player1_presence ? '●' : '○'}
                {#if current_player_symbol === 'X'}
                    <span class="text-blue-400">← You</span>
                {/if}
            </span>
        </div>
        <div class="flex items-center gap-2">
            <span
                class="{player2_presence ? 'text-green-400' : 'text-gray-500'} {current_player_symbol ===
                'O'
                    ? 'font-bold ring-2 ring-red-400 rounded px-2 py-1'
                    : ''}"
            >
                Player 2 (O) {player2_presence ? '●' : '○'}
                {#if current_player_symbol === 'O'}
                    <span class="text-red-400">← You</span>
                {/if}
            </span>
        </div>
    </div>
</div>

{#if current_player_symbol && is_player_turn}
    <div class="mb-4 rounded bg-green-900/30 border border-green-500 p-3 text-center font-bold">
        Your turn! You are playing as <span
            class={current_player_symbol === 'X' ? 'text-blue-400' : 'text-red-400'}
            >{current_player_symbol}</span
        >
    </div>
{:else if current_player_symbol && !is_player_turn}
    <div class="mb-4 rounded bg-gray-800 border border-gray-600 p-3 text-center text-gray-400">
        Waiting for opponent... (You are {current_player_symbol})
    </div>
{/if}
