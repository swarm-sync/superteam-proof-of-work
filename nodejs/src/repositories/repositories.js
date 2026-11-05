'use strict';

/**
 * Repository layer — the ONLY place SQL lives. Services call these methods
 * and never touch the database directly, so swapping SQLite for Postgres
 * later means changing this folder, not the business logic.
 * All reads return plain objects; `null` means "not found" (services decide
 * the HTTP outcome — 404 vs. empty list).
 */
const crypto = require('node:crypto');

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}
function publicBounty(row) {
  if (!row) return null;
  return {
    id: row.id, title: row.title, description: row.description,
    skill: row.skill, rewardUsd: row.reward_usd, status: row.status,
    sponsorId: row.sponsor_id, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

class UserRepository {
  constructor(db) { this.db = db; }
  findByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase());
  }
  findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  create({ email, passwordHash, passwordSalt, name }) {
    const id = crypto.randomUUID();
    this.db.prepare('INSERT INTO users (id, email, password_hash, password_salt, name) VALUES (?, ?, ?, ?, ?)')
      .run(id, email.toLowerCase(), passwordHash, passwordSalt, name);
    return publicUser(this.findById(id));
  }
}

const ALLOWED_SORTS = { created_at: 'created_at', reward_usd: 'reward_usd', title: 'title' };

class BountyRepository {
  constructor(db) { this.db = db; }

  /** Paginated, filtered list. `filters` are already validated by the service. */
  list({ status, skill, minReward, maxReward, search, sort = 'created_at', order = 'desc', page = 1, pageSize = 20 }) {
    const where = [];
    const params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (skill) { where.push('skill = ?'); params.push(skill); }
    if (minReward !== undefined) { where.push('reward_usd >= ?'); params.push(minReward); }
    if (maxReward !== undefined) { where.push('reward_usd <= ?'); params.push(maxReward); }
    if (search) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sortCol = ALLOWED_SORTS[sort] || 'created_at';
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    const total = this.db.prepare(`SELECT COUNT(*) AS n FROM bounties ${clause}`).get(...params).n;
    const rows = this.db.prepare(
      `SELECT * FROM bounties ${clause} ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`,
    ).all(...params, pageSize, (page - 1) * pageSize);
    return { items: rows.map(publicBounty), total };
  }

  findById(id) {
    return publicBounty(this.db.prepare('SELECT * FROM bounties WHERE id = ?').get(id));
  }

  create({ title, description, skill, rewardUsd, sponsorId }) {
    const id = crypto.randomUUID();
    this.db.prepare(
      'INSERT INTO bounties (id, title, description, skill, reward_usd, sponsor_id) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, title, description, skill, rewardUsd, sponsorId);
    return this.findById(id);
  }

  /** Partial update — only whitelisted fields, `updated_at` bumped by SQL. */
  update(id, patch) {
    const sets = [];
    const params = [];
    for (const [col, key] of [['title', 'title'], ['description', 'description'], ['skill', 'skill'], ['reward_usd', 'rewardUsd'], ['status', 'status']]) {
      if (patch[key] !== undefined) { sets.push(`${col} = ?`); params.push(patch[key]); }
    }
    if (!sets.length) return this.findById(id);
    sets.push("updated_at = datetime('now')");
    this.db.prepare(`UPDATE bounties SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
    return this.findById(id);
  }

  delete(id) {
    return this.db.prepare('DELETE FROM bounties WHERE id = ?').run(id).changes > 0;
  }

  listApplications(bountyId) {
    return this.db.prepare(
      'SELECT id, bounty_id, applicant_id, pitch, created_at FROM applications WHERE bounty_id = ? ORDER BY created_at ASC',
    ).all(bountyId).map((r) => ({
      id: r.id, bountyId: r.bounty_id, applicantId: r.applicant_id,
      pitch: r.pitch, createdAt: r.created_at,
    }));
  }

  createApplication({ bountyId, applicantId, pitch }) {
    const id = crypto.randomUUID();
    this.db.prepare('INSERT INTO applications (id, bounty_id, applicant_id, pitch) VALUES (?, ?, ?, ?)')
      .run(id, bountyId, applicantId, pitch);
    return { id, bountyId, applicantId, pitch, createdAt: new Date().toISOString() };
  }
}

module.exports = { UserRepository, BountyRepository, publicUser };
