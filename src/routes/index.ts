import { Router } from 'express';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

apiRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Mini Search Engine API running'
  });
});