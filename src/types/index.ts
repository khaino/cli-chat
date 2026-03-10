// User types
export interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  online?: boolean;
}

// Chat types
export interface Chat {
  id: string;
  created_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
}

// Message types
export interface Message {
  id: string;
  chat_id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender_username: string;
}

// API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: SafeUser;
  error?: string;
}

export interface SendMessageRequest {
  chat_id: string;
  content: string;
  sender_id: string;
}

// TUI State types
export type AppScreen = 'login' | 'main' | 'chat';

export interface AppState {
  currentScreen: AppScreen;
  currentUser: SafeUser | null;
  currentChat: Chat | null;
  chatPartner: SafeUser | null;
  error: string | null;
}
