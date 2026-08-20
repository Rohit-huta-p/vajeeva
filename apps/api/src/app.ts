import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);
  return app;
}
