<script lang="ts">
    import { goto } from '$app/navigation';
    import Auth from '$lib/components/Auth.svelte';
    import { create_game } from '$lib/data.remote';
    import type { LayoutData } from './$types';

    let { data }: { data: LayoutData } = $props();

    let session_data = $derived(data.session_data);

    async function handle_create_game() {
        let game_id = await create_game({
            name: 'example game'
        });

        goto(`/game/${game_id}`);
    }
</script>

<div class="flex w-full grow items-center justify-center overflow-y-auto p-4">
    <div class="w-full max-w-4xl space-y-8 py-8">
        <div class="text-center">
            {#if $session_data?.user.id}
                <button
                    class="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
                    onclick={handle_create_game}
                >
                    Create New Game
                </button>
            {:else}
                <div class="flex flex-row items-center gap-4">
                    <p class="text-gray-300">To start playing:</p>
                    <Auth class="underline" />
                </div>
            {/if}
        </div>

        <!-- Rules Section -->
        <div class="rounded-lg bg-gray-800 p-6 shadow-lg">
            <h2 class="mb-4 text-2xl font-bold text-blue-400">How to Play</h2>

            <div class="space-y-4 text-gray-200">
                <div class="rounded-md bg-gray-900 p-4">
                    <h3 class="mb-2 font-semibold text-blue-300">🎯 Objective</h3>
                    <p>
                        Win 3 mini boards in a row (horizontally, vertically, or diagonally) to win
                        the game!
                    </p>
                </div>

                <div class="rounded-md bg-gray-900 p-4">
                    <h3 class="mb-2 font-semibold text-blue-300">🎮 The Board</h3>
                    <p>
                        The game is played on a 9×9 grid made up of 9 mini tic-tac-toe boards (3×3
                        each).
                    </p>
                </div>

                <div class="rounded-md bg-gray-900 p-4">
                    <h3 class="mb-2 font-semibold text-blue-300">📋 Rules</h3>
                    <ol class="ml-5 list-decimal space-y-2">
                        <li>
                            <span class="font-semibold">First Move:</span> Player 1 (<span
                                class="text-blue-400">X</span
                            >) starts and can play in any cell of any mini board.
                        </li>
                        <li>
                            <span class="font-semibold">Move Direction:</span> Your move determines
                            where your opponent plays next!
                            <ul class="mt-1 ml-5 list-disc text-sm text-gray-300">
                                <li>
                                    The position you pick within a mini board determines which mini
                                    board your opponent must play in next
                                </li>
                                <li>
                                    Example: Play in the top-right cell → opponent plays in the
                                    top-right mini board
                                </li>
                            </ul>
                        </li>
                        <li>
                            <span class="font-semibold">Completed Boards:</span> If sent to a completed
                            mini board (won or drawn), you can choose any available mini board.
                        </li>
                        <li>
                            <span class="font-semibold">Winning Mini Boards:</span> Win 3 cells in a
                            row within a mini board to claim it.
                        </li>
                        <li>
                            <span class="font-semibold">Winning the Game:</span> Claim 3 mini boards
                            in a row on the mega board to win!
                        </li>
                    </ol>
                </div>

                <div class="rounded-md bg-gray-900 p-4">
                    <h3 class="mb-2 font-semibold text-blue-300">💡 Strategy Tips</h3>
                    <ul class="ml-5 list-disc space-y-1">
                        <li>Think ahead: Your move controls where your opponent plays next</li>
                        <li>Try to send your opponent to disadvantageous boards</li>
                        <li>Focus on winning strategic mini boards (corners and center)</li>
                        <li>Don't let your opponent force you into bad positions</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
