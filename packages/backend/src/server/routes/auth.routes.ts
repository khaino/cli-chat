import { Router } from 'express';
import {
  ApiPaths,
  LoginSchema,
  type LoginInput,
  type LoginResponse,
} from '@cli-chat/shared';
import type { AuthService } from '../../auth/AuthService.js';
import type { Logger } from '../../shared-infra/logger.js';
import { validate, type ValidatedRequest } from '../middleware/validate.js';

interface Deps {
  authService: AuthService;
  logger: Logger;
}

export function createAuthRouter(deps: Deps): Router {
  const router = Router();

  router.post(
    ApiPaths.Login.replace('/api', ''),
    validate(LoginSchema),
    async (req, res) => {
      try {
        const { username, password } = (req as ValidatedRequest<LoginInput>).validated;
        const result = await deps.authService.login(username, password);

        if (!result.ok) {
          const status = result.reason === 'missing-fields' ? 400 : 401;
          const response: LoginResponse = {
            success: false,
            error:
              result.reason === 'missing-fields'
                ? 'Username and password are required'
                : 'Invalid username or password',
          };
          return res.status(status).json(response);
        }

        const response: LoginResponse = { success: true, user: result.user };
        return res.json(response);
      } catch (err) {
        deps.logger.error('Login error', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  );

  return router;
}
