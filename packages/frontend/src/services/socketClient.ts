import { io, type Socket } from 'socket.io-client';
import {
  SocketEvents,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type MessageWithSender,
  type PresenceUpdatePayload,
  type SendMessagePayload,
  type TypingPayload,
} from '@cli-chat/shared';

type IoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketClient {
  join(userId: string): void;
  sendMessage(payload: SendMessagePayload): void;
  startTyping(payload: TypingPayload): void;
  stopTyping(payload: TypingPayload): void;
  onMessage(cb: (msg: MessageWithSender) => void): () => void;
  onPresence(cb: (payload: PresenceUpdatePayload) => void): () => void;
  disconnect(): void;
}

export function createSocketClient(url: string): SocketClient {
  const socket: IoSocket = io(url);

  return {
    join: (userId) => socket.emit(SocketEvents.UserJoin, userId),
    sendMessage: (payload) => socket.emit(SocketEvents.MessageSend, payload),
    startTyping: (payload) => socket.emit(SocketEvents.TypingStart, payload),
    stopTyping: (payload) => socket.emit(SocketEvents.TypingStop, payload),

    onMessage: (cb) => {
      socket.on(SocketEvents.MessageReceive, cb);
      return () => socket.off(SocketEvents.MessageReceive, cb);
    },

    onPresence: (cb) => {
      socket.on(SocketEvents.PresenceUpdate, cb);
      return () => socket.off(SocketEvents.PresenceUpdate, cb);
    },

    disconnect: () => socket.disconnect(),
  };
}
