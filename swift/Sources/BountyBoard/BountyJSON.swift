import Foundation

/// JSON import/export for bounty listings.
///
/// The wire format uses `snake_case` keys and ISO 8601 dates, matching the
/// JSON files under `Tests/BountyBoardTests/Fixtures` and the sample file the
/// CLI reads with `--file`.
public enum BountyJSON {
    /// A decoder that reads ISO 8601 dates (`2026-11-20T00:00:00Z`).
    public static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }

    /// An encoder that writes ISO 8601 dates and sorted, readable keys.
    public static func makeEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }

    /// Decodes a JSON array of bounties. Each entry is validated on decode,
    /// so a single invalid listing fails the whole import with a clear error.
    public static func decodeList(from data: Data) throws -> [Bounty] {
        try makeDecoder().decode([Bounty].self, from: data)
    }

    /// Decodes a single bounty from JSON data.
    public static func decodeOne(from data: Data) throws -> Bounty {
        try makeDecoder().decode(Bounty.self, from: data)
    }

    /// Encodes bounties as a JSON array.
    public static func encodeList(_ bounties: [Bounty]) throws -> Data {
        try makeEncoder().encode(bounties)
    }

    /// Loads a JSON array of bounties from a file on disk.
    public static func loadFile(at url: URL) throws -> [Bounty] {
        try decodeList(from: Data(contentsOf: url))
    }
}

/// Realistic demo listings for the CLI and the tests. Sponsors and projects
/// are fictional; deadlines are relative to `referenceDate` so the data
/// stays fresh no matter when it is loaded.
public enum SeedData {
    public static func bounties(referenceDate now: Date = Date()) -> [Bounty] {
        func days(_ count: Int) -> Date {
            Calendar.current.date(byAdding: .day, value: count, to: now) ?? now
        }
        func hours(_ count: Int) -> Date {
            Calendar.current.date(byAdding: .hour, value: count, to: now) ?? now
        }

        // `try!` is safe here: every literal below satisfies the rules.
        return [
            try! Bounty(validated: UUID(),
                title: "Build a Solana wallet adapter demo in Swift",
                sponsor: "Solstice Labs",
                description: "A Swift package that signs a Solana transaction with a Wallet Adapter–compatible flow and shows it in a sample app.",
                rewardUSD: 5_000,
                skills: ["Swift", "Solana", "iOS"],
                createdAt: hours(-72),
                deadline: days(21)),
            try! Bounty(validated: UUID(),
                title: "Anchor program audit checklist generator",
                sponsor: "Desert Owl Security",
                description: "A CLI that reads an Anchor program and emits a ranked audit checklist with references to common vulnerability classes.",
                rewardUSD: 7_500,
                skills: ["Rust", "Anchor", "Security"],
                createdAt: hours(-48),
                deadline: days(14)),
            try! Bounty(validated: UUID(),
                title: "Design a bounty board landing page",
                sponsor: "Solstice Labs",
                description: "Figma-ready landing page for a bounty board: hero, live listings, sponsor strip, and mobile layouts.",
                rewardUSD: 1_200,
                skills: ["UI/UX Design", "Figma"],
                createdAt: hours(-24),
                deadline: days(10)),
            try! Bounty(validated: UUID(),
                title: "Token-2022 confidential transfer explainer",
                sponsor: "Mesa Docs Collective",
                description: "A technical explainer with runnable code samples for Token-2022 confidential transfers, aimed at working developers.",
                rewardUSD: 2_000,
                status: .inProgress,
                skills: ["Solana", "Technical Writing"],
                createdAt: hours(-120),
                deadline: days(7)),
            try! Bounty(validated: UUID(),
                title: "gRPC streaming indexer for Solana blocks",
                sponsor: "Canyon Index Co",
                description: "A Rust service that streams Solana blocks over gRPC, indexes program invocations, and exposes a query API.",
                rewardUSD: 12_000,
                skills: ["Rust", "gRPC", "Solana"],
                createdAt: hours(-96),
                deadline: days(30)),
            try! Bounty(validated: UUID(),
                title: "SwiftUI portfolio tracker for SPL tokens",
                sponsor: "Solstice Labs",
                description: "An iOS app that tracks SPL token balances and prices with offline caching and widgets.",
                rewardUSD: 4_000,
                skills: ["Swift", "SwiftUI", "iOS"],
                createdAt: hours(-12),
                deadline: days(18)),
            try! Bounty(validated: UUID(),
                title: "Write a Jupiter swap integration guide",
                sponsor: "Mesa Docs Collective",
                description: "Step-by-step guide integrating Jupiter swaps into a TypeScript dApp, with error handling and tests.",
                rewardUSD: 1_500,
                status: .completed,
                skills: ["TypeScript", "DeFi"],
                createdAt: hours(-240),
                deadline: days(-5)),
            try! Bounty(validated: UUID(),
                title: "Sponsor dashboard analytics in TypeScript",
                sponsor: "Canyon Index Co",
                description: "A React + TypeScript dashboard showing bounty funnel metrics for sponsors: views, submissions, payouts.",
                rewardUSD: 3_000,
                status: .cancelled,
                skills: ["TypeScript", "React"],
                createdAt: hours(-200),
                deadline: days(3)),
        ]
    }
}
