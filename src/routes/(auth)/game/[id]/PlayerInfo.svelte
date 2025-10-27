<script lang="ts">
    import clsx from 'clsx';
    import Symbol from './Symbol.svelte';

    interface Props {
        player1_presence: boolean;
        player2_presence: boolean;
        player_symbol: 'X' | 'O' | null;
        current_player_symbol: 'X' | 'O' | null;
        is_player_turn: boolean;
    }

    let {
        player1_presence,
        player2_presence,
        player_symbol,
        current_player_symbol,
        is_player_turn
    }: Props = $props();
</script>

<div class="mb-4 flex items-center justify-between">
    <div>
        {#if current_player_symbol && is_player_turn}
            <div class="font-bold text-green-400">Your turn!</div>
        {:else if current_player_symbol && !is_player_turn}
            <div class="text-gray-400">Waiting for opponent...</div>
        {/if}
    </div>
    <div class="flex flex-col items-end text-sm">
        {#snippet playerInfo(symbol: 'X' | 'O', presence: boolean)}
            <div class="flex items-center gap-1">
                <span>
                    {player_symbol === symbol ? 'You' : 'Opponent'}
                </span>
                <span class="flex flex-row">(<Symbol class="w-3 text-sm" value={symbol} />)</span>
                <span class={clsx(presence ? 'text-green-400' : 'text-gray-500')}>
                    {presence ? '●' : '○'}
                </span>
            </div>
        {/snippet}
        {@render playerInfo('X', player1_presence)}
        {@render playerInfo('O', player2_presence)}
    </div>
</div>
