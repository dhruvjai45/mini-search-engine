import type { NextFunction, Request, Response } from 'express';
import { backfillUnindexedDocuments } from './backfill.service';

export async function backfillController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await backfillUnindexedDocuments();

    return res.status(200).json({
      success: true,
      message: 'Backfill completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}