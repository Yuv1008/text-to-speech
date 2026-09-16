import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// Centralized error middleware — the only place responses take the error shape.
// Never forwards a stack trace, provider name, or key material to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error(err.message, { code: err.code, details: err.details, path: req.originalUrl });
    }
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field ? { field: err.field } : {}),
      },
    });
  }

  // Unexpected error: log full detail server-side, tell the client nothing but "something broke".
  logger.error('unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' },
  });
}
