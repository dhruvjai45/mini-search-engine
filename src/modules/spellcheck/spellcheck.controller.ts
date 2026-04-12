import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../common/errors/AppError';
import { spellcheckQuerySchema } from './spellcheck.schema';
import { spellcheckService } from './spellcheck.service';

export async function spellcheckController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = spellcheckQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(', ');
      throw new ValidationError(message);
    }

    const result = spellcheckService.suggestQuery(parsed.data.q);

    return res.status(200).json({
      success: true,
      message: 'Spellcheck completed successfully',
      data: {
        ...result,
        limit: parsed.data.limit
      }
    });
  } catch (error) {
    next(error);
  }
}