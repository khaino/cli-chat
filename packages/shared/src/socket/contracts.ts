import type { MessageWithSender } from '../types/domain.js';
import type {
  SendMessagePayload,
  TypingPayload,
  PresenceUpdatePayload,
  TypingIndicatorPayload,
} from './payloads.js';

export interface ClientToServerEvents {
  'user:join': (userId: string) => void;
  'message:send': (payload: SendMessagePayload) => void;
  'typing:start': (payload: TypingPayload) => void;
  'typing:stop': (payload: TypingPayload) => void;
}

export interface ServerToClientEvents {
  'message:receive': (msg: MessageWithSender) => void;
  'presence:update': (payload: PresenceUpdatePayload) => void;
  'typing:indicator': (payload: TypingIndicatorPayload) => void;
  'typing:stopped': (payload: TypingIndicatorPayload) => void;
}
