import type { MegaTris } from '$lib/logic';
import type { Game, TempGame } from './game';

export type CloseReason = 'game_not_found' | 'game_started_with_others' | 'game_already_started';

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
          type: 'heartbeat';
      }
    | {
          type: 'closing';
          reason: CloseReason;
      }
    | {
          type: 'new_game';
          game_id: string;
      };
