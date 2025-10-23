<script lang="ts">
    interface Props {
        value: 'X' | 'O' | null;
        is_possible_move: boolean;
        is_player_turn: boolean;
        on_click: () => void;
    }

    let { value, is_possible_move, is_player_turn, on_click }: Props = $props();

    let is_clickable = $derived(value === null && is_possible_move && is_player_turn);
</script>

<button
    onclick={on_click}
    class="flex aspect-square items-center justify-center rounded bg-gray-600 text-xl font-bold transition-colors
        {is_clickable ? 'cursor-pointer hover:bg-gray-500' : 'cursor-not-allowed'}
        {is_possible_move && is_player_turn && value === null ? 'ring-1 ring-green-400/50' : ''}
        {value === 'X' ? 'text-blue-400' : value === 'O' ? 'text-red-400' : ''}"
    disabled={!is_clickable}
>
    {value || ''}
</button>
