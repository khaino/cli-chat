import {
  appReducer,
  initialState,
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

describe('appReducer', () => {
  test('login-success advances to main with user', () => {
    const next = appReducer(initialState, { type: 'login-success', user: alice });
    expect(next.screen).toBe('main');
    expect(next.user).toEqual(alice);
  });

  test('enter-chat populates chat state', () => {
    const base: AppState = { ...initialState, screen: 'main', user: alice };
    const next = appReducer(base, {
      type: 'enter-chat',
      chat,
      partner: bob,
      messages: [],
    });
    expect(next.screen).toBe('chat');
    expect(next.chat).toEqual(chat);
    expect(next.partner).toEqual(bob);
  });

  test('message-received appends to current chat only', () => {
    const inChat: AppState = {
      ...initialState,
      screen: 'chat',
      user: alice,
      chat,
      partner: bob,
      messages: [],
    };
    const next = appReducer(inChat, { type: 'message-received', message });
    expect(next.messages).toHaveLength(1);
  });

  test('message-received ignores messages from other chats', () => {
    const inChat: AppState = {
      ...initialState,
      screen: 'chat',
      user: alice,
      chat,
      partner: bob,
      messages: [],
    };
    const next = appReducer(inChat, {
      type: 'message-received',
      message: { ...message, chat_id: 'other-chat' },
    });
    expect(next.messages).toHaveLength(0);
  });

  test('presence-updated patches partner online flag', () => {
    const inChat: AppState = {
      ...initialState,
      screen: 'chat',
      user: alice,
      chat,
      partner: { ...bob, online: false },
      messages: [],
    };
    const next = appReducer(inChat, {
      type: 'presence-updated',
      userId: bob.id,
      online: true,
    });
    expect(next.partner?.online).toBe(true);
  });

  test('presence-updated for non-partner is a no-op', () => {
    const inChat: AppState = {
      ...initialState,
      screen: 'chat',
      user: alice,
      chat,
      partner: bob,
      messages: [],
    };
    const next = appReducer(inChat, {
      type: 'presence-updated',
      userId: 'someone-else',
      online: true,
    });
    expect(next).toBe(inChat);
  });

  test('back-to-main clears chat state', () => {
    const inChat: AppState = {
      ...initialState,
      screen: 'chat',
      user: alice,
      chat,
      partner: bob,
      messages: [message],
    };
    const next = appReducer(inChat, { type: 'back-to-main' });
    expect(next.screen).toBe('main');
    expect(next.chat).toBeNull();
    expect(next.partner).toBeNull();
    expect(next.messages).toEqual([]);
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
