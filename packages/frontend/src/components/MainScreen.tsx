import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser } from '@cli-chat/shared';
import type { ApiClient, UsersFilter } from '../services/apiClient.js';
import { parseCommand } from '../commands/parseCommand.js';

interface MainScreenProps {
  api: ApiClient;
  currentUser: SafeUser;
  onStartChat: (user: SafeUser) => void;
  onExit: () => void;
}

const HELP_TEXT =
  'Available commands:\n' +
  '  /users           - List all users\n' +
  '  /users -o        - List online users only\n' +
  '  /user <username> - Start chat with user\n' +
  '  /exit            - Exit the application\n' +
  '  /help            - Show this help message';

export function MainScreen({
  api,
  currentUser,
  onStartChat,
  onExit,
}: MainScreenProps): JSX.Element {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage(`Welcome, ${currentUser.username}! Type /help for available commands.`);
  }, [currentUser.username]);

  const fetchUsers = async (filter: UsersFilter): Promise<SafeUser[]> => {
    setLoading(true);
    try {
      const data = await api.getUsers(filter);
      if (data.success) {
        setUsers(data.users);
        const descriptor = filter === 'online' ? 'online users' : 'users';
        setMessage(`Found ${data.users.length} ${descriptor}.`);
        return data.users;
      }
      setMessage('Failed to fetch users.');
      return [];
    } catch {
      setMessage('Unable to connect to server.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const findUser = (username: string, list: SafeUser[]): SafeUser | undefined =>
    list.find((u) => u.username.toLowerCase() === username.toLowerCase());

  const handleStartChat = async (username: string) => {
    let target = findUser(username, users);
    if (!target) {
      const fresh = await fetchUsers('all');
      target = findUser(username, fresh);
    }
    if (!target) {
      setMessage(`User '${username}' not found.`);
      return;
    }
    if (target.id === currentUser.id) {
      setMessage('You cannot start a chat with yourself.');
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
        setMessage(HELP_TEXT);
        return;
      case 'exit':
        onExit();
        return;
      case 'unknown':
        setMessage(`Unknown command: ${cmd.raw}. Type /help for available commands.`);
        return;
      case 'message':
      case 'noop':
      case 'back':
      default:
        setMessage('Type a command starting with /. Type /help for available commands.');
        return;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="green">
          ✓ Logged in as: {currentUser.username}
        </Text>
      </Box>

      {message && (
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>{message}</Text>
        </Box>
      )}

      {users.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>Users:</Text>
          {users.map((user) => (
            <Box key={user.id} marginLeft={2}>
              <Text>
                {`• ${user.username}`}
                {user.online === true && <Text color="green"> ●</Text>}
                {user.online === false && <Text color="gray"> ●</Text>}
                {user.id === currentUser.id && <Text dimColor> (you)</Text>}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {loading && (
        <Box marginBottom={1}>
          <Text dimColor>Loading...</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="cyan">{'> '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type a command..."
        />
      </Box>
    </Box>
  );
}
