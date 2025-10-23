import type { MegaTris } from '$lib/logic';
import type { Game, TempGame } from './game';

export type Message =
    | {
          type: 'game_state';
          game_state: Game | TempGame;
      }
    | {
          type: 'ok';
      }
    | {
          type: 'player_presence';
          player1_presence: boolean;
          player2_presence: boolean;
      }
    | {
          type: 'game_ended';
      }
    | {
          type: 'heartbeat';
      };
