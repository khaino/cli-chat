import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { MessageWithSender, SafeUser } from '@cli-chat/shared';
import { parseCommand } from '../commands/parseCommand.js';

interface ChatScreenProps {
  currentUser: SafeUser;
  chatPartner: SafeUser;
  messages: MessageWithSender[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

const ONLINE_SYMBOL = '●';

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatScreen({
  currentUser,
  chatPartner,
  messages,
  onBack,
  onSendMessage,
}: ChatScreenProps): JSX.Element {
  const [input, setInput] = useState('');

  const handleSubmit = (raw: string) => {
    setInput('');
    const cmd = parseCommand(raw);
    if (cmd.kind === 'back' || cmd.kind === 'exit') {
      onBack();
      return;
    }
    if (cmd.kind === 'message') {
      onSendMessage(cmd.content);
    }
  };

  return (
    <Box flexDirection="column" padding={1} height="100%">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">═══════════════════════════════════════</Text>
        <Text bold>
          Chat with: <Text color="green">{chatPartner.username}</Text>
          {chatPartner.online === true && <Text color="green">{` ${ONLINE_SYMBOL}`}</Text>}
          {chatPartner.online === false && <Text color="gray">{` ${ONLINE_SYMBOL}`}</Text>}
        </Text>
        <Text dimColor>Type /back to return to main screen</Text>
        <Text bold color="cyan">═══════════════════════════════════════</Text>
      </Box>

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
                      {`${msg.sender_username}:`}
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
