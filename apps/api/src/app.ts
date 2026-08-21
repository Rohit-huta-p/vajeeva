import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { recipesRouter } from './routes/recipes.routes';
import { syncRouter } from './routes/sync.routes';
import { adminRouter } from './routes/admin.routes';
import { sourcesAdminRouter, sourcesPublicRouter } from './routes/sources.routes';
import { subrecipesAdminRouter, subrecipesPublicRouter } from './routes/subrecipes.routes';
import { healthFlagsAdminRouter } from './routes/healthflags.routes';
import { usersAdminRouter } from './routes/usersadmin.routes';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRouter);
  app.use('/api/recipes', recipesRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/admin/sources', sourcesAdminRouter);
  app.use('/api/admin/subrecipes', subrecipesAdminRouter);
  app.use('/api/admin/health-flags', healthFlagsAdminRouter);
  app.use('/api/admin/users', usersAdminRouter);
  app.use('/api/sources', sourcesPublicRouter);
  app.use('/api/subrecipes', subrecipesPublicRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);
  return app;
}
