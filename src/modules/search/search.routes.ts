import { Router } from 'express';
import { searchController, clickController } from './search.controller';

export const searchRouter = Router();

searchRouter.get('/', searchController);

// ✅ THIS WAS MISSING EARLIER
searchRouter.post('/click', clickController);