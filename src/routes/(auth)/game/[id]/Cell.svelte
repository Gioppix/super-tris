<script lang="ts">
    import clsx from 'clsx';
    import Symbol from './Symbol.svelte';

    interface Props {
        value: 'X' | 'O' | null;
        is_possible_move: boolean;
        is_player_turn: boolean;
        is_last: boolean;
        on_click: () => void;
    }

    let { value, is_possible_move, is_player_turn, is_last, on_click }: Props = $props();

    let is_clickable = $derived(value === null && is_possible_move && is_player_turn);
</script>

<button
    onclick={on_click}
    class={clsx(
        '@container flex aspect-square items-center justify-center rounded bg-gray-600 transition-colors',
        is_clickable ? 'cursor-pointer hover:bg-gray-500' : 'cursor-not-allowed',
        is_possible_move && is_player_turn && value === null && 'ring-1 ring-green-400/50',
        is_last && 'ring-1 ring-yellow-400/60'
    )}
    disabled={!is_clickable}
>
    <Symbol class="text-[60cqmin]" {value} />
</button>
