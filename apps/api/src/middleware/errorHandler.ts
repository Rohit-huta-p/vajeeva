import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal server error';
  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }
  res.status(status).json({ error: message });
};
