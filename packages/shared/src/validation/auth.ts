import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const StartChatSchema = z.object({
  currentUserId: z.string().min(1),
  targetUserId: z.string().min(1),
});
export type StartChatInput = z.infer<typeof StartChatSchema>;

export const SendMessageSchema = z.object({
  chatId: z.string().min(1),
  senderId: z.string().min(1),
  content: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const TypingSchema = z.object({
  chatId: z.string().min(1),
  userId: z.string().min(1),
});
export type TypingInput = z.infer<typeof TypingSchema>;

export const UserIdSchema = z.string().min(1);
