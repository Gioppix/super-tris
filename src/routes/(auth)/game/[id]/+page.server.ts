import { get_game } from '$lib/server/database';
import { GameId } from '$lib/server/game';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params: { id } }) => {
    const game_id_num = GameId.parse(id);

    const initial_game = await get_game(game_id_num);

    return {
        initial_game
    };
};
