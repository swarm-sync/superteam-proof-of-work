'use strict';

/**
 * Typed application errors — every error carries a stable machine-readable
 * `code`, a human-readable `message`, and the correct HTTP `status`.
 * Handlers in app.js translate these (and only these) into the wire format
 * `{ error: { code, message, details?, requestId } }`.
 */
class AppError extends Error {
  constructor(code, message, status, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

const badRequest = (message, details) =>
  new AppError('BAD_REQUEST', message, 400, details);
const unauthorized = (message = 'Authentication required') =>
  new AppError('UNAUTHORIZED', message, 401);
const forbidden = (message = 'You do not have permission to do that') =>
  new AppError('FORBIDDEN', message, 403);
const notFound = (resource = 'Resource') =>
  new AppError('NOT_FOUND', `${resource} not found`, 404);
const conflict = (message, details) =>
  new AppError('CONFLICT', message, 409, details);
const unprocessable = (message, details) =>
  new AppError('VALIDATION_ERROR', message, 422, details);
const tooManyRequests = (message = 'Rate limit exceeded, try again later') =>
  new AppError('RATE_LIMITED', message, 429);

module.exports = {
  AppError, badRequest, unauthorized, forbidden, notFound, conflict,
  unprocessable, tooManyRequests,
};
