import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser } from '@cli-chat/shared';
import type { ApiClient, UsersFilter } from '../services/apiClient.js';
import { parseCommand } from '../commands/parseCommand.js';
import { capitalize } from './MessageList.js';

interface MainScreenProps {
  api: ApiClient;
  currentUser: SafeUser;
  onStartChat: (user: SafeUser) => void;
  onExit: () => void;
}

type Panel =
  | { kind: 'welcome' }
  | { kind: 'users'; filter: UsersFilter; users: SafeUser[] }
  | { kind: 'help' }
  | { kind: 'message'; text: string };

const HELP_LINES: Array<[string, string]> = [
  ['/users', 'list all users'],
  ['/users -o', 'list online users only'],
  ['/user <name>', 'start a chat'],
  ['/help', 'this message'],
  ['/exit', 'quit'],
];

const COMMAND_LABEL_WIDTH = 14;

export function MainScreen({
  api,
  currentUser,
  onStartChat,
  onExit,
}: MainScreenProps): JSX.Element {
  const [input, setInput] = useState('');
  const [panel, setPanel] = useState<Panel>({ kind: 'welcome' });
  const [knownUsers, setKnownUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPanel({ kind: 'welcome' });
  }, [currentUser.id]);

  const fetchUsers = async (filter: UsersFilter): Promise<SafeUser[]> => {
    setLoading(true);
    try {
      const data = await api.getUsers(filter);
      if (data.success) {
        setKnownUsers(data.users);
        setPanel({ kind: 'users', filter, users: data.users });
        return data.users;
      }
      setPanel({ kind: 'message', text: 'Failed to fetch users.' });
      return [];
    } catch {
      setPanel({ kind: 'message', text: 'Unable to connect to server.' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const findUser = (username: string, list: SafeUser[]): SafeUser | undefined =>
    list.find((u) => u.username.toLowerCase() === username.toLowerCase());

  const handleStartChat = async (username: string) => {
    let target = findUser(username, knownUsers);
    if (!target) {
      const fresh = await fetchUsers('all');
      target = findUser(username, fresh);
    }
    if (!target) {
      setPanel({ kind: 'message', text: `User '${username}' not found.` });
      return;
    }
    if (target.id === currentUser.id) {
      setPanel({ kind: 'message', text: 'You cannot start a chat with yourself.' });
      return;
    }
    onStartChat(target);
  };

  const handleSubmit = async (raw: string) => {
    setInput('');
    const cmd = parseCommand(raw);
    switch (cmd.kind) {
      case 'list-users':
        await fetchUsers(cmd.filter);
        return;
      case 'start-chat':
        await handleStartChat(cmd.username);
        return;
      case 'help':
        setPanel({ kind: 'help' });
        return;
      case 'exit':
        onExit();
        return;
      case 'unknown':
        setPanel({
          kind: 'message',
          text: `Unknown command: ${cmd.raw}. Type /help for available commands.`,
        });
        return;
      default:
        setPanel({
          kind: 'message',
          text: 'Type a command starting with /. Type /help for commands.',
        });
    }
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">cli-chat</Text>
        <Text dimColor>{'  ·  '}</Text>
        <Text bold>{capitalize(currentUser.username)}</Text>
      </Box>

      <PanelView panel={panel} currentUserId={currentUser.id} loading={loading} />

      <Box marginTop={1}>
        <Text color="cyan">{'› '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type a command, e.g. /users"
        />
      </Box>
    </Box>
  );
}

interface PanelViewProps {
  panel: Panel;
  currentUserId: string;
  loading: boolean;
}

function PanelView({ panel, currentUserId, loading }: PanelViewProps): JSX.Element {
  if (loading) {
    return (
      <Box marginBottom={1}>
        <Text dimColor>loading…</Text>
      </Box>
    );
  }

  if (panel.kind === 'welcome') {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text>Welcome.</Text>
        <Box marginTop={1}>
          <Text dimColor>Type /help for commands.</Text>
        </Box>
      </Box>
    );
  }

  if (panel.kind === 'message') {
    return (
      <Box marginBottom={1}>
        <Text dimColor>{panel.text}</Text>
      </Box>
    );
  }

  if (panel.kind === 'help') {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Commands</Text>
        <Box flexDirection="column" marginTop={1}>
          {HELP_LINES.map(([cmd, desc]) => (
            <Box key={cmd}>
              <Box width={COMMAND_LABEL_WIDTH}>
                <Text>{cmd}</Text>
              </Box>
              <Text dimColor>{desc}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  const heading = panel.filter === 'online' ? 'Online' : 'Users';
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold>{`${heading} · ${panel.users.length}`}</Text>
      <Box flexDirection="column" marginTop={1}>
        {panel.users.map((user) => (
          <Box key={user.id}>
            <Text color={user.online ? 'green' : 'gray'}>
              {user.online ? '●' : '○'}
            </Text>
            <Text>{` ${capitalize(user.username)}`}</Text>
            {user.id === currentUserId && <Text dimColor>{'  (you)'}</Text>}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
