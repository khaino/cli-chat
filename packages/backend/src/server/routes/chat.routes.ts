import { Router } from 'express';
import {
  StartChatSchema,
  type StartChatInput,
  type StartChatResponse,
  type GetMessagesResponse,
} from '@cli-chat/shared';
import type { ChatService } from '../../chat/ChatService.js';
import type { Logger } from '../../shared-infra/logger.js';
import { validate, type ValidatedRequest } from '../middleware/validate.js';

interface Deps {
  chatService: ChatService;
  logger: Logger;
}

export function createChatRouter(deps: Deps): Router {
  const router = Router();

  router.post('/chat/start', validate(StartChatSchema), (req, res) => {
    try {
      const { currentUserId, targetUserId } = (
        req as ValidatedRequest<StartChatInput>
      ).validated;
      const result = deps.chatService.startPrivate(currentUserId, targetUserId);

      if (!result.ok) {
        const message =
          result.reason === 'self-chat'
            ? 'You cannot start a chat with yourself'
            : 'User not found';
        return res.status(400).json({ success: false, error: message });
      }

      const response: StartChatResponse = {
        success: true,
        chat: result.chat,
        participants: result.participants,
        messages: result.messages,
      };
      res.json(response);
    } catch (err) {
      deps.logger.error('Start chat error', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.get('/chat/:chatId/messages', (req, res) => {
    try {
      const messages = deps.chatService.listMessages(req.params.chatId);
      const response: GetMessagesResponse = { success: true, messages };
      res.json(response);
    } catch (err) {
      deps.logger.error('Get messages error', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
}
