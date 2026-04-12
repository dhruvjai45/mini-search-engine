import { Router } from 'express';
import { spellcheckController } from './spellcheck.controller';

export const spellcheckRouter = Router();

spellcheckRouter.get('/', spellcheckController);