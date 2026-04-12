import { Router } from 'express';
import { healthRouter } from './health.routes';
import { documentRouter } from '../modules/documents/document.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Mini Search Engine API is running'
  });
});

apiRouter.use('/health', healthRouter);
apiRouter.use('/documents', documentRouter);