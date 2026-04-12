import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../common/errors/AppError';
import { searchQuerySchema } from './search.schema';
import { searchDocuments } from './search.service';

export async function searchController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(', ');
      throw new ValidationError(message);
    }

    const result = await searchDocuments(parsed.data);

    return res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}