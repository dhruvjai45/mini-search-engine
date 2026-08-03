import { Router } from 'express';
import { searchController, clickController } from './search.controller';

export const searchRouter = Router();

searchRouter.get('/', searchController);

searchRouter.post('/click', clickController);