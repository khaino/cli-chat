import type { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  SendMessageSchema,
  TypingSchema,
  UserIdSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@cli-chat/shared';
import type { ChatService } from '../../chat/ChatService.js';
import type { PresenceService } from '../../chat/PresenceService.js';
import type { Logger } from '../../shared-infra/logger.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface Deps {
  chatService: ChatService;
  presence: PresenceService;
  logger: Logger;
}

export function registerSocketHandlers(io: IoServer, deps: Deps): void {
  io.on('connection', (socket: IoSocket) => {
    deps.logger.debug(`Socket connected: ${socket.id}`);

    socket.on(SocketEvents.UserJoin, (userId) => {
      const result = UserIdSchema.safeParse(userId);
      if (!result.success) return;

      deps.presence.setOnline(result.data, socket.id);
      socket.join(`user:${result.data}`);
      socket.broadcast.emit(SocketEvents.PresenceUpdate, {
        userId: result.data,
        online: true,
      });
      deps.logger.debug(`User ${result.data} joined via socket ${socket.id}`);
    });

    socket.on(SocketEvents.MessageSend, (payload) => {
      const result = SendMessageSchema.safeParse(payload);
      if (!result.success) {
        deps.logger.warn('Invalid message:send payload', result.error.errors);
        return;
      }

      try {
        const message = deps.chatService.sendMessage(result.data);
        const participants = deps.chatService.listParticipants(result.data.chatId);
        for (const participant of participants) {
          io.to(`user:${participant.id}`).emit(SocketEvents.MessageReceive, message);
        }
      } catch (err) {
        deps.logger.error('Failed to send message', err);
      }
    });

    socket.on(SocketEvents.TypingStart, (payload) => {
      const result = TypingSchema.safeParse(payload);
      if (!result.success) return;
      const participants = deps.chatService.listParticipants(result.data.chatId);
      for (const p of participants) {
        if (p.id !== result.data.userId) {
          socket.to(`user:${p.id}`).emit(SocketEvents.TypingIndicator, {
            userId: result.data.userId,
          });
        }
      }
    });

    socket.on(SocketEvents.TypingStop, (payload) => {
      const result = TypingSchema.safeParse(payload);
      if (!result.success) return;
      const participants = deps.chatService.listParticipants(result.data.chatId);
      for (const p of participants) {
        if (p.id !== result.data.userId) {
          socket.to(`user:${p.id}`).emit(SocketEvents.TypingStopped, {
            userId: result.data.userId,
          });
        }
      }
    });

    socket.on('disconnect', () => {
      const userId = deps.presence.setOfflineBySocket(socket.id);
      if (userId) {
        socket.broadcast.emit(SocketEvents.PresenceUpdate, { userId, online: false });
        deps.logger.debug(`User ${userId} disconnected (socket ${socket.id})`);
      }
    });
  });
}
