import Foundation
import XCTest

@testable import BountyBoard

final class BountyValidationTests: XCTestCase {

    func testValidBountyPassesValidation() throws {
        let bounty = try TestFactory.bounty()
        XCTAssertNoThrow(try bounty.validate())
        XCTAssertEqual(bounty.status, .open)
        XCTAssertEqual(bounty.skills, ["Swift", "Solana"])
    }

    func testWhitespaceIsTrimmedFromTitleSponsorAndSkills() throws {
        let bounty = try Bounty(validated: UUID(),
            title: "  Padded title  ",
            sponsor: "  Solstice Labs ",
            rewardUSD: 100,
            skills: ["  Swift ", "Solana"],
            createdAt: TestFactory.date(days: -1),
            deadline: TestFactory.date(days: 7))
        XCTAssertEqual(bounty.title, "Padded title")
        XCTAssertEqual(bounty.sponsor, "Solstice Labs")
        XCTAssertEqual(bounty.skills, ["Swift", "Solana"])
    }

    func testEmptyTitleIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(title: "   ")) { error in
            XCTAssertEqual(error as? BountyError, .emptyTitle)
        }
    }

    func testEmptySponsorIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(sponsor: "")) { error in
            XCTAssertEqual(error as? BountyError, .emptySponsor)
        }
    }

    func testZeroRewardIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(rewardUSD: 0)) { error in
            XCTAssertEqual(error as? BountyError, .rewardNotPositive(0))
        }
    }

    func testNegativeRewardIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(rewardUSD: -50)) { error in
            XCTAssertEqual(error as? BountyError, .rewardNotPositive(-50))
        }
    }

    func testRewardAboveMaximumIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(rewardUSD: 250_001)) { error in
            XCTAssertEqual(
                error as? BountyError,
                .rewardTooLarge(250_001, max: Bounty.maxRewardUSD))
        }
    }

    func testRewardAtMaximumIsAccepted() throws {
        XCTAssertNoThrow(try TestFactory.bounty(rewardUSD: Bounty.maxRewardUSD))
    }

    func testDeadlineOnOrBeforeCreationIsRejected() throws {
        XCTAssertThrowsError(try Bounty(validated: UUID(),
            title: "Late bounty",
            sponsor: "Solstice Labs",
            rewardUSD: 100,
            skills: ["Swift"],
            createdAt: TestFactory.date(days: 0),
            deadline: TestFactory.date(days: 0))) { error in
            guard case .deadlineNotAfterCreated = error as? BountyError else {
                return XCTFail("Expected deadlineNotAfterCreated, got \(error)")
            }
        }
    }

    func testEmptySkillsAreRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(skills: [])) { error in
            XCTAssertEqual(error as? BountyError, .noSkills)
        }
    }

    func testBlankSkillIsRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(skills: ["Swift", "  "])) { error in
            XCTAssertEqual(error as? BountyError, .emptySkill)
        }
    }

    func testDuplicateSkillsCaseInsensitiveAreRejected() {
        XCTAssertThrowsError(try TestFactory.bounty(skills: ["Swift", "swift"])) { error in
            XCTAssertEqual(error as? BountyError, .duplicateSkills(["Swift", "swift"]))
        }
    }

    func testValidationErrorMessagesAreHumanReadable() {
        XCTAssertEqual(BountyError.emptyTitle.localizedDescription,
                       "Bounty title must not be empty.")
        XCTAssertEqual(BountyError.noSkills.localizedDescription,
                       "A bounty needs at least one skill.")
    }

    func testDaysRemainingCountsWholeDays() throws {
        let bounty = try TestFactory.bounty(deadlineInDays: 10)
        XCTAssertEqual(bounty.daysRemaining(from: TestFactory.referenceDate), 10)
    }

    func testIsActionableRequiresOpenStatusAndFutureDeadline() throws {
        let open = try TestFactory.bounty()
        XCTAssertTrue(open.isActionable(at: TestFactory.referenceDate))

        let completed = try TestFactory.bounty(status: .completed)
        XCTAssertFalse(completed.isActionable(at: TestFactory.referenceDate))

        let overdue = try TestFactory.bounty(deadlineInDays: -1)
        XCTAssertFalse(overdue.isActionable(at: TestFactory.referenceDate))
    }

    func testStatusDisplayNames() {
        XCTAssertEqual(BountyStatus.open.displayName, "Open")
        XCTAssertEqual(BountyStatus.inProgress.displayName, "In Progress")
        XCTAssertEqual(BountyStatus.completed.displayName, "Completed")
        XCTAssertEqual(BountyStatus.cancelled.displayName, "Cancelled")
    }
}
