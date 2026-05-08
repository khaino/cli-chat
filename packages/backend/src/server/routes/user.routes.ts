import { Router } from 'express';
import type { GetUsersResponse } from '@cli-chat/shared';
import type { UserRepository } from '../../database/repositories/UserRepository.js';
import type { PresenceService } from '../../chat/PresenceService.js';
import type { Logger } from '../../shared-infra/logger.js';

interface Deps {
  userRepo: UserRepository;
  presence: PresenceService;
  logger: Logger;
}

export function createUserRouter(deps: Deps): Router {
  const router = Router();

  router.get('/users', (req, res) => {
    try {
      const onlineOnly = req.query.online === 'true';
      const users = deps.presence.decorate(deps.userRepo.getAll());
      const filtered = onlineOnly ? users.filter((u) => u.online) : users;
      const response: GetUsersResponse = { success: true, users: filtered };
      res.json(response);
    } catch (err) {
      deps.logger.error('Get users error', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
}
