import type { Game, TempGame } from './server/game';

/**
 * Super Tris (Ultimate Tic-Tac-Toe) Rules:
 *
 * - 9x9 grid: a 3x3 mega board where each cell contains a 3x3 mini board
 * - Goal: win 3 mini boards in a row (horizontally, vertically, or diagonally) on the mega board
 *
 * Gameplay:
 * 1. Player 1 makes the first move in any cell of any mini board
 * 2. Each move determines which mini board the opponent must play in next:
 *    - If you play in position (x,y) of a mini board, your opponent must play in mini board (x,y)
 * 3. If sent to a completed mini board (won or drawn), the player can choose any available mini board
 * 4. When a mini board is won, it's marked with that player's symbol (X or O)
 * 5. First player to win 3 mini boards in a row wins the game
 */

export interface MegaTris {
    moves: [number, number][];
}

export const get_possible_moves = (game: Game, user_id: string): [number, number][] => {
    if (game.is_draft) {
        return [];
    }

    // Check if game is completed
    if (is_game_completed(game.state)) {
        return [];
    }

    // Check if it's the player's turn
    const is_player1 = game.player1_id === user_id;
    const is_player2 = game.player2_id === user_id;

    if ((!is_player1 && !is_player2) || game.player1_id === game.player2_id) {
        return [];
    }

    const move_count = game.state.moves.length;
    const is_player1_turn = move_count % 2 === 0;

    if ((is_player1 && !is_player1_turn) || (is_player2 && is_player1_turn)) {
        return [];
    }

    // Get all occupied cells
    const occupied = new Set(game.state.moves.map(([x, y]) => `${x},${y}`));

    // Determine which mini boards we can play in
    let allowed_mini_boards: [number, number][] = [];

    if (move_count > 0) {
        const [prev_x, prev_y] = game.state.moves[move_count - 1];
        const required_mini_x = prev_x % 3;
        const required_mini_y = prev_y % 3;

        // Check if the required mini board is completed
        const mini_board_completed = is_mini_board_completed(
            game.state,
            required_mini_x,
            required_mini_y
        );

        if (!mini_board_completed) {
            // Must play in the required mini board
            allowed_mini_boards = [[required_mini_x, required_mini_y]];
        } else {
            // Can play in any non-completed mini board
            for (let mx = 0; mx < 3; mx++) {
                for (let my = 0; my < 3; my++) {
                    if (!is_mini_board_completed(game.state, mx, my)) {
                        allowed_mini_boards.push([mx, my]);
                    }
                }
            }
        }
    } else {
        // First move: can play anywhere
        for (let mx = 0; mx < 3; mx++) {
            for (let my = 0; my < 3; my++) {
                allowed_mini_boards.push([mx, my]);
            }
        }
    }

    // Get all possible moves in allowed mini boards
    const possible_moves: [number, number][] = [];

    for (const [mini_x, mini_y] of allowed_mini_boards) {
        for (let local_x = 0; local_x < 3; local_x++) {
            for (let local_y = 0; local_y < 3; local_y++) {
                const x = mini_x * 3 + local_x;
                const y = mini_y * 3 + local_y;

                if (!occupied.has(`${x},${y}`)) {
                    possible_moves.push([x, y]);
                }
            }
        }
    }

    return possible_moves;
};

export const is_in_game = (game: TempGame | Game, user_id: string): boolean => {
    if (game.is_draft) {
        return user_id === game.player1_id;
    }

    return user_id === game.player1_id || user_id === game.player2_id;
};

export const can_make_move = (game: Game, user_id: string, x: number, y: number): boolean => {
    const possible_moves = get_possible_moves(game, user_id);
    return possible_moves.some(([px, py]) => px === x && py === y);
};

export const is_game_completed = (state: MegaTris): boolean => {
    // Get the winner of each mini board (null if not won, true for player1, false for player2)
    const mini_board_winners: (boolean | null)[] = [];

    for (let mx = 0; mx < 3; mx++) {
        for (let my = 0; my < 3; my++) {
            mini_board_winners.push(get_mini_board_winner(state, mx, my));
        }
    }

    // Check if any player has won 3 mini boards in a row on the mega board
    for (const player of [true, false]) {
        // Check rows
        for (let row = 0; row < 3; row++) {
            if (
                mini_board_winners[row * 3] === player &&
                mini_board_winners[row * 3 + 1] === player &&
                mini_board_winners[row * 3 + 2] === player
            ) {
                return true;
            }
        }

        // Check columns
        for (let col = 0; col < 3; col++) {
            if (
                mini_board_winners[col] === player &&
                mini_board_winners[col + 3] === player &&
                mini_board_winners[col + 6] === player
            ) {
                return true;
            }
        }

        // Check diagonals
        if (
            mini_board_winners[0] === player &&
            mini_board_winners[4] === player &&
            mini_board_winners[8] === player
        ) {
            return true;
        }

        if (
            mini_board_winners[2] === player &&
            mini_board_winners[4] === player &&
            mini_board_winners[6] === player
        ) {
            return true;
        }
    }

    // Check if all mini boards are completed (draw)
    let all_completed = true;
    for (let mx = 0; mx < 3; mx++) {
        for (let my = 0; my < 3; my++) {
            if (!is_mini_board_completed(state, mx, my)) {
                all_completed = false;
                break;
            }
        }
        if (!all_completed) break;
    }

    return all_completed;
};

const get_mini_board_winner = (state: MegaTris, mini_x: number, mini_y: number): boolean | null => {
    // Get all moves in this mini board
    const mini_moves: [number, number, boolean][] = [];

    for (let i = 0; i < state.moves.length; i++) {
        const [mx, my] = state.moves[i];
        const move_mini_x = Math.floor(mx / 3);
        const move_mini_y = Math.floor(my / 3);

        if (move_mini_x === mini_x && move_mini_y === mini_y) {
            const is_player1_move = i % 2 === 0;
            mini_moves.push([mx % 3, my % 3, is_player1_move]);
        }
    }

    // Check if either player won this mini board
    for (const player of [true, false]) {
        const player_moves = mini_moves.filter(([, , p]) => p === player).map(([x, y]) => [x, y]);

        // Check rows
        for (let row = 0; row < 3; row++) {
            if (player_moves.filter(([, y]) => y === row).length === 3) {
                return player;
            }
        }

        // Check columns
        for (let col = 0; col < 3; col++) {
            if (player_moves.filter(([x]) => x === col).length === 3) {
                return player;
            }
        }

        // Check diagonals
        const diagonal1 = player_moves.filter(([x, y]) => x === y).length === 3;
        const diagonal2 = player_moves.filter(([x, y]) => x + y === 2).length === 3;

        if (diagonal1 || diagonal2) {
            return player;
        }
    }

    return null;
};

const is_mini_board_completed = (state: MegaTris, mini_x: number, mini_y: number): boolean => {
    // Get all moves in this mini board
    const mini_moves: [number, number, boolean][] = [];

    for (let i = 0; i < state.moves.length; i++) {
        const [mx, my] = state.moves[i];
        const move_mini_x = Math.floor(mx / 3);
        const move_mini_y = Math.floor(my / 3);

        if (move_mini_x === mini_x && move_mini_y === mini_y) {
            const is_player1_move = i % 2 === 0;
            mini_moves.push([mx % 3, my % 3, is_player1_move]);
        }
    }

    // Check if someone won this mini board
    for (const player of [true, false]) {
        const player_moves = mini_moves.filter(([, , p]) => p === player).map(([x, y]) => [x, y]);

        // Check rows
        for (let row = 0; row < 3; row++) {
            if (player_moves.filter(([, y]) => y === row).length === 3) {
                return true;
            }
        }

        // Check columns
        for (let col = 0; col < 3; col++) {
            if (player_moves.filter(([x]) => x === col).length === 3) {
                return true;
            }
        }

        // Check diagonals
        const diagonal1 = player_moves.filter(([x, y]) => x === y).length === 3;
        const diagonal2 = player_moves.filter(([x, y]) => x + y === 2).length === 3;

        if (diagonal1 || diagonal2) {
            return true;
        }
    }

    // Check if mini board is full (draw)
    if (mini_moves.length === 9) {
        return true;
    }

    return false;
};
