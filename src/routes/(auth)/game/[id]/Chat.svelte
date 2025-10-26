<script lang="ts">
    import { send_message } from '$lib/data.remote';
    import type { ChatMessageWithNames } from '$lib/server/messages';
    import { onMount, tick } from 'svelte';

    interface Props {
        game_id: string | number;
        messages: ChatMessageWithNames[] | undefined;
        user_id: string;
    }

    let { game_id, messages, user_id }: Props = $props();

    let message_input = $state('');
    let div: HTMLDivElement | undefined;
    let prev_messages_length = 0;
    let new_unread_messages = $state(0);
    let allow_auto_scroll = true;
    let programmatic_scroll = false;

    async function handle_send() {
        if (!message_input.trim()) return;

        await send_message({
            game_id: typeof game_id === 'string' ? parseInt(game_id, 10) : game_id,
            message: message_input
        });

        message_input = '';

        // Wait for state to update
        await tick();

        // Set to 0 so that during scroll the user doesn't see the new message indicator
        new_unread_messages = 0;
        maybe_scroll_to_bottom(false, true);
    }

    function handle_keydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handle_send();
        }
    }

    function handle_scroll() {
        if (div && !programmatic_scroll) {
            // 10px of tolerance
            allow_auto_scroll = div.scrollTop + div.clientHeight >= div.scrollHeight - 10;
        } else {
            allow_auto_scroll = true;
        }

        if (allow_auto_scroll) {
            new_unread_messages = 0;
        }
    }

    $effect(() => {
        const current_length = messages?.length ?? 0;
        if (current_length !== prev_messages_length) {
            if (!allow_auto_scroll) {
                new_unread_messages += current_length - prev_messages_length;
            }
            prev_messages_length = current_length;
            maybe_scroll_to_bottom(false, false);
        }
    });

    function maybe_scroll_to_bottom(instant: boolean, force: boolean) {
        if (!div || (!allow_auto_scroll && !force)) {
            return;
        }

        programmatic_scroll = true;

        div.scroll({
            top: div.scrollHeight,
            behavior: instant ? 'instant' : 'smooth'
        });

        setTimeout(() => {
            programmatic_scroll = false;
        });
    }

    onMount(() => {
        maybe_scroll_to_bottom(true, false);
    });
</script>

<div class="mt-4 rounded bg-gray-800 p-4">
    <div class="mb-2 text-lg font-bold">Chat</div>
    <div class="relative mb-4 h-48">
        <div
            bind:this={div}
            onscroll={handle_scroll}
            class="h-full overflow-y-auto rounded bg-gray-900 p-2 pb-0"
        >
            {#if messages && messages.length > 0}
                {#each messages as message}
                    <div
                        class="mb-2 rounded bg-gray-800 p-2"
                        class:bg-blue-900={message.user_id === user_id}
                    >
                        <div class="text-xs text-gray-400">
                            {message.name}
                            <span class:font-bold={message.user_id === user_id}>
                                {message.user_id === user_id ? '(You)' : ''}
                            </span>
                        </div>
                        <div class="text-sm">{message.content}</div>
                    </div>
                {/each}
            {:else}
                <div class="text-center text-sm text-gray-500">No messages yet</div>
            {/if}
        </div>
        {#if new_unread_messages > 0}
            <button
                class="absolute right-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                onclick={() => {
                    maybe_scroll_to_bottom(false, true);
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <div
                    class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white"
                >
                    {new_unread_messages}
                </div>
            </button>
        {/if}
    </div>
    <div class="flex gap-2">
        <input
            type="text"
            bind:value={message_input}
            onkeydown={handle_keydown}
            placeholder="Type a message..."
            class="flex-1 rounded bg-gray-700 px-3 py-2 text-sm"
        />
        <button
            onclick={handle_send}
            disabled={!message_input.trim()}
            class="rounded bg-blue-600 px-4 py-2 text-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            Send
        </button>
    </div>
</div>
