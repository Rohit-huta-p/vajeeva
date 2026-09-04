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
import { tagsAdminRouter, tagsPublicRouter } from './routes/tags.routes';
import { usersAdminRouter } from './routes/usersadmin.routes';
import { usersRouter, publicHealthFlagsRouter } from './routes/users.routes';
import { uploadsRouter } from './routes/uploads.routes';
import { statsAdminRouter } from './routes/stats.routes';
import { dietRulesAdminRouter } from './routes/dietrules.routes';

export function createApp() {
  const app = express();

  // Extra allowed origins for deployed browser clients (comma-separated),
  // e.g. ALLOWED_ORIGINS=https://vajeeva-web.onrender.com
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      const err: Error & { status?: number } = new Error('Not allowed by CORS');
      err.status = 403;
      return cb(err);
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
  app.use('/api/admin/tags', tagsAdminRouter);
  app.use('/api/admin/users', usersAdminRouter);
  app.use('/api/admin/stats', statsAdminRouter);
  app.use('/api/admin/diet-rules', dietRulesAdminRouter);
  app.use('/api/sources', sourcesPublicRouter);
  app.use('/api/subrecipes', subrecipesPublicRouter);
  app.use('/api/healthflags', publicHealthFlagsRouter);
  app.use('/api/tags', tagsPublicRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin/uploads', uploadsRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);
  return app;
}
