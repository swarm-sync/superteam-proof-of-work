import Foundation

/// A thread-safe in-memory store for bounty listings.
///
/// A single `NSLock` guards the backing array, so the store is safe to use
/// from concurrent callers (for example, a server handling many requests).
/// The store owns no persistence: load seed data with ``loadSeedData()`` or
/// import JSON with ``BountyJSON``.
public final class BountyStore: @unchecked Sendable {
    private var bounties: [Bounty] = []
    private let lock = NSLock()

    public init(bounties: [Bounty] = []) {
        self.bounties = bounties
    }

    /// All stored bounties, in insertion order.
    public var all: [Bounty] {
        lock.lock()
        defer { lock.unlock() }
        return bounties
    }

    public var count: Int {
        lock.lock()
        defer { lock.unlock() }
        return bounties.count
    }

    /// Adds a bounty after validating it. Throws ``BountyError/duplicateID(_:)``
    /// when another bounty already uses the same id.
    @discardableResult
    public func add(_ bounty: Bounty) throws -> Bounty {
        try bounty.validate()
        lock.lock()
        defer { lock.unlock() }
        guard !bounties.contains(where: { $0.id == bounty.id }) else {
            throw BountyError.duplicateID(bounty.id)
        }
        bounties.append(bounty)
        return bounty
    }

    /// The bounty with `id`, or `nil` when there is none.
    public func bounty(id: UUID) -> Bounty? {
        lock.lock()
        defer { lock.unlock() }
        return bounties.first(where: { $0.id == id })
    }

    /// Replaces the bounty with `id` by `updated` (which must keep the same
    /// id). Throws ``BountyError/notFound(_:)`` when `id` is unknown.
    @discardableResult
    public func update(id: UUID, with updated: Bounty) throws -> Bounty {
        try updated.validate()
        guard updated.id == id else {
            throw BountyError.invalidPageRequest(
                "updated bounty id \(updated.id.uuidString) does not match \(id.uuidString)")
        }
        lock.lock()
        defer { lock.unlock() }
        guard let index = bounties.firstIndex(where: { $0.id == id }) else {
            throw BountyError.notFound(id)
        }
        bounties[index] = updated
        return updated
    }

    /// Changes only the status of the bounty with `id`.
    @discardableResult
    public func setStatus(id: UUID, to status: BountyStatus) throws -> Bounty {
        lock.lock()
        defer { lock.unlock() }
        guard let index = bounties.firstIndex(where: { $0.id == id }) else {
            throw BountyError.notFound(id)
        }
        bounties[index].status = status
        return bounties[index]
    }

    /// Removes the bounty with `id`. Returns `true` when something was removed.
    @discardableResult
    public func remove(id: UUID) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard let index = bounties.firstIndex(where: { $0.id == id }) else {
            return false
        }
        bounties.remove(at: index)
        return true
    }

    /// Runs a full filter/sort/paginate query against the stored bounties.
    public func query(
        filter: BountyFilter = BountyFilter(),
        sortKey: SortKey = .createdAt,
        sortOrder: SortOrder = .descending,
        page pageRequest: PageRequest? = nil,
        at date: Date = Date()
    ) -> PagedResult<Bounty> {
        all.query(filter: filter, sortKey: sortKey, sortOrder: sortOrder,
                  page: pageRequest, at: date)
    }

    /// Total reward on offer across all currently open bounties.
    public func totalOpenRewards() -> Decimal {
        lock.lock()
        defer { lock.unlock() }
        return bounties
            .filter { $0.status == .open }
            .reduce(Decimal(0)) { $0 + $1.rewardUSD }
    }

    /// Loads the built-in demo listings, replacing any existing content.
    public func loadSeedData(referenceDate: Date = Date()) {
        lock.lock()
        defer { lock.unlock() }
        bounties = SeedData.bounties(referenceDate: referenceDate)
    }
}
