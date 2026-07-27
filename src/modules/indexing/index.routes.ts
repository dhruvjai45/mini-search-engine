import { Router } from 'express';
import { getDocumentIndexController } from './index.controller';
import { backfillController } from './backfill.controller';



const router = Router();
router.post('/backfill', backfillController);
export default router;



export const indexRouter = Router();

indexRouter.get('/documents/:documentId', getDocumentIndexController);