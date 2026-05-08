import React, { useEffect } from 'react';
import { Box } from 'ink';
import type { ApiClient } from './services/apiClient.js';
import type { SocketClient } from './services/socketClient.js';
import { useApp } from './state/useApp.js';
import { useSocketSubscriptions } from './hooks/useSocket.js';
import { useChatActions } from './hooks/useChat.js';
import { Login, MainScreen, ChatScreen } from './components/index.js';

export interface AppProps {
  api: ApiClient;
  socket: SocketClient;
  onExit?: () => void;
}

export function App({ api, socket, onExit }: AppProps): JSX.Element {
  const { state, dispatch } = useApp();
  useSocketSubscriptions(socket, dispatch);
  const { startChat, sendMessage } = useChatActions(state, dispatch, api, socket);

  useEffect(() => {
    if (state.user) socket.join(state.user.id);
  }, [socket, state.user]);

  const handleExit = () => {
    socket.disconnect();
    if (onExit) onExit();
    else process.exit(0);
  };

  return (
    <Box flexDirection="column" minHeight={20}>
      {state.screen === 'login' && (
        <Login
          api={api}
          onLogin={(user) => dispatch({ type: 'login-success', user })}
          onExit={handleExit}
        />
      )}

      {state.screen === 'main' && state.user && (
        <MainScreen
          api={api}
          currentUser={state.user}
          onStartChat={startChat}
          onExit={handleExit}
        />
      )}

      {state.screen === 'chat' && state.user && state.partner && state.chat && (
        <ChatScreen
          currentUser={state.user}
          chatPartner={state.partner}
          messages={state.messages}
          typingUserIds={state.typingUserIds}
          onBack={() => dispatch({ type: 'back-to-main' })}
          onSendMessage={sendMessage}
        />
      )}
    </Box>
  );
}
