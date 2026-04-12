import type { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../common/errors/AppError';
import { createDocumentSchema } from './document.schema';
import { ingestDocument } from './document.service';

export async function createDocumentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = createDocumentSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(', ');
      throw new ValidationError(message);
    }

    const document = await ingestDocument(parsed.data);

    return res.status(201).json({
      success: true,
      message: 'Document ingested successfully',
      data: document
    });
  } catch (error) {
    next(error);
  }
}