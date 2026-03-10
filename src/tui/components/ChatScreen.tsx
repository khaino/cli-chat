import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser, MessageWithSender } from '../../types/index.js';

interface ChatScreenProps {
  currentUser: SafeUser;
  chatPartner: SafeUser;
  chatId: string;
  messages: MessageWithSender[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

const ONLINE_SYMBOL = '●';

export function ChatScreen({ 
  currentUser, 
  chatPartner, 
  chatId,
  messages, 
  onBack, 
  onSendMessage 
}: ChatScreenProps): JSX.Element {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<React.ReactNode>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current = messages.length;
  }, [messages.length]);

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '/back' || trimmed === '/exit') {
      onBack();
      return;
    }
    
    if (trimmed.startsWith('/')) {
      if (trimmed === '/help') {
        // Show help - just ignore for now
        setInput('');
        return;
      }
      setInput('');
      return;
    }
    
    if (trimmed) {
      onSendMessage(trimmed);
      setInput('');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box flexDirection="column" padding={1} height="100%">
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text bold color="cyan">
            ═══════════════════════════════════════
          </Text>
        </Box>
        <Box>
          <Text bold>
            Chat with: <Text color="green">{chatPartner.username}</Text>
            {chatPartner.online && <Text color="green"> {ONLINE_SYMBOL}</Text>}
            {chatPartner.online === false && <Text color="gray"> {ONLINE_SYMBOL}</Text>}
          </Text>
        </Box>
        <Box>
          <Text dimColor>Type /back to return to main screen</Text>
        </Box>
        <Box>
          <Text bold color="cyan">
            ═══════════════════════════════════════
          </Text>
        </Box>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1} flexGrow={1}>
        {messages.length === 0 ? (
          <Text dimColor>No messages yet. Start the conversation!</Text>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUser.id;
            return (
              <Box key={msg.id} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text dimColor>{formatTime(msg.created_at)}</Text>
                  <Box marginLeft={1}>
                    <Text bold color={isOwnMessage ? 'green' : 'yellow'}>
                      {msg.sender_username}:
                    </Text>
                  </Box>
                </Box>
                <Box marginLeft={4}>
                  <Text>{msg.content}</Text>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Input */}
      <Box marginTop={1}>
        <Text color="cyan">Message: </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type a message or /back..."
        />
      </Box>
    </Box>
  );
}
