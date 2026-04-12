import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../common/errors/AppError';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  const message = err instanceof Error ? err.message : 'Something went wrong';
  const isProduction = env.NODE_ENV === 'production';

  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : message
  });
}