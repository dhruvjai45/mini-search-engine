import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../common/errors/AppError';
import { autocompleteQuerySchema } from './autocomplete.schema';
import { autocompleteService } from './autocomplete.service';

export async function autocompleteController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = autocompleteQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(', ');
      throw new ValidationError(message);
    }

    const result = autocompleteService.getSuggestions(
      parsed.data.q,
      parsed.data.limit
    );

    return res.status(200).json({
      success: true,
      message: 'Suggestions fetched successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}