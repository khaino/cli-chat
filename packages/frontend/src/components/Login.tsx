import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser } from '@cli-chat/shared';
import type { ApiClient } from '../services/apiClient.js';

interface LoginProps {
  api: ApiClient;
  onLogin: (user: SafeUser) => void;
  onExit: () => void;
}

type Field = 'username' | 'password';

export function Login({ api, onLogin }: LoginProps): JSX.Element {
  const [field, setField] = useState<Field>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.login(username.trim(), password);
      if (data.success) {
        onLogin(data.user);
        return;
      }
      setError(data.error || 'Login failed.');
      setPassword('');
      setField('password');
    } catch {
      setError('Unable to connect to server. Make sure it is running.');
      setPassword('');
      setField('password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUsernameSubmit = () => {
    if (!username.trim()) return;
    setField('password');
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">cli-chat</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Sign in</Text>
      </Box>

      <Box>
        <Text dimColor>username  </Text>
        {field === 'username' ? (
          <TextInput
            value={username}
            onChange={setUsername}
            onSubmit={handleUsernameSubmit}
          />
        ) : (
          <Text>{username}</Text>
        )}
      </Box>

      <Box>
        <Text dimColor>password  </Text>
        {field === 'password' && !submitting ? (
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={submit}
            mask="•"
          />
        ) : (
          <Text>{password.replace(/./g, '•')}</Text>
        )}
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {submitting
            ? 'signing in…'
            : 'enter to continue · ctrl+c to quit'}
        </Text>
      </Box>
    </Box>
  );
}
