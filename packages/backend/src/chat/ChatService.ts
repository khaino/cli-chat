import type { Chat, MessageWithSender, SafeUser } from '@cli-chat/shared';
import type { ChatRepository } from '../database/repositories/ChatRepository.js';
import type { MessageRepository } from '../database/repositories/MessageRepository.js';
import type { UserRepository } from '../database/repositories/UserRepository.js';
import type { PresenceService } from './PresenceService.js';

export type StartChatFailureReason = 'self-chat' | 'user-not-found';

export type StartChatResult =
  | {
      ok: true;
      chat: Chat;
      participants: (SafeUser & { online: boolean })[];
      messages: MessageWithSender[];
    }
  | { ok: false; reason: StartChatFailureReason };

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
}

export class ChatService {
  constructor(
    private readonly chats: ChatRepository,
    private readonly messages: MessageRepository,
    private readonly users: UserRepository,
    private readonly presence: PresenceService
  ) {}

  startPrivate(currentUserId: string, targetUserId: string): StartChatResult {
    if (currentUserId === targetUserId) {
      return { ok: false, reason: 'self-chat' };
    }
    if (!this.users.getById(currentUserId) || !this.users.getById(targetUserId)) {
      return { ok: false, reason: 'user-not-found' };
    }

    const chat = this.chats.getOrCreatePrivate(currentUserId, targetUserId);
    const participants = this.presence.decorate(this.chats.getParticipants(chat.id));
    const messages = this.messages.listByChat(chat.id);
    return { ok: true, chat, participants, messages };
  }

  sendMessage(input: SendMessageInput): MessageWithSender {
    return this.messages.create(input);
  }

  listMessages(chatId: string): MessageWithSender[] {
    return this.messages.listByChat(chatId);
  }

  listParticipants(chatId: string): SafeUser[] {
    return this.chats.getParticipants(chatId);
  }
}
