import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { apiRouter } from './routes';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;