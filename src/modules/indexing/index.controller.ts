import type { NextFunction, Request, Response } from 'express';
import { getDocumentTermsByDocumentId } from './indexer.repository';

export async function getDocumentIndexController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const rawId = req.params.documentId;

        if (!rawId || Array.isArray(rawId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid documentId'
            });
        }

        const documentId = rawId;

        const terms = await getDocumentTermsByDocumentId(documentId);

        return res.status(200).json({
            success: true,
            data: {
                documentId,
                terms,
                totalTerms: terms.length
            }
        });
    } catch (error) {
        next(error);
    }
}