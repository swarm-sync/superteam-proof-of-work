'use strict';

// Fastify JSON Schemas (Ajv) — the single source of truth for request
// validation AND the OpenAPI contract in openapi.yaml. Keep them in sync:
// a field added here must be added there, and vice versa.
const SKILLS = ['Javascript', 'Typescript', 'React', 'Svelte', 'Vue', 'Python', 'SolidJS', 'Rust', 'Go'];

const email = { type: 'string', format: 'email', maxLength: 254 };
const password = { type: 'string', minLength: 8, maxLength: 128 };

const registerBody = {
  type: 'object', required: ['email', 'password', 'name'],
  additionalProperties: false,
  properties: {
    email, password,
    name: { type: 'string', minLength: 1, maxLength: 100 },
  },
};
const loginBody = {
  type: 'object', required: ['email', 'password'],
  additionalProperties: false,
  properties: { email, password },
};

const bountyBody = {
  type: 'object', required: ['title', 'description', 'skill', 'rewardUsd'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 5, maxLength: 120 },
    description: { type: 'string', minLength: 20, maxLength: 5000 },
    skill: { type: 'string', enum: SKILLS },
    rewardUsd: { type: 'integer', minimum: 1, maximum: 1000000 },
  },
};
const bountyPatchBody = {
  type: 'object', additionalProperties: false, minProperties: 1,
  properties: {
    title: { type: 'string', minLength: 5, maxLength: 120 },
    description: { type: 'string', minLength: 20, maxLength: 5000 },
    skill: { type: 'string', enum: SKILLS },
    rewardUsd: { type: 'integer', minimum: 1, maximum: 1000000 },
    status: { type: 'string', enum: ['open', 'in_progress', 'closed', 'cancelled'] },
  },
};
const applicationBody = {
  type: 'object', required: ['pitch'], additionalProperties: false,
  properties: { pitch: { type: 'string', minLength: 20, maxLength: 2000 } },
};

const listQuery = {
  type: 'object', additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['open', 'in_progress', 'closed', 'cancelled'] },
    skill: { type: 'string', enum: SKILLS },
    minReward: { type: 'integer', minimum: 1 },
    maxReward: { type: 'integer', minimum: 1 },
    search: { type: 'string', minLength: 1, maxLength: 100 },
    sort: { type: 'string', enum: ['created_at', 'reward_usd', 'title'], default: 'created_at' },
    order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
  },
};

const idParams = {
  type: 'object', required: ['id'],
  properties: { id: { type: 'string', minLength: 1, maxLength: 64 } },
};

module.exports = {
  SKILLS, registerBody, loginBody, bountyBody, bountyPatchBody,
  applicationBody, listQuery, idParams,
};
