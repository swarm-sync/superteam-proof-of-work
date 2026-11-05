'use strict';

/**
 * Auth service — password hashing with scrypt (Node stdlib, no native
 * add-on), constant-time comparison, JWT issue/verify delegated to
 * @fastify/jwt. Passwords are never logged and never returned.
 */
const crypto = require('node:crypto');
const { conflict, unauthorized } = require('../errors');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

class AuthService {
  constructor(userRepo, jwt) { this.users = userRepo; this.jwt = jwt; }

  register({ email, password, name }) {
    if (this.users.findByEmail(email)) {
      throw conflict('An account with that email already exists');
    }
    const { salt, hash } = hashPassword(password);
    const user = this.users.create({ email, passwordHash: hash, passwordSalt: salt, name });
    return { user, token: this.jwt.sign({ sub: user.id, email: user.email }) };
  }

  login({ email, password }) {
    const row = this.users.findByEmail(email);
    if (!row || !verifyPassword(password, row.password_salt, row.password_hash)) {
      // Identical message either way: never reveal whether the email exists.
      throw unauthorized('Invalid email or password');
    }
    const user = { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
    return { user, token: this.jwt.sign({ sub: user.id, email: user.email }) };
  }
}

module.exports = { AuthService, hashPassword, verifyPassword };
