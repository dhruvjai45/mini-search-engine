import { Router } from 'express';
import { createDocumentController } from './document.controller';

export const documentRouter = Router();

documentRouter.post('/', createDocumentController);