import type { SafeUser, LoginResponse } from '../types/index.js';

const API_BASE_URL = 'http://localhost:3000/api';

interface UsersResponse {
  success: boolean;
  users: SafeUser[];
  error?: string;
}

interface StartChatResponse {
  success: boolean;
  chat?: { id: string; created_at: string };
  participants?: SafeUser[];
  messages?: Array<{
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_username: string;
  }>;
  error?: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  return response.json() as Promise<LoginResponse>;
}

export async function getUsers(): Promise<UsersResponse> {
  const response = await fetch(`${API_BASE_URL}/users`);
  return response.json() as Promise<UsersResponse>;
}

export async function startChat(currentUserId: string, targetUserId: string): Promise<StartChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentUserId, targetUserId }),
  });
  
  return response.json() as Promise<StartChatResponse>;
}
