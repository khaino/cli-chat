#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box } from 'ink';
import { io, Socket } from 'socket.io-client';
import { Login, MainScreen, ChatScreen } from './components/index.js';
import type { SafeUser, MessageWithSender, Chat } from '../types/index.js';

type Screen = 'login' | 'main' | 'chat';

interface StartChatResponse {
  success: boolean;
  chat?: Chat;
  participants?: SafeUser[];
  messages?: MessageWithSender[];
  error?: string;
}

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [chatPartner, setChatPartner] = useState<SafeUser | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle incoming messages and presence updates
  useEffect(() => {
    if (!socket) return;

    socket.on('message:receive', (message: MessageWithSender) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('presence:update', (payload: { userId: string; online: boolean }) => {
      setChatPartner((prev) => {
        if (!prev || prev.id !== payload.userId) return prev;
        return { ...prev, online: payload.online };
      });
    });

    return () => {
      socket.off('message:receive');
      socket.off('presence:update');
    };
  }, [socket]);

  const handleLogin = (user: SafeUser) => {
    setCurrentUser(user);
    setScreen('main');
    
    // Join socket room with user ID
    if (socket) {
      socket.emit('user:join', user.id);
    }
  };

  const handleStartChat = async (targetUser: SafeUser) => {
    if (!currentUser) return;

    try {
      const response = await fetch('http://localhost:3000/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
          targetUserId: targetUser.id,
        }),
      });

      const data = await response.json() as StartChatResponse;

      if (data.success && data.chat) {
        const partner = data.participants?.find((user) => user.id === targetUser.id) ?? targetUser;
        setChatPartner(partner);
        setChatId(data.chat.id);
        setMessages(data.messages || []);
        setScreen('chat');
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!socket || !chatId || !currentUser) return;

    socket.emit('message:send', {
      chatId,
      senderId: currentUser.id,
      content,
    });
  };

  const handleBackToMain = () => {
    setScreen('main');
    setChatPartner(null);
    setChatId(null);
    setMessages([]);
  };

  const handleExit = () => {
    if (socket) {
      socket.disconnect();
    }
    process.exit(0);
  };

  return (
    <Box flexDirection="column" minHeight={20}>
      {screen === 'login' && (
        <Login onLogin={handleLogin} onExit={handleExit} />
      )}

      {screen === 'main' && currentUser && (
        <MainScreen
          currentUser={currentUser}
          onStartChat={handleStartChat}
          onExit={handleExit}
        />
      )}

      {screen === 'chat' && currentUser && chatPartner && chatId && (
        <ChatScreen
          currentUser={currentUser}
          chatPartner={chatPartner}
          chatId={chatId}
          messages={messages}
          onBack={handleBackToMain}
          onSendMessage={handleSendMessage}
        />
      )}
    </Box>
  );
}

// Main entry point
render(<App />);
