import type { ErrorRequestHandler } from 'express';
import type { Logger } from '../../shared-infra/logger.js';

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    logger.error('Unhandled request error', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  };
}
