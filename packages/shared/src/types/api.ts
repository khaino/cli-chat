import type { SafeUser, Chat, MessageWithSender } from './domain.js';

export interface ApiError {
  success: false;
  error: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type LoginResponse =
  | { success: true; user: SafeUser }
  | ApiError;

export interface GetUsersQuery {
  online?: boolean;
}

export type GetUsersResponse =
  | { success: true; users: SafeUser[] }
  | ApiError;

export interface StartChatRequest {
  currentUserId: string;
  targetUserId: string;
}

export type StartChatResponse =
  | {
      success: true;
      chat: Chat;
      participants: SafeUser[];
      messages: MessageWithSender[];
    }
  | ApiError;

export type GetMessagesResponse =
  | { success: true; messages: MessageWithSender[] }
  | ApiError;
