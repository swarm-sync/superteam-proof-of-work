import Foundation

/// Validation and store failures for bounty listings.
public enum BountyError: Error, Equatable, Sendable {
    case emptyTitle
    case emptySponsor
    case rewardNotPositive(Decimal)
    case rewardTooLarge(Decimal, max: Decimal)
    case deadlineNotAfterCreated(deadline: Date, createdAt: Date)
    case noSkills
    case emptySkill
    case duplicateSkills([String])
    case notFound(UUID)
    case duplicateID(UUID)
    case invalidPageRequest(String)
}

extension BountyError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .emptyTitle:
            return "Bounty title must not be empty."
        case .emptySponsor:
            return "Bounty sponsor must not be empty."
        case .rewardNotPositive(let reward):
            return "Reward must be greater than zero, got \(reward)."
        case .rewardTooLarge(let reward, let max):
            return "Reward \(reward) exceeds the maximum of \(max)."
        case .deadlineNotAfterCreated(let deadline, let createdAt):
            return "Deadline \(deadline) must be after creation date \(createdAt)."
        case .noSkills:
            return "A bounty needs at least one skill."
        case .emptySkill:
            return "Skills must not be empty strings."
        case .duplicateSkills(let skills):
            return "Skills contain duplicates (case-insensitive): \(skills.joined(separator: ", "))."
        case .notFound(let id):
            return "No bounty with id \(id.uuidString)."
        case .duplicateID(let id):
            return "A bounty with id \(id.uuidString) already exists."
        case .invalidPageRequest(let message):
            return "Invalid page request: \(message)."
        }
    }
}
