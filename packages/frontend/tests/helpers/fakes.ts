import type {
  GetMessagesResponse,
  GetUsersResponse,
  LoginResponse,
  MessageWithSender,
  PresenceUpdatePayload,
  SafeUser,
  SendMessagePayload,
  StartChatResponse,
  TypingPayload,
} from '@cli-chat/shared';
import type { ApiClient, UsersFilter } from '../../src/services/apiClient.js';
import type { SocketClient } from '../../src/services/socketClient.js';

export interface FakeApiClientOptions {
  loginResult?: LoginResponse;
  users?: SafeUser[];
  startChat?: StartChatResponse;
  messages?: GetMessagesResponse;
}

export function createFakeApiClient(opts: FakeApiClientOptions = {}): ApiClient {
  return {
    login: async () =>
      opts.loginResult ?? { success: false, error: 'no fake configured' },
    getUsers: async (_filter: UsersFilter = 'all') =>
      opts.users
        ? { success: true, users: opts.users }
        : ({ success: false, error: 'no fake configured' } as GetUsersResponse),
    startChat: async () =>
      opts.startChat ?? { success: false, error: 'no fake configured' },
    getMessages: async () =>
      opts.messages ?? { success: false, error: 'no fake configured' },
  };
}

export interface FakeSocketClient extends SocketClient {
  emitMessage(msg: MessageWithSender): void;
  emitPresence(payload: PresenceUpdatePayload): void;
  emitTypingStart(userId: string): void;
  emitTypingStop(userId: string): void;
  joins: string[];
  sentMessages: SendMessagePayload[];
  typingStarts: TypingPayload[];
  typingStops: TypingPayload[];
  disconnected: boolean;
}

export function createFakeSocketClient(): FakeSocketClient {
  const messageListeners = new Set<(m: MessageWithSender) => void>();
  const presenceListeners = new Set<(p: PresenceUpdatePayload) => void>();
  const typingStartListeners = new Set<(userId: string) => void>();
  const typingStopListeners = new Set<(userId: string) => void>();
  const joins: string[] = [];
  const sentMessages: SendMessagePayload[] = [];
  const typingStarts: TypingPayload[] = [];
  const typingStops: TypingPayload[] = [];
  let disconnected = false;

  return {
    join: (userId) => {
      joins.push(userId);
    },
    sendMessage: (payload) => {
      sentMessages.push(payload);
    },
    startTyping: (payload) => {
      typingStarts.push(payload);
    },
    stopTyping: (payload) => {
      typingStops.push(payload);
    },
    onMessage: (cb) => {
      messageListeners.add(cb);
      return () => messageListeners.delete(cb);
    },
    onPresence: (cb) => {
      presenceListeners.add(cb);
      return () => presenceListeners.delete(cb);
    },
    onTypingStart: (cb) => {
      typingStartListeners.add(cb);
      return () => typingStartListeners.delete(cb);
    },
    onTypingStop: (cb) => {
      typingStopListeners.add(cb);
      return () => typingStopListeners.delete(cb);
    },
    disconnect: () => {
      disconnected = true;
    },
    emitMessage: (msg) => {
      for (const cb of messageListeners) cb(msg);
    },
    emitPresence: (payload) => {
      for (const cb of presenceListeners) cb(payload);
    },
    emitTypingStart: (userId) => {
      for (const cb of typingStartListeners) cb(userId);
    },
    emitTypingStop: (userId) => {
      for (const cb of typingStopListeners) cb(userId);
    },
    get joins() {
      return joins;
    },
    get sentMessages() {
      return sentMessages;
    },
    get typingStarts() {
      return typingStarts;
    },
    get typingStops() {
      return typingStops;
    },
    get disconnected() {
      return disconnected;
    },
  } as FakeSocketClient;
}
