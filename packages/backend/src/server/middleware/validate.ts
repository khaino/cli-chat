import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export type ValidationSource = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const candidate = req[source];
    const result = schema.safeParse(candidate);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors.map((e) => e.message).join('; '),
      });
    }
    (req as Request & { validated: T }).validated = result.data;
    next();
  };
}

export type ValidatedRequest<T> = Request & { validated: T };
