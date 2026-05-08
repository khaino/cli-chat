import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { MessageWithSender, SafeUser } from '@cli-chat/shared';
import { parseCommand } from '../commands/parseCommand.js';
import {
  capitalize,
  groupMessages,
  wrapText,
  type MessageGroup,
} from './MessageList.js';

interface ChatScreenProps {
  currentUser: SafeUser;
  chatPartner: SafeUser;
  messages: MessageWithSender[];
  typingUserIds: string[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

const PARTNER_COLOR = 'cyan';
const OWN_COLOR = 'green';
const MAX_BUBBLE_WIDTH = 60;

export function ChatScreen({
  currentUser,
  chatPartner,
  messages,
  typingUserIds,
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

  const groups = groupMessages(messages, currentUser.id);
  const partnerIsTyping = typingUserIds.includes(chatPartner.id);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">cli-chat</Text>
        <Text dimColor>{'  ·  '}</Text>
        <Text bold>{capitalize(currentUser.username)}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>{capitalize(chatPartner.username)}</Text>
        <Text color={chatPartner.online ? 'green' : 'gray'}>
          {chatPartner.online ? ' ●' : ' ○'}
        </Text>
      </Box>

      {groups.length === 0 ? (
        <Box marginBottom={1}>
          <Text dimColor>No messages yet. Say hello.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {groups.map((group, idx) => (
            <MessageBubble key={`${group.senderId}-${idx}`} group={group} />
          ))}
        </Box>
      )}

      {partnerIsTyping && (
        <Box marginBottom={1}>
          <Text dimColor>{`${capitalize(chatPartner.username)} is typing…`}</Text>
        </Box>
      )}

      <Box>
        <Text color="cyan">{'› '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type a message or /back"
        />
      </Box>
    </Box>
  );
}

function MessageBubble({ group }: { group: MessageGroup }): JSX.Element {
  const color = group.isOwn ? OWN_COLOR : PARTNER_COLOR;
  const label = group.isOwn ? 'You' : capitalize(group.senderUsername);

  const wrappedLines = group.contents.flatMap((c) =>
    wrapText(c, MAX_BUBBLE_WIDTH)
  );

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={color}>
          {label}
        </Text>
        <Text dimColor>{`  ${group.headerTime}`}</Text>
      </Box>
      {wrappedLines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </Box>
  );
}
