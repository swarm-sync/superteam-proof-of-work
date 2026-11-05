'use strict';

const { AppError, unauthorized } = require('./errors');

/** Pre-handler: require a valid JWT. Sets request.user = { id, email }. */
async function requireAuth(request, reply) {
  try {
    await request.jwtVerify();
    request.user = { id: request.user.sub, email: request.user.email };
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

module.exports = { requireAuth };
