<script lang="ts">
    import clsx from 'clsx';

    interface Props {
        value: 'X' | 'O' | null;
        class?: string;
    }

    let { value, class: className }: Props = $props();
</script>

<span
    class={clsx(
        'flex items-center justify-center font-bold',
        value === 'X' && 'text-blue-400',
        value === 'O' && 'text-red-400',
        className
    )}
>
    {value || ''}
</span>
