package bounty

/** Sample listings used by `listings seed` and the tests. All rewards are minor units. */
object SeedData {
    val requests: List<CreateListingRequest> = listOf(
        CreateListingRequest(
            title = "Build a Solana escrow program",
            description = "Write and test an Anchor escrow program with cancel and dispute flows, plus docs.",
            category = "DEVELOPMENT",
            rewardMinorUnits = 500_000L,
            currency = "USDC",
            deadline = "2027-03-01",
        ),
        CreateListingRequest(
            title = "Design a bounty board landing page",
            description = "Figma-first landing page for a bounty board: hero, listing cards, and mobile views.",
            category = "DESIGN",
            rewardMinorUnits = 120_000L,
            currency = "USDC",
            deadline = "2027-02-15",
        ),
        CreateListingRequest(
            title = "Write the Superteam Earn onboarding guide",
            description = "A clear step-by-step onboarding guide for new earners, with screenshots and FAQs.",
            category = "CONTENT",
            rewardMinorUnits = 45_000L,
            currency = "USDC",
            deadline = null,
        ),
        CreateListingRequest(
            title = "Audit a staking contract for reentrancy",
            description = "Manual audit of a staking contract focusing on reentrancy, access control, and math.",
            category = "SECURITY",
            rewardMinorUnits = 800_000L,
            currency = "SOL",
            deadline = "2027-01-20",
        ),
        CreateListingRequest(
            title = "Ship a Kotlin CLI for bounty listings",
            description = "A dependency-free Kotlin CLI that validates, filters, sorts and pages bounty listings.",
            category = "DEVELOPMENT",
            rewardMinorUnits = 250_000L,
            currency = "USDC",
            deadline = "2027-02-01",
        ),
        CreateListingRequest(
            title = "Research grant programs across L1s",
            description = "Compare grant programs across five L1 ecosystems: size, terms, and time to decision.",
            category = "RESEARCH",
            rewardMinorUnits = 90_000L,
            currency = "USD",
            deadline = null,
        ),
        CreateListingRequest(
            title = "Grow the bounty newsletter to 5k subs",
            description = "Own growth for the weekly bounty newsletter: content, referrals, and sponsorships.",
            category = "MARKETING",
            rewardMinorUnits = 150_000L,
            currency = "USDC",
            deadline = "2027-04-01",
        ),
        CreateListingRequest(
            title = "Fix flaky escrow integration tests",
            description = "Diagnose and fix the flaky escrow integration tests and add CI retries policy.",
            category = "DEVELOPMENT",
            rewardMinorUnits = 60_000L,
            currency = "USDC",
            deadline = "2027-01-10",
        ),
    )
}
