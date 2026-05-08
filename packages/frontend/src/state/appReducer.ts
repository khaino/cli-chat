import type { Chat, MessageWithSender, SafeUser } from '@cli-chat/shared';

export type Screen = 'login' | 'main' | 'chat';

export const MAX_MESSAGES = 200;

export interface AppState {
  screen: Screen;
  user: SafeUser | null;
  chat: Chat | null;
  partner: SafeUser | null;
  messages: MessageWithSender[];
  typingUserIds: string[];
}

export const initialState: AppState = {
  screen: 'login',
  user: null,
  chat: null,
  partner: null,
  messages: [],
  typingUserIds: [],
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
  | { type: 'typing-started'; userId: string }
  | { type: 'typing-stopped'; userId: string }
  | { type: 'back-to-main' }
  | { type: 'logout' };

function capMessages(list: MessageWithSender[]): MessageWithSender[] {
  return list.length > MAX_MESSAGES ? list.slice(-MAX_MESSAGES) : list;
}

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
        messages: capMessages(action.messages),
        typingUserIds: [],
      };

    case 'message-received': {
      if (!state.chat || action.message.chat_id !== state.chat.id) return state;
      const messages = capMessages([...state.messages, action.message]);
      const typingUserIds = state.typingUserIds.filter(
        (id) => id !== action.message.sender_id
      );
      return { ...state, messages, typingUserIds };
    }

    case 'presence-updated':
      if (!state.partner || state.partner.id !== action.userId) return state;
      return { ...state, partner: { ...state.partner, online: action.online } };

    case 'typing-started': {
      if (!state.chat || !state.partner) return state;
      if (action.userId === state.user?.id) return state;
      if (state.typingUserIds.includes(action.userId)) return state;
      return { ...state, typingUserIds: [...state.typingUserIds, action.userId] };
    }

    case 'typing-stopped': {
      if (!state.typingUserIds.includes(action.userId)) return state;
      return {
        ...state,
        typingUserIds: state.typingUserIds.filter((id) => id !== action.userId),
      };
    }

    case 'back-to-main':
      return {
        ...state,
        screen: 'main',
        chat: null,
        partner: null,
        messages: [],
        typingUserIds: [],
      };

    case 'logout':
      return initialState;

    default:
      return state;
  }
}
