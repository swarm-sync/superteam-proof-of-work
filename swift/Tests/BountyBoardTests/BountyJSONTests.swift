import Foundation
import XCTest

@testable import BountyBoard

final class BountyJSONTests: XCTestCase {

    func testDecodesFixtureList() throws {
        let url = try XCTUnwrap(
            Bundle.module.url(forResource: "bounties", withExtension: "json",
                              subdirectory: "Fixtures"))
        let bounties = try BountyJSON.loadFile(at: url)
        XCTAssertEqual(bounties.count, 3)

        let first = bounties[0]
        XCTAssertEqual(first.id.uuidString, "11111111-1111-1111-1111-111111111111")
        XCTAssertEqual(first.title, "Build a Solana wallet adapter demo in Swift")
        XCTAssertEqual(first.sponsor, "Solstice Labs")
        XCTAssertEqual(first.rewardUSD, 5_000)
        XCTAssertEqual(first.status, .open)
        XCTAssertEqual(first.skills, ["Swift", "Solana", "iOS"])

        // Second entry stores the reward as a JSON string; it still decodes.
        XCTAssertEqual(bounties[1].rewardUSD, 7_500)
        XCTAssertEqual(bounties[1].status, .inProgress)
        XCTAssertEqual(bounties[2].status, .completed)
    }

    func testInvalidFixtureFailsDecoding() throws {
        let url = try XCTUnwrap(
            Bundle.module.url(forResource: "invalid-bounties", withExtension: "json",
                              subdirectory: "Fixtures"))
        XCTAssertThrowsError(try BountyJSON.loadFile(at: url)) { error in
            guard let bountyError = error as? BountyError else {
                // A decoding failure surfaces as BountyError via validate()
                // or as a DecodingError; either proves the bad file is rejected.
                XCTAssertTrue(error is DecodingError)
                return
            }
            XCTAssertEqual(bountyError, .emptyTitle)
        }
    }

    func testDecodeRejectsUnknownStatus() {
        let json = """
        [{
          "id": "55555555-5555-5555-5555-555555555555",
          "title": "Bad status",
          "sponsor": "Solstice Labs",
          "reward_usd": 100,
          "status": "archived",
          "skills": ["Swift"],
          "created_at": "2026-11-01T00:00:00Z",
          "deadline": "2026-11-22T00:00:00Z"
        }]
        """
        XCTAssertThrowsError(
            try BountyJSON.decodeList(from: Data(json.utf8)))
    }

    func testDecodeRejectsInvalidReward() {
        let json = """
        [{
          "id": "55555555-5555-5555-5555-555555555555",
          "title": "Bad reward",
          "sponsor": "Solstice Labs",
          "reward_usd": -5,
          "status": "open",
          "skills": ["Swift"],
          "created_at": "2026-11-01T00:00:00Z",
          "deadline": "2026-11-22T00:00:00Z"
        }]
        """
        XCTAssertThrowsError(
            try BountyJSON.decodeList(from: Data(json.utf8)))
    }

    func testEncodeDecodeRoundTrip() throws {
        let original = try TestFactory.seedBounties()
        let data = try BountyJSON.encodeList(original)
        let decoded = try BountyJSON.decodeList(from: data)
        XCTAssertEqual(decoded, original)
    }

    func testEncodedJSONUsesSnakeCaseKeysAndISO8601Dates() throws {
        let bounty = try TestFactory.bounty()
        let data = try BountyJSON.encodeList([bounty])
        let text = String(decoding: data, as: UTF8.self)
        XCTAssertTrue(text.contains("\"reward_usd\""))
        XCTAssertTrue(text.contains("\"created_at\""))
        XCTAssertTrue(text.contains("\"deadline\""))
        // ISO 8601 date, e.g. 2026-10-11T...
        XCTAssertTrue(text.contains("2026-10-11T"))
        XCTAssertFalse(text.contains("rewardUSD"))
    }

    func testSingleBountyDecodesWithoutDescription() throws {
        let json = """
        {
          "id": "66666666-6666-6666-6666-666666666666",
          "title": "No description field",
          "sponsor": "Solstice Labs",
          "reward_usd": 250,
          "status": "open",
          "skills": ["Swift"],
          "created_at": "2026-11-01T00:00:00Z",
          "deadline": "2026-11-22T00:00:00Z"
        }
        """
        let bounty = try BountyJSON.decodeOne(from: Data(json.utf8))
        XCTAssertEqual(bounty.description, "")
        XCTAssertEqual(bounty.rewardUSD, 250)
    }

    func testSeedDataRoundTripsThroughJSON() throws {
        let seed = SeedData.bounties(referenceDate: TestFactory.referenceDate)
        let data = try BountyJSON.encodeList(seed)
        let decoded = try BountyJSON.decodeList(from: data)
        XCTAssertEqual(decoded, seed)
    }
}
