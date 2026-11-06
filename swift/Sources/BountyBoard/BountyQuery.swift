import Foundation

/// Which field a bounty list is sorted by.
public enum SortKey: String, CaseIterable, Sendable {
    case createdAt = "created_at"
    case reward = "reward"
    case deadline = "deadline"
    case title = "title"
}

/// Ascending or descending sort order.
public enum SortOrder: String, Sendable {
    case ascending = "asc"
    case descending = "desc"
}

/// Everything a browse request can filter on. Every field is optional:
/// a `nil` field means "no constraint".
public struct BountyFilter: Sendable, Equatable {
    public var status: BountyStatus?
    public var skill: String?
    public var sponsorContains: String?
    public var minRewardUSD: Decimal?
    public var maxRewardUSD: Decimal?
    public var actionableOnly: Bool

    public init(
        status: BountyStatus? = nil,
        skill: String? = nil,
        sponsorContains: String? = nil,
        minRewardUSD: Decimal? = nil,
        maxRewardUSD: Decimal? = nil,
        actionableOnly: Bool = false
    ) {
        self.status = status
        self.skill = skill
        self.sponsorContains = sponsorContains
        self.minRewardUSD = minRewardUSD
        self.maxRewardUSD = maxRewardUSD
        self.actionableOnly = actionableOnly
    }

    /// True when `bounty` satisfies every constraint in this filter.
    public func matches(_ bounty: Bounty, at date: Date = Date()) -> Bool {
        if let status, bounty.status != status { return false }
        if let skill {
            let wanted = skill.lowercased()
            guard bounty.skills.contains(where: { $0.lowercased() == wanted }) else {
                return false
            }
        }
        if let sponsorContains {
            guard bounty.sponsor.localizedCaseInsensitiveContains(sponsorContains) else {
                return false
            }
        }
        if let minRewardUSD, bounty.rewardUSD < minRewardUSD { return false }
        if let maxRewardUSD, bounty.rewardUSD > maxRewardUSD { return false }
        if actionableOnly, !bounty.isActionable(at: date) { return false }
        return true
    }
}

/// A validated page request. `page` is 1-based; `pageSize` is capped at 100.
public struct PageRequest: Sendable, Equatable {
    public static let maxPageSize = 100
    public static let defaultPageSize = 20

    public let page: Int
    public let pageSize: Int

    public init(page: Int = 1, pageSize: Int = defaultPageSize) throws {
        guard page >= 1 else {
            throw BountyError.invalidPageRequest("page must be >= 1, got \(page)")
        }
        guard pageSize >= 1 else {
            throw BountyError.invalidPageRequest("pageSize must be >= 1, got \(pageSize)")
        }
        guard pageSize <= Self.maxPageSize else {
            throw BountyError.invalidPageRequest(
                "pageSize must be <= \(Self.maxPageSize), got \(pageSize)")
        }
        self.page = page
        self.pageSize = pageSize
    }

    /// Zero-based offset of the first item on this page.
    public var offset: Int { (page - 1) * pageSize }
}

/// One page of results plus the totals a client needs to page through them.
public struct PagedResult<Item: Sendable>: Sendable {
    public let items: [Item]
    public let totalItems: Int
    public let page: Int
    public let pageSize: Int

    public var totalPages: Int {
        guard totalItems > 0 else { return 0 }
        return (totalItems + pageSize - 1) / pageSize
    }

    public var hasNextPage: Bool { page < totalPages }
    public var hasPreviousPage: Bool { page > 1 }
}

extension Array where Element == Bounty {
    /// Filters, sorts, and paginates a bounty list in one pass.
    /// Sorting is stable: equal keys keep their original order.
    public func query(
        filter: BountyFilter = BountyFilter(),
        sortKey: SortKey = .createdAt,
        sortOrder: SortOrder = .descending,
        page pageRequest: PageRequest? = nil,
        at date: Date = Date()
    ) -> PagedResult<Bounty> {
        // `PageRequest()` with defaults cannot throw; the fallback is unreachable
        // in practice, so force-unwrap is safe here.
        let request = pageRequest ?? (try! PageRequest())
        let filtered = self.filter { filter.matches($0, at: date) }
        let sorted = filtered.enumerated().sorted { lhs, rhs in
            let comparison: ComparisonResult
            switch sortKey {
            case .createdAt:
                comparison = lhs.element.createdAt.compare(rhs.element.createdAt)
            case .reward:
                comparison = (lhs.element.rewardUSD as NSDecimalNumber)
                    .compare(rhs.element.rewardUSD as NSDecimalNumber)
            case .deadline:
                comparison = lhs.element.deadline.compare(rhs.element.deadline)
            case .title:
                // Plain lexicographic order (<), not localizedStandardCompare:
                // title sort must be identical on every platform and locale,
                // including Linux, where localized comparison is ICU-dependent.
                comparison = lhs.element.title < rhs.element.title
                    ? .orderedAscending
                    : (lhs.element.title > rhs.element.title
                        ? .orderedDescending : .orderedSame)
            }
            if comparison != .orderedSame {
                return sortOrder == .ascending
                    ? comparison == .orderedAscending
                    : comparison == .orderedDescending
            }
            // Stable tie-break: keep the original order.
            return lhs.offset < rhs.offset
        }.map(\.element)

        let total = sorted.count
        let start = Swift.min(request.offset, total)
        let end = Swift.min(start + request.pageSize, total)
        return PagedResult(
            items: Array(sorted[start..<end]),
            totalItems: total,
            page: request.page,
            pageSize: request.pageSize
        )
    }
}
