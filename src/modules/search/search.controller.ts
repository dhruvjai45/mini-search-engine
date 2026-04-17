import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../common/errors/AppError';
import { searchQuerySchema } from './search.schema';
import { searchDocuments } from './search.service';
import { recordClick } from './click.repository';

export async function searchController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
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

// ✅ NEW: CLICK TRACKING ENDPOINT
export async function clickController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { documentId, query } = req.body;

    if (!documentId || !query) {
      throw new ValidationError('documentId and query are required');
    }

    await recordClick(documentId, query);

    return res.status(200).json({
      success: true,
      message: 'Click recorded'
    });
  } catch (error) {
    next(error);
  }
}