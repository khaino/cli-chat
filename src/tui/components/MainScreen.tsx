import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser } from '../../types/index.js';

interface MainScreenProps {
  currentUser: SafeUser;
  onStartChat: (user: SafeUser) => void;
  onExit: () => void;
}

interface UsersResponse {
  success: boolean;
  users: SafeUser[];
  error?: string;
}

type UsersFilter = 'all' | 'online';

export function MainScreen({ currentUser, onStartChat, onExit }: MainScreenProps): JSX.Element {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show welcome message
    setMessage(`Welcome, ${currentUser.username}! Type /help for available commands.`);
  }, [currentUser.username]);

  const fetchUsers = async (filter: UsersFilter = 'all') => {
    setLoading(true);
    try {
      const query = filter === 'online' ? '?online=true' : '';
      const response = await fetch(`http://localhost:3000/api/users${query}`);
      const data = await response.json() as UsersResponse;
      if (data.success) {
        setUsers(data.users);
        const descriptor = filter === 'online' ? 'online users' : 'users';
        setMessage(`Found ${data.users.length} ${descriptor}.`);
      } else {
        setMessage('Failed to fetch users.');
      }
    } catch (err) {
      setMessage('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    
    if (trimmedCmd === '/users') {
      await fetchUsers('all');
      return;
    }

    if (trimmedCmd === '/users -o' || trimmedCmd === '/users --online') {
      await fetchUsers('online');
      return;
    }
    
    if (trimmedCmd.startsWith('/user ')) {
      const targetUsername = trimmedCmd.slice(6).trim();
      if (!targetUsername) {
        setMessage('Usage: /user <username>');
        return;
      }
      
      // Find user in fetched users or fetch first
      let targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
      
      if (!targetUser) {
        // Try to fetch users first
        try {
          const response = await fetch('http://localhost:3000/api/users');
          const data = await response.json() as UsersResponse;
          if (data.success) {
            setUsers(data.users);
            targetUser = data.users.find((u) => 
              u.username.toLowerCase() === targetUsername.toLowerCase()
            );
          }
        } catch (err) {
          setMessage('Unable to connect to server.');
          return;
        }
      }
      
      if (!targetUser) {
        setMessage(`User '${targetUsername}' not found.`);
        return;
      }
      
      if (targetUser.id === currentUser.id) {
        setMessage('You cannot start a chat with yourself.');
        return;
      }
      
      onStartChat(targetUser);
      return;
    }
    
    if (trimmedCmd === '/help') {
      setMessage(
        'Available commands:\n' +
        '  /users         - List all users\n' +
        '  /users -o      - List online users only\n' +
        '  /user <username> - Start chat with user\n' +
        '  /exit          - Exit the application\n' +
        '  /help          - Show this help message'
      );
      return;
    }
    
    if (trimmedCmd === '/exit') {
      onExit();
      return;
    }
    
    if (trimmedCmd.startsWith('/')) {
      setMessage(`Unknown command: ${trimmedCmd}. Type /help for available commands.`);
      return;
    }
    
    setMessage('Type a command starting with /. Type /help for available commands.');
  };

  const handleSubmit = (value: string) => {
    setInput('');
    handleCommand(value);
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
          {users.map(user => (
            <Box key={user.id} marginLeft={2}>
              <Text>
                • {user.username}
                {user.online && <Text color="green"> ●</Text>}
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
        <Text color="cyan">&gt; </Text>
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
