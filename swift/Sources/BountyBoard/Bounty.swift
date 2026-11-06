import Foundation

/// The lifecycle state of a bounty listing.
public enum BountyStatus: String, Codable, CaseIterable, Sendable, Equatable {
    case open
    case inProgress = "in_progress"
    case completed
    case cancelled

    /// Human-readable label used in CLI output.
    public var displayName: String {
        switch self {
        case .open: return "Open"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
}

/// A single paid bounty listing, in the shape of a Superteam Earn board entry.
///
/// A sponsor posts a bounty with a US-dollar reward, a deadline, and the
/// skills a builder needs. Builders browse, filter, and sort listings.
///
/// Validation rules (enforced by ``Bounty/init(validated:)`` and
/// ``Bounty/validate()``):
/// - `title` and `sponsor` must be non-empty after trimming whitespace.
/// - `rewardUSD` must be greater than zero and at most `Bounty.maxRewardUSD`.
/// - `deadline` must be after `createdAt`.
/// - `skills` must be non-empty, with no case-insensitive duplicates, and
///   every skill non-empty after trimming.
public struct Bounty: Codable, Identifiable, Equatable, Sendable {
    /// Maximum reward a single bounty may offer (USD).
    public static let maxRewardUSD: Decimal = 250_000

    public let id: UUID
    public var title: String
    public var sponsor: String
    public var description: String
    public var rewardUSD: Decimal
    public var status: BountyStatus
    public var skills: [String]
    public var createdAt: Date
    public var deadline: Date

    public init(
        id: UUID = UUID(),
        title: String,
        sponsor: String,
        description: String = "",
        rewardUSD: Decimal,
        status: BountyStatus = .open,
        skills: [String],
        createdAt: Date = Date(),
        deadline: Date
    ) {
        self.id = id
        self.title = title
        self.sponsor = sponsor
        self.description = description
        self.rewardUSD = rewardUSD
        self.status = status
        self.skills = skills
        self.createdAt = createdAt
        self.deadline = deadline
    }

    /// Creates a bounty, throwing ``BountyError`` when any rule is broken.
    /// Trims whitespace from `title`, `sponsor`, and `skills` first.
    public init(validated id: UUID = UUID(),
                title: String,
                sponsor: String,
                description: String = "",
                rewardUSD: Decimal,
                status: BountyStatus = .open,
                skills: [String],
                createdAt: Date = Date(),
                deadline: Date) throws {
        let bounty = Bounty(
            id: id,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            sponsor: sponsor.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description.trimmingCharacters(in: .whitespacesAndNewlines),
            rewardUSD: rewardUSD,
            status: status,
            skills: skills.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) },
            createdAt: createdAt,
            deadline: deadline
        )
        try bounty.validate()
        self = bounty
    }

    /// Throws the first validation failure, or returns normally.
    public func validate() throws {
        if title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            throw BountyError.emptyTitle
        }
        if sponsor.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            throw BountyError.emptySponsor
        }
        if rewardUSD <= 0 {
            throw BountyError.rewardNotPositive(rewardUSD)
        }
        if rewardUSD > Self.maxRewardUSD {
            throw BountyError.rewardTooLarge(rewardUSD, max: Self.maxRewardUSD)
        }
        if deadline <= createdAt {
            throw BountyError.deadlineNotAfterCreated(deadline: deadline, createdAt: createdAt)
        }
        let cleaned = skills.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        if cleaned.isEmpty {
            throw BountyError.noSkills
        }
        if cleaned.contains(where: \.isEmpty) {
            throw BountyError.emptySkill
        }
        let lowered = cleaned.map { $0.lowercased() }
        if Set(lowered).count != lowered.count {
            throw BountyError.duplicateSkills(cleaned)
        }
    }

    /// Whole days remaining until the deadline from `date` (negative if overdue).
    public func daysRemaining(from date: Date = Date()) -> Int {
        let components = Calendar.current.dateComponents(
            [.day], from: Calendar.current.startOfDay(for: date),
            to: Calendar.current.startOfDay(for: deadline))
        return components.day ?? 0
    }

    /// True when the bounty is open and its deadline has not passed.
    public func isActionable(at date: Date = Date()) -> Bool {
        status == .open && deadline > date
    }

    // MARK: - Codable

    private enum CodingKeys: String, CodingKey {
        case id, title, sponsor, description, rewardUSD = "reward_usd",
             status, skills, createdAt = "created_at", deadline
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        sponsor = try container.decode(String.self, forKey: .sponsor)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        // Decode the reward as a string or a number; either is accepted.
        if let rewardString = try? container.decode(String.self, forKey: .rewardUSD),
           let decimal = Decimal(string: rewardString) {
            rewardUSD = decimal
        } else if let rewardNumber = try? container.decode(Double.self, forKey: .rewardUSD) {
            rewardUSD = Decimal(rewardNumber)
        } else {
            throw DecodingError.dataCorruptedError(
                forKey: .rewardUSD, in: container,
                debugDescription: "reward_usd must be a number or a numeric string")
        }
        status = try container.decode(BountyStatus.self, forKey: .status)
        skills = try container.decode([String].self, forKey: .skills)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        deadline = try container.decode(Date.self, forKey: .deadline)
        try validate()
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(title, forKey: .title)
        try container.encode(sponsor, forKey: .sponsor)
        try container.encode(description, forKey: .description)
        try container.encode(rewardUSD, forKey: .rewardUSD)
        try container.encode(status, forKey: .status)
        try container.encode(skills, forKey: .skills)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(deadline, forKey: .deadline)
    }
}
