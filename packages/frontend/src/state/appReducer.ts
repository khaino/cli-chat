import type { Chat, MessageWithSender, SafeUser } from '@cli-chat/shared';

export type Screen = 'login' | 'main' | 'chat';

export interface AppState {
  screen: Screen;
  user: SafeUser | null;
  chat: Chat | null;
  partner: SafeUser | null;
  messages: MessageWithSender[];
}

export const initialState: AppState = {
  screen: 'login',
  user: null,
  chat: null,
  partner: null,
  messages: [],
};

export type AppAction =
  | { type: 'login-success'; user: SafeUser }
  | {
      type: 'enter-chat';
      chat: Chat;
      partner: SafeUser;
      messages: MessageWithSender[];
    }
  | { type: 'message-received'; message: MessageWithSender }
  | { type: 'presence-updated'; userId: string; online: boolean }
  | { type: 'back-to-main' }
  | { type: 'logout' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'login-success':
      return { ...state, screen: 'main', user: action.user };

    case 'enter-chat':
      return {
        ...state,
        screen: 'chat',
        chat: action.chat,
        partner: action.partner,
        messages: action.messages,
      };

    case 'message-received':
      if (!state.chat || action.message.chat_id !== state.chat.id) return state;
      return { ...state, messages: [...state.messages, action.message] };

    case 'presence-updated':
      if (!state.partner || state.partner.id !== action.userId) return state;
      return { ...state, partner: { ...state.partner, online: action.online } };

    case 'back-to-main':
      return { ...state, screen: 'main', chat: null, partner: null, messages: [] };

    case 'logout':
      return initialState;

    default:
      return state;
  }
}
