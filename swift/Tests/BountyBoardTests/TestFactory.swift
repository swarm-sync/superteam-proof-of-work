import Foundation

@testable import BountyBoard

/// Shared factory for deterministic test bounties.
enum TestFactory {
    static let referenceDate = Date(timeIntervalSince1970: 1_792_000_000) // 2026-10-14

    static func date(days offset: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: offset, to: referenceDate)!
    }

    static func bounty(
        title: String = "Build a Solana wallet adapter demo in Swift",
        sponsor: String = "Solstice Labs",
        rewardUSD: Decimal = 5_000,
        status: BountyStatus = .open,
        skills: [String] = ["Swift", "Solana"],
        createdDaysAgo: Int = 3,
        deadlineInDays: Int = 21
    ) throws -> Bounty {
        try Bounty(validated: UUID(),
            title: title,
            sponsor: sponsor,
            rewardUSD: rewardUSD,
            status: status,
            skills: skills,
            createdAt: date(days: -createdDaysAgo),
            deadline: date(days: deadlineInDays))
    }

    static func seedBounties() throws -> [Bounty] {
        [
            try bounty(title: "Swift wallet adapter", sponsor: "Solstice Labs",
                       rewardUSD: 5_000, skills: ["Swift", "Solana"],
                       createdDaysAgo: 3, deadlineInDays: 21),
            try bounty(title: "Anchor audit checklist", sponsor: "Desert Owl Security",
                       rewardUSD: 7_500, status: .inProgress, skills: ["Rust", "Anchor"],
                       createdDaysAgo: 2, deadlineInDays: 14),
            try bounty(title: "Landing page design", sponsor: "Solstice Labs",
                       rewardUSD: 1_200, skills: ["UI/UX Design", "Figma"],
                       createdDaysAgo: 1, deadlineInDays: 10),
            try bounty(title: "gRPC block indexer", sponsor: "Canyon Index Co",
                       rewardUSD: 12_000, skills: ["Rust", "gRPC", "Solana"],
                       createdDaysAgo: 4, deadlineInDays: 30),
            try bounty(title: "Token explainer", sponsor: "Mesa Docs Collective",
                       rewardUSD: 2_000, status: .completed, skills: ["Solana"],
                       createdDaysAgo: 10, deadlineInDays: -5),
            try bounty(title: "SwiftUI portfolio tracker", sponsor: "Solstice Labs",
                       rewardUSD: 4_000, skills: ["Swift", "SwiftUI"],
                       createdDaysAgo: 0, deadlineInDays: 18),
        ]
    }
}
