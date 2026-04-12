import { Router } from 'express';
import { getDocumentIndexController } from './index.controller';

export const indexRouter = Router();

indexRouter.get('/documents/:documentId', getDocumentIndexController);