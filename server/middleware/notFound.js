import { AppError } from '../utils/errors.js';

export function notFound(req, res, next) {
  next(new AppError('NOT_FOUND', 'This endpoint does not exist.'));
}
