import { useCallback } from 'react';
import type { SafeUser } from '@cli-chat/shared';
import type { ApiClient } from '../services/apiClient.js';
import type { SocketClient } from '../services/socketClient.js';
import type { AppAction, AppState } from '../state/appReducer.js';

export interface UseChatActions {
  startChat: (target: SafeUser) => Promise<void>;
  sendMessage: (content: string) => void;
}

export function useChatActions(
  state: AppState,
  dispatch: React.Dispatch<AppAction>,
  api: ApiClient,
  socket: SocketClient | null
): UseChatActions {
  const startChat = useCallback(
    async (target: SafeUser) => {
      if (!state.user) return;
      const result = await api.startChat(state.user.id, target.id);
      if (!result.success) return;
      const partner = result.participants.find((p) => p.id === target.id) ?? target;
      dispatch({
        type: 'enter-chat',
        chat: result.chat,
        partner,
        messages: result.messages,
      });
    },
    [api, dispatch, state.user]
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !state.chat || !state.user) return;
      socket.sendMessage({
        chatId: state.chat.id,
        senderId: state.user.id,
        content,
      });
    },
    [socket, state.chat, state.user]
  );

  return { startChat, sendMessage };
}
