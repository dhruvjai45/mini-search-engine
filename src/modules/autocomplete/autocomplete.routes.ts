import { Router } from 'express';
import { autocompleteController } from './autocomplete.controller';

export const autocompleteRouter = Router();

autocompleteRouter.get('/suggest', autocompleteController);