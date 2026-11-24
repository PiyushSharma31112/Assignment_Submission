import multer from 'multer';
import HttpError from '../utils/HttpError.js';

export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status || 500;
  let message = error.message || 'An unexpected server error occurred.';
  if (error instanceof multer.MulterError) {
    status = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'The file must be 10 MB or smaller.' : 'The uploaded file could not be accepted.';
  } else if (error.code === 11000) {
    status = 409;
    message = 'A record with those details already exists.';
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors).map((item) => item.message).join(' ');
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid resource ID.';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ message });
}
