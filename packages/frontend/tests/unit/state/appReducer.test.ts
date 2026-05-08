import {
  appReducer,
  initialState,
  MAX_MESSAGES,
  type AppState,
} from '../../../src/state/appReducer.js';
import type { Chat, MessageWithSender, SafeUser } from '@cli-chat/shared';

const alice: SafeUser = {
  id: 'u1',
  username: 'alice',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const bob: SafeUser = {
  id: 'u2',
  username: 'bob',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const chat: Chat = { id: 'c1', created_at: '2024-01-01T00:00:00.000Z' };

const message: MessageWithSender = {
  id: 'm1',
  chat_id: 'c1',
  sender_id: 'u2',
  content: 'hi',
  created_at: '2024-01-01T00:00:00.000Z',
  sender_username: 'bob',
};

const inChatState: AppState = {
  ...initialState,
  screen: 'chat',
  user: alice,
  chat,
  partner: bob,
  messages: [],
};

describe('appReducer', () => {
  test('login-success advances to main with user', () => {
    const next = appReducer(initialState, { type: 'login-success', user: alice });
    expect(next.screen).toBe('main');
    expect(next.user).toEqual(alice);
  });

  test('enter-chat populates chat state and clears typing', () => {
    const base: AppState = {
      ...initialState,
      screen: 'main',
      user: alice,
      typingUserIds: ['u2'],
    };
    const next = appReducer(base, {
      type: 'enter-chat',
      chat,
      partner: bob,
      messages: [],
    });
    expect(next.screen).toBe('chat');
    expect(next.chat).toEqual(chat);
    expect(next.partner).toEqual(bob);
    expect(next.typingUserIds).toEqual([]);
  });

  test('message-received appends to current chat only', () => {
    const next = appReducer(inChatState, { type: 'message-received', message });
    expect(next.messages).toHaveLength(1);
  });

  test('message-received ignores messages from other chats', () => {
    const next = appReducer(inChatState, {
      type: 'message-received',
      message: { ...message, chat_id: 'other-chat' },
    });
    expect(next.messages).toHaveLength(0);
  });

  test('message-received caps the log at MAX_MESSAGES', () => {
    const fullLog = Array.from({ length: MAX_MESSAGES }, (_, i) => ({
      ...message,
      id: `m-${i}`,
      content: `msg-${i}`,
    }));
    const populated: AppState = { ...inChatState, messages: fullLog };
    const next = appReducer(populated, {
      type: 'message-received',
      message: { ...message, id: 'm-new', content: 'newest' },
    });
    expect(next.messages).toHaveLength(MAX_MESSAGES);
    expect(next.messages[0].id).toBe('m-1');
    expect(next.messages[next.messages.length - 1].content).toBe('newest');
  });

  test('message-received clears typing for that sender', () => {
    const populated: AppState = { ...inChatState, typingUserIds: ['u2'] };
    const next = appReducer(populated, { type: 'message-received', message });
    expect(next.typingUserIds).toEqual([]);
  });

  test('presence-updated patches partner online flag', () => {
    const populated: AppState = {
      ...inChatState,
      partner: { ...bob, online: false },
    };
    const next = appReducer(populated, {
      type: 'presence-updated',
      userId: bob.id,
      online: true,
    });
    expect(next.partner?.online).toBe(true);
  });

  test('presence-updated for non-partner is a no-op', () => {
    const next = appReducer(inChatState, {
      type: 'presence-updated',
      userId: 'someone-else',
      online: true,
    });
    expect(next).toBe(inChatState);
  });

  test('typing-started adds the user once', () => {
    const next = appReducer(inChatState, {
      type: 'typing-started',
      userId: 'u2',
    });
    expect(next.typingUserIds).toEqual(['u2']);

    const same = appReducer(next, { type: 'typing-started', userId: 'u2' });
    expect(same).toBe(next);
  });

  test('typing-started ignores own user id', () => {
    const next = appReducer(inChatState, {
      type: 'typing-started',
      userId: alice.id,
    });
    expect(next).toBe(inChatState);
  });

  test('typing-started outside a chat is a no-op', () => {
    const onMain: AppState = { ...initialState, screen: 'main', user: alice };
    const next = appReducer(onMain, { type: 'typing-started', userId: 'u2' });
    expect(next).toBe(onMain);
  });

  test('typing-stopped removes the user', () => {
    const populated: AppState = { ...inChatState, typingUserIds: ['u2'] };
    const next = appReducer(populated, {
      type: 'typing-stopped',
      userId: 'u2',
    });
    expect(next.typingUserIds).toEqual([]);
  });

  test('typing-stopped for unknown user is a no-op', () => {
    const next = appReducer(inChatState, {
      type: 'typing-stopped',
      userId: 'u99',
    });
    expect(next).toBe(inChatState);
  });

  test('back-to-main clears chat state and typing', () => {
    const populated: AppState = {
      ...inChatState,
      messages: [message],
      typingUserIds: ['u2'],
    };
    const next = appReducer(populated, { type: 'back-to-main' });
    expect(next.screen).toBe('main');
    expect(next.chat).toBeNull();
    expect(next.partner).toBeNull();
    expect(next.messages).toEqual([]);
    expect(next.typingUserIds).toEqual([]);
    expect(next.user).toEqual(alice);
  });

  test('logout returns to initial state', () => {
    const populated: AppState = {
      ...initialState,
      screen: 'main',
      user: alice,
    };
    expect(appReducer(populated, { type: 'logout' })).toEqual(initialState);
  });
});
