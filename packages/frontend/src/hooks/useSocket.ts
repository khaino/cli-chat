import { useEffect } from 'react';
import type { SocketClient } from '../services/socketClient.js';
import type { AppAction } from '../state/appReducer.js';

export function useSocketSubscriptions(
  socket: SocketClient | null,
  dispatch: React.Dispatch<AppAction>
): void {
  useEffect(() => {
    if (!socket) return;

    const offMessage = socket.onMessage((message) => {
      dispatch({ type: 'message-received', message });
    });

    const offPresence = socket.onPresence((payload) => {
      dispatch({
        type: 'presence-updated',
        userId: payload.userId,
        online: payload.online,
      });
    });

    const offTypingStart = socket.onTypingStart((userId) => {
      dispatch({ type: 'typing-started', userId });
    });

    const offTypingStop = socket.onTypingStop((userId) => {
      dispatch({ type: 'typing-stopped', userId });
    });

    return () => {
      offMessage();
      offPresence();
      offTypingStart();
      offTypingStop();
    };
  }, [socket, dispatch]);
}
