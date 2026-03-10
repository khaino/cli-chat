import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { SafeUser } from '../../types/index.js';

interface LoginProps {
  onLogin: (user: SafeUser) => void;
  onExit: () => void;
}

interface LoginResponse {
  success: boolean;
  user?: SafeUser;
  error?: string;
}

export function Login({ onLogin, onExit }: LoginProps): JSX.Element {
  const [step, setStep] = useState<'username' | 'password' | 'retry'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [retryInput, setRetryInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setStep('password');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      
      const data = await response.json() as LoginResponse;
      
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
        setStep('retry');
      }
    } catch (err) {
      setError('Unable to connect to server. Make sure the server is running.');
      setStep('retry');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryChoice = (choice: string) => {
    const trimmedChoice = choice.trim().toLowerCase();
    if (trimmedChoice === 'exit' || trimmedChoice === 'e') {
      onExit();
    } else {
      // Default: retry
      setUsername('');
      setPassword('');
      setRetryInput('');
      setError(null);
      setStep('username');
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">Logging in...</Text>
      </Box>
    );
  }

  if (step === 'retry') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
        <Text dimColor>Press Enter to try again, or type 'exit' to quit:</Text>
        <TextInput
          value={retryInput}
          onChange={setRetryInput}
          placeholder="Press Enter to retry or type 'exit'"
          onSubmit={handleRetryChoice}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ╔══════════════════════════════╗
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ║      CLI Chat - Login        ║
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ╚══════════════════════════════╝
        </Text>
      </Box>
      
      {error && (
        <Box marginBottom={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
      
      {step === 'username' && (
        <Box flexDirection="column">
          <Text>Enter username:</Text>
          <TextInput
            value={username}
            onChange={setUsername}
            onSubmit={handleUsernameSubmit}
            placeholder="Username"
          />
        </Box>
      )}
      
      {step === 'password' && (
        <Box flexDirection="column">
          <Text>Username: <Text color="green">{username}</Text></Text>
          <Box marginTop={1}>
            <Text>Enter password:</Text>
          </Box>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handlePasswordSubmit}
            placeholder="Password"
            mask="*"
          />
        </Box>
      )}
    </Box>
  );
}
