import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);

  const isProduction = env.NODE_ENV === 'production';
  const message =
    err instanceof Error
      ? err.message
      : 'Something went wrong';

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : message
  });
}