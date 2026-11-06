import Foundation
import XCTest

@testable import BountyBoard

final class BountyStoreTests: XCTestCase {
    private var store: BountyStore!

    override func setUpWithError() throws {
        store = BountyStore()
        for bounty in try TestFactory.seedBounties() {
            try store.add(bounty)
        }
    }

    func testStoreStartsEmpty() {
        XCTAssertEqual(BountyStore().count, 0)
        XCTAssertTrue(BountyStore().all.isEmpty)
    }

    func testAddAndFetchByID() throws {
        let bounty = try TestFactory.bounty(title: "Fresh bounty")
        let added = try store.add(bounty)
        XCTAssertEqual(added.id, bounty.id)
        XCTAssertEqual(store.bounty(id: bounty.id)?.title, "Fresh bounty")
        XCTAssertEqual(store.count, 7)
    }

    func testAddRejectsInvalidBounty() {
        let invalid = Bounty(
            id: UUID(), title: "", sponsor: "Solstice Labs", rewardUSD: 100,
            skills: ["Swift"],
            createdAt: TestFactory.date(days: -1), deadline: TestFactory.date(days: 7))
        XCTAssertThrowsError(try store.add(invalid)) { error in
            XCTAssertEqual(error as? BountyError, .emptyTitle)
        }
        XCTAssertEqual(store.count, 6)
    }

    func testAddRejectsDuplicateID() throws {
        let existing = try XCTUnwrap(store.all.first)
        XCTAssertThrowsError(try store.add(existing)) { error in
            XCTAssertEqual(error as? BountyError, .duplicateID(existing.id))
        }
    }

    func testBountyReturnsNilForUnknownID() {
        XCTAssertNil(store.bounty(id: UUID()))
    }

    func testUpdateReplacesBounty() throws {
        let existing = try XCTUnwrap(store.all.first)
        var updated = existing
        updated.title = "Renamed bounty"
        updated.rewardUSD = 9_999
        let result = try store.update(id: existing.id, with: updated)
        XCTAssertEqual(result.title, "Renamed bounty")
        XCTAssertEqual(store.bounty(id: existing.id)?.rewardUSD, 9_999)
        XCTAssertEqual(store.count, 6)
    }

    func testUpdateThrowsForUnknownID() throws {
        let bounty = try TestFactory.bounty()
        XCTAssertThrowsError(try store.update(id: bounty.id, with: bounty)) { error in
            XCTAssertEqual(error as? BountyError, .notFound(bounty.id))
        }
    }

    func testUpdateRejectsMismatchedID() throws {
        let existing = try XCTUnwrap(store.all.first)
        let other = try TestFactory.bounty()
        XCTAssertThrowsError(try store.update(id: existing.id, with: other))
    }

    func testSetStatusChangesOnlyStatus() throws {
        let existing = try XCTUnwrap(store.all.first(where: { $0.status == .open }))
        let updated = try store.setStatus(id: existing.id, to: .completed)
        XCTAssertEqual(updated.status, .completed)
        XCTAssertEqual(updated.title, existing.title)
        XCTAssertEqual(store.bounty(id: existing.id)?.status, .completed)
    }

    func testSetStatusThrowsForUnknownID() {
        XCTAssertThrowsError(try store.setStatus(id: UUID(), to: .completed)) { error in
            guard case .notFound = error as? BountyError else {
                return XCTFail("Expected notFound, got \(error)")
            }
        }
    }

    func testRemoveDeletesAndReports() throws {
        let existing = try XCTUnwrap(store.all.first)
        XCTAssertTrue(store.remove(id: existing.id))
        XCTAssertNil(store.bounty(id: existing.id))
        XCTAssertEqual(store.count, 5)
        XCTAssertFalse(store.remove(id: existing.id))
    }

    func testQueryDelegatesToFilterSortAndPagination() throws {
        let result = store.query(filter: BountyFilter(skill: "Rust"),
                                 sortKey: .reward, sortOrder: .descending,
                                 page: try PageRequest(page: 1, pageSize: 1),
                                 at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 2)
        XCTAssertEqual(result.items.first?.title, "gRPC block indexer")
    }

    func testTotalOpenRewardsSumsOnlyOpenBounties() {
        // Open: 5_000 + 1_200 + 12_000 + 4_000 = 22_200.
        XCTAssertEqual(store.totalOpenRewards(), 22_200)
    }

    func testLoadSeedDataReplacesContents() {
        store.loadSeedData(referenceDate: TestFactory.referenceDate)
        XCTAssertEqual(store.count, 8)
        XCTAssertTrue(store.all.allSatisfy { $0.deadline > TestFactory.referenceDate
            || $0.status == .completed })
    }

    func testSeedDataDeadlinesAreRelativeToReferenceDate() {
        let seed = SeedData.bounties(referenceDate: TestFactory.referenceDate)
        XCTAssertEqual(seed.count, 8)
        XCTAssertTrue(seed.contains { $0.skills.contains("Swift") })
        XCTAssertTrue(seed.contains { $0.status == .completed })
        XCTAssertTrue(seed.contains { $0.status == .cancelled })
    }

    func testConcurrentAddsAreSafe() throws {
        let fresh = BountyStore()
        let group = DispatchGroup()
        for index in 0..<50 {
            group.enter()
            DispatchQueue.global().async {
                let bounty = try? TestFactory.bounty(title: "Concurrent \(index)")
                if let bounty { try? fresh.add(bounty) }
                group.leave()
            }
        }
        group.wait()
        XCTAssertEqual(fresh.count, 50)
    }
}
