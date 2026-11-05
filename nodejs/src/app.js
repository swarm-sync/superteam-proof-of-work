'use strict';

/**
 * App factory — builds a Fastify instance without listening, so tests can
 * use `fastify.inject()` with an in-memory database and no port.
 *
 * Why Fastify (not Express): schema-first validation is built in (Ajv,
 * no extra validator to wire up), it is ~2x faster on JSON workloads,
 * structured logging (Pino) and hooks ship by default, and its plugin
 * system keeps auth / rate-limiting as isolated, testable units.
 * Express would need express-validator + morgan + helmet + a JWT
 * middleware to reach the same baseline — more surface, more drift.
 */
const Fastify = require('fastify');
const fastifyJwt = require('@fastify/jwt');
const fastifyRateLimit = require('@fastify/rate-limit');
const crypto = require('node:crypto');

const config = require('./config');
const { createDb, seed } = require('./db');
const { UserRepository, BountyRepository } = require('./repositories/repositories');
const { AuthService } = require('./services/authService');
const { BountyService } = require('./services/bountyService');
const { AppError } = require('./errors');
const authRoutes = require('./routes/auth');
const bountyRoutes = require('./routes/bounties');

function buildApp(options = {}) {
  const dbPath = options.dbPath || config.dbPath;
  const db = createDb(dbPath);
  if (options.seed !== false) seed(db);

  const fastify = Fastify({
    logger: options.logger === false ? false : {
      level: process.env.LOG_LEVEL || 'info',
      // Never log Authorization headers or passwords.
      redact: ['req.headers.authorization', 'req.body.password'],
    },
    genReqId: () => crypto.randomUUID(),
  });

  // Services + repositories, attached for routes and tests.
  fastify.decorate('db', db);
  fastify.decorate('authService', new AuthService(new UserRepository(db), null));
  fastify.decorate('bountyService', new BountyService(new BountyRepository(db)));

  fastify.register(fastifyJwt, {
    secret: options.jwtSecret || config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  });
  fastify.register(fastifyRateLimit, {
    global: true,
    max: config.rateLimit.globalMax,
    timeWindow: config.rateLimit.globalWindowMs,
    errorResponseBuilder: () => ({
      error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded, try again later' },
    }),
  });

  // Wire the real JWT signer into the auth service once the plugin loads.
  fastify.addHook('onReady', async () => {
    fastify.authService.jwt = fastify.jwt;
  });

  // ---- Centralised error handling (Shane standard: typed errors only) ----
  fastify.setErrorHandler((error, request, reply) => {
    const requestId = request.id;
    if (error instanceof AppError) {
      request.log.warn({ err: error, requestId }, 'application error');
      return reply.code(error.status).send({
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), requestId },
      });
    }
    if (error.validation) {
      // Fastify/Ajv schema failure: 422 with the failing fields, no stack.
      request.log.warn({ validation: error.validation, requestId }, 'validation error');
      return reply.code(422).send({
        error: {
          code: 'VALIDATION_ERROR', message: 'Request validation failed',
          details: error.validation.map((v) => ({ field: v.instancePath || v.params?.missingProperty || '', message: v.message })),
          requestId,
        },
      });
    }
    // Unknown: log the stack server-side, return a generic 500 (no leak).
    request.log.error({ err: error, requestId }, 'unhandled error');
    return reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', requestId },
    });
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found`, requestId: request.id },
    });
  });

  fastify.get('/health', async () => ({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) }));
  fastify.get('/', async () => ({
    name: 'bounty-listings-api', version: '1.0.0',
    docs: 'See openapi.yaml for the full contract.',
    endpoints: ['GET /health', 'POST /auth/register', 'POST /auth/login', 'GET /bounties', 'POST /bounties'],
  }));

  fastify.register(authRoutes);
  fastify.register(bountyRoutes);

  return fastify;
}

module.exports = { buildApp };
