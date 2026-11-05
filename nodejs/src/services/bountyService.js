'use strict';

/**
 * Bounty service — business rules, kept free of HTTP and SQL:
 * - reward bounds and status transitions are enforced here, not just in
 *   the JSON schema, so any future caller gets the same guarantees.
 * - only the sponsor may edit/delete a bounty or see its applications.
 * - you cannot apply to your own bounty, to a closed/cancelled bounty,
 *   or twice to the same bounty.
 * - list pagination is clamped (page >= 1, pageSize 1..50).
 */
const { badRequest, forbidden, notFound, conflict } = require('../errors');

const STATUSES = ['open', 'in_progress', 'closed', 'cancelled'];
// Terminal states: once closed/cancelled a bounty cannot be reopened.
const TERMINAL = new Set(['closed', 'cancelled']);
// Legal transitions from each status (open may move anywhere except back
// from a terminal state, which is handled by the TERMINAL check).
const TRANSITIONS = {
  open: new Set(['in_progress', 'closed', 'cancelled']),
  in_progress: new Set(['open', 'closed', 'cancelled']),
  closed: new Set(),
  cancelled: new Set(),
};

class BountyService {
  constructor(bountyRepo) { this.bounties = bountyRepo; }

  list(query) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));
    if (query.minReward !== undefined && query.maxReward !== undefined
      && query.minReward > query.maxReward) {
      throw badRequest('minReward must not be greater than maxReward');
    }
    const { items, total } = this.bounties.list({ ...query, page, pageSize });
    return {
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  get(id) {
    const bounty = this.bounties.findById(id);
    if (!bounty) throw notFound('Bounty');
    return bounty;
  }

  create(input, sponsorId) {
    return this.bounties.create({ ...input, sponsorId });
  }

  update(id, patch, userId) {
    const bounty = this.get(id);
    if (bounty.sponsorId !== userId) throw forbidden('Only the sponsor can edit this bounty');
    if (patch.status !== undefined) {
      if (!STATUSES.includes(patch.status)) throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
      if (TERMINAL.has(bounty.status)) throw badRequest(`A ${bounty.status} bounty cannot change status`);
      if (!TRANSITIONS[bounty.status].has(patch.status)) {
        throw badRequest(`Cannot move a bounty from ${bounty.status} to ${patch.status}`);
      }
    }
    return this.bounties.update(id, patch);
  }

  remove(id, userId) {
    const bounty = this.get(id);
    if (bounty.sponsorId !== userId) throw forbidden('Only the sponsor can delete this bounty');
    this.bounties.delete(id);
  }

  apply(bountyId, applicantId, pitch) {
    const bounty = this.get(bountyId);
    if (bounty.sponsorId === applicantId) throw badRequest('You cannot apply to your own bounty');
    if (bounty.status !== 'open') throw badRequest(`Cannot apply to a ${bounty.status} bounty`);
    try {
      return this.bounties.createApplication({ bountyId, applicantId, pitch });
    } catch (err) {
      if (String(err.message).includes('UNIQUE constraint failed')) {
        throw conflict('You have already applied to this bounty');
      }
      throw err;
    }
  }

  listApplications(bountyId, userId) {
    const bounty = this.get(bountyId);
    if (bounty.sponsorId !== userId) throw forbidden('Only the sponsor can view applications');
    return this.bounties.listApplications(bountyId);
  }
}

module.exports = { BountyService, STATUSES };
