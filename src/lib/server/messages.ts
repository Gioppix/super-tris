import type { Game } from './game';

export type CloseReason = 'game_not_found' | 'game_started_with_others' | 'game_already_started';

export interface ChatMessage {
    user_id: string;
    content: string;
    timestamp: Date;
}

export type ChatMessageWithNames = ChatMessage & {
    name: string;
};

export type Message =
    | {
          type: 'game_state';
          game_state: Game;
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
          game_id: number;
      }
    | {
          type: 'chat_messages';
          messages: ChatMessageWithNames[];
      }
    | {
          type: 'chat_message';
          message: ChatMessageWithNames;
      };
