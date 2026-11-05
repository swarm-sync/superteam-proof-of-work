'use strict';

const { requireAuth } = require('../auth');
const { bountyBody, bountyPatchBody, applicationBody, listQuery, idParams } = require('../schemas');

async function bountyRoutes(fastify) {
  const { bountyService } = fastify;

  // Public: list + read. Authenticated: create, edit, delete, apply.
  fastify.get('/bounties', { schema: { querystring: listQuery } }, async (request) => {
    return bountyService.list(request.query);
  });

  fastify.get('/bounties/:id', { schema: { params: idParams } }, async (request) => {
    return bountyService.get(request.params.id);
  });

  fastify.post('/bounties', {
    preHandler: requireAuth, schema: { body: bountyBody },
  }, async (request, reply) => {
    const bounty = bountyService.create(request.body, request.user.id);
    return reply.code(201).send(bounty);
  });

  fastify.patch('/bounties/:id', {
    preHandler: requireAuth, schema: { params: idParams, body: bountyPatchBody },
  }, async (request) => {
    return bountyService.update(request.params.id, request.body, request.user.id);
  });

  fastify.delete('/bounties/:id', {
    preHandler: requireAuth, schema: { params: idParams },
  }, async (request, reply) => {
    bountyService.remove(request.params.id, request.user.id);
    return reply.code(204).send();
  });

  fastify.post('/bounties/:id/applications', {
    preHandler: requireAuth, schema: { params: idParams, body: applicationBody },
  }, async (request, reply) => {
    const app = bountyService.apply(request.params.id, request.user.id, request.body.pitch);
    return reply.code(201).send(app);
  });

  fastify.get('/bounties/:id/applications', {
    preHandler: requireAuth, schema: { params: idParams },
  }, async (request) => {
    return bountyService.listApplications(request.params.id, request.user.id);
  });
}

module.exports = bountyRoutes;
