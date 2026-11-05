'use strict';

const { registerBody, loginBody } = require('../schemas');

async function authRoutes(fastify) {
  const { authService } = fastify;

  fastify.post('/auth/register', {
    schema: { body: registerBody },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { user, token } = authService.register(request.body);
    request.log.info({ userId: user.id }, 'user registered');
    return reply.code(201).send({ user, token });
  });

  fastify.post('/auth/login', {
    schema: { body: loginBody },
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { user, token } = authService.login(request.body);
    request.log.info({ userId: user.id }, 'user logged in');
    return reply.code(200).send({ user, token });
  });
}

module.exports = authRoutes;
