import Foundation
import XCTest

@testable import BountyBoard

final class BountyQueryTests: XCTestCase {
    private var bounties: [Bounty] = []

    override func setUpWithError() throws {
        bounties = try TestFactory.seedBounties()
    }

    func testNoFilterReturnsEverything() {
        let result = bounties.query(at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 6)
        XCTAssertEqual(result.items.count, 6)
    }

    func testFilterByStatus() {
        let result = bounties.query(
            filter: BountyFilter(status: .open), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 4)
        XCTAssertTrue(result.items.allSatisfy { $0.status == .open })
    }

    func testFilterBySkillIsCaseInsensitive() {
        let result = bounties.query(
            filter: BountyFilter(skill: "swift"), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 2)
        XCTAssertEqual(Set(result.items.map(\.title)),
                       ["Swift wallet adapter", "SwiftUI portfolio tracker"])
    }

    func testFilterBySkillWithNoMatchReturnsEmpty() {
        let result = bounties.query(
            filter: BountyFilter(skill: "Kotlin"), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 0)
        XCTAssertTrue(result.items.isEmpty)
        XCTAssertEqual(result.totalPages, 0)
        XCTAssertFalse(result.hasNextPage)
    }

    func testFilterBySponsorSubstringIsCaseInsensitive() {
        let result = bounties.query(
            filter: BountyFilter(sponsorContains: "solstice"), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 3)
        XCTAssertTrue(result.items.allSatisfy { $0.sponsor == "Solstice Labs" })
    }

    func testFilterByRewardRange() {
        let result = bounties.query(
            filter: BountyFilter(minRewardUSD: 4_000, maxRewardUSD: 7_500),
            at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 3)
        XCTAssertEqual(Set(result.items.map { $0.rewardUSD }),
                       [4_000, 5_000, 7_500])
    }

    func testFilterByMinRewardOnly() {
        let result = bounties.query(
            filter: BountyFilter(minRewardUSD: 10_000), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 1)
        XCTAssertEqual(result.items.first?.title, "gRPC block indexer")
    }

    func testCombinedFiltersIntersect() {
        let result = bounties.query(
            filter: BountyFilter(status: .open, skill: "Solana", minRewardUSD: 4_000),
            at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 2)
        XCTAssertEqual(Set(result.items.map(\.title)),
                       ["Swift wallet adapter", "gRPC block indexer"])
    }

    func testActionableOnlyExcludesCompletedAndOverdue() {
        let result = bounties.query(
            filter: BountyFilter(actionableOnly: true), at: TestFactory.referenceDate)
        XCTAssertEqual(result.totalItems, 4)
        XCTAssertTrue(result.items.allSatisfy { $0.status == .open })
    }

    func testSortByRewardDescendingIsDefaultForRewardKey() {
        let result = bounties.query(
            sortKey: .reward, sortOrder: .descending, at: TestFactory.referenceDate)
        XCTAssertEqual(result.items.map(\.rewardUSD),
                       [12_000, 7_500, 5_000, 4_000, 2_000, 1_200])
    }

    func testSortByRewardAscending() {
        let result = bounties.query(
            sortKey: .reward, sortOrder: .ascending, at: TestFactory.referenceDate)
        XCTAssertEqual(result.items.map(\.rewardUSD),
                       [1_200, 2_000, 4_000, 5_000, 7_500, 12_000])
    }

    func testSortByDeadlineAscending() {
        let result = bounties.query(
            sortKey: .deadline, sortOrder: .ascending, at: TestFactory.referenceDate)
        XCTAssertEqual(result.items.first?.title, "Token explainer")
        XCTAssertEqual(result.items.last?.title, "gRPC block indexer")
    }

    func testSortByTitleAscending() {
        let result = bounties.query(
            sortKey: .title, sortOrder: .ascending, at: TestFactory.referenceDate)
        XCTAssertEqual(result.items.map(\.title), result.items.map(\.title).sorted())
    }

    func testSortByCreatedAtDescendingPutsNewestFirst() {
        let result = bounties.query(
            sortKey: .createdAt, sortOrder: .descending, at: TestFactory.referenceDate)
        XCTAssertEqual(result.items.first?.title, "SwiftUI portfolio tracker")
        XCTAssertEqual(result.items.last?.title, "Token explainer")
    }

    func testSortingIsStableForEqualRewards() throws {
        let first = try TestFactory.bounty(title: "First equal", rewardUSD: 1_000)
        let second = try TestFactory.bounty(title: "Second equal", rewardUSD: 1_000)
        let result = [first, second].query(sortKey: .reward, sortOrder: .ascending)
        XCTAssertEqual(result.items.map(\.title), ["First equal", "Second equal"])
    }

    func testPaginationSplitsResults() throws {
        let page1 = bounties.query(
            sortKey: .reward, sortOrder: .descending,
            page: try PageRequest(page: 1, pageSize: 2), at: TestFactory.referenceDate)
        XCTAssertEqual(page1.items.map(\.rewardUSD), [12_000, 7_500])
        XCTAssertEqual(page1.totalItems, 6)
        XCTAssertEqual(page1.totalPages, 3)
        XCTAssertTrue(page1.hasNextPage)
        XCTAssertFalse(page1.hasPreviousPage)

        let page3 = bounties.query(
            sortKey: .reward, sortOrder: .descending,
            page: try PageRequest(page: 3, pageSize: 2), at: TestFactory.referenceDate)
        XCTAssertEqual(page3.items.map(\.rewardUSD), [2_000, 1_200])
        XCTAssertFalse(page3.hasNextPage)
        XCTAssertTrue(page3.hasPreviousPage)
    }

    func testPaginationBeyondLastPageReturnsEmptyPage() throws {
        let result = bounties.query(
            page: try PageRequest(page: 99, pageSize: 2), at: TestFactory.referenceDate)
        XCTAssertTrue(result.items.isEmpty)
        XCTAssertEqual(result.totalItems, 6)
        XCTAssertEqual(result.totalPages, 3)
    }

    func testPageRequestRejectsZeroPage() {
        XCTAssertThrowsError(try PageRequest(page: 0, pageSize: 10)) { error in
            XCTAssertEqual(error as? BountyError,
                           .invalidPageRequest("page must be >= 1, got 0"))
        }
    }

    func testPageRequestRejectsZeroPageSize() {
        XCTAssertThrowsError(try PageRequest(page: 1, pageSize: 0))
    }

    func testPageRequestRejectsPageSizeAboveMaximum() {
        XCTAssertThrowsError(try PageRequest(page: 1, pageSize: 101)) { error in
            XCTAssertEqual(error as? BountyError,
                           .invalidPageRequest("pageSize must be <= 100, got 101"))
        }
    }

    func testPageRequestOffset() throws {
        let request = try PageRequest(page: 3, pageSize: 20)
        XCTAssertEqual(request.offset, 40)
        XCTAssertEqual(PageRequest.maxPageSize, 100)
    }
}
