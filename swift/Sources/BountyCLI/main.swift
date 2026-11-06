import BountyBoard
import Foundation

// MARK: - CLI

/// `bounty-board` — browse a bounty board from the terminal.
///
///     bounty-board [--status open] [--skill Swift] [--sponsor solstice]
///                  [--min-reward 1000] [--max-reward 5000]
///                  [--sort reward|created_at|deadline|title] [--order asc|desc]
///                  [--page 1] [--page-size 20]
///                  [--file bounties.json] [--json] [--summary]
///
/// Without `--file`, the built-in demo listings are used. `--json` prints
/// the current page as JSON instead of a table; `--summary` prints board
/// totals instead of listings.

let usage = """
Usage: bounty-board [options]

Options:
  --status <open|in_progress|completed|cancelled>   Filter by status
  --skill <name>        Filter by required skill (case-insensitive)
  --sponsor <text>      Filter by sponsor name substring (case-insensitive)
  --min-reward <usd>    Minimum reward in USD
  --max-reward <usd>    Maximum reward in USD
  --actionable-only     Only open bounties whose deadline has not passed
  --sort <created_at|reward|deadline|title>   Sort field (default: created_at)
  --order <asc|desc>    Sort order (default: desc)
  --page <n>            Page number, starting at 1 (default: 1)
  --page-size <n>       Results per page, 1-100 (default: 20)
  --file <path>         Load listings from a JSON file instead of demo data
  --json                Print the page as JSON instead of a table
  --summary             Print board totals instead of listings
  --help                Show this help
"""

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("Error: \(message)\n".utf8))
    exit(2)
}

func parseDecimal(_ text: String, flag: String) -> Decimal {
    guard let value = Decimal(string: text) else {
        fail("invalid number for \(flag): \(text)")
    }
    return value
}

func parseInt(_ text: String, flag: String) -> Int {
    guard let value = Int(text) else {
        fail("invalid integer for \(flag): \(text)")
    }
    return value
}

var filter = BountyFilter()
var sortKey = SortKey.createdAt
var sortOrder = SortOrder.descending
var page = 1
var pageSize = PageRequest.defaultPageSize
var filePath: String?
var asJSON = false
var showSummary = false

var args = Array(CommandLine.arguments.dropFirst())
var index = 0
while index < args.count {
    let arg = args[index]
    func nextValue(flag: String) -> String {
        guard index + 1 < args.count else { fail("missing value for \(flag)") }
        index += 1
        return args[index]
    }
    switch arg {
    case "--help", "-h":
        print(usage)
        exit(0)
    case "--status":
        let raw = nextValue(flag: arg)
        guard let status = BountyStatus(rawValue: raw) else {
            fail("unknown status '\(raw)' — use open, in_progress, completed, or cancelled")
        }
        filter.status = status
    case "--skill":
        filter.skill = nextValue(flag: arg)
    case "--sponsor":
        filter.sponsorContains = nextValue(flag: arg)
    case "--min-reward":
        filter.minRewardUSD = parseDecimal(nextValue(flag: arg), flag: arg)
    case "--max-reward":
        filter.maxRewardUSD = parseDecimal(nextValue(flag: arg), flag: arg)
    case "--actionable-only":
        filter.actionableOnly = true
    case "--sort":
        let raw = nextValue(flag: arg)
        guard let key = SortKey(rawValue: raw) else {
            fail("unknown sort field '\(raw)' — use created_at, reward, deadline, or title")
        }
        sortKey = key
    case "--order":
        let raw = nextValue(flag: arg)
        guard let order = SortOrder(rawValue: raw) else {
            fail("unknown order '\(raw)' — use asc or desc")
        }
        sortOrder = order
    case "--page":
        page = parseInt(nextValue(flag: arg), flag: arg)
    case "--page-size":
        pageSize = parseInt(nextValue(flag: arg), flag: arg)
    case "--file":
        filePath = nextValue(flag: arg)
    case "--json":
        asJSON = true
    case "--summary":
        showSummary = true
    default:
        fail("unknown option '\(arg)'. Run with --help.")
    }
    index += 1
}

let store = BountyStore()
if let filePath {
    do {
        let bounties = try BountyJSON.loadFile(at: URL(fileURLWithPath: filePath))
        for bounty in bounties {
            try store.add(bounty)
        }
    } catch {
        fail("could not load \(filePath): \(error.localizedDescription)")
    }
} else {
    store.loadSeedData()
}

if showSummary {
    let all = store.all
    let open = all.filter { $0.status == .open }
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    formatter.maximumFractionDigits = 0
    let total = store.totalOpenRewards() as NSDecimalNumber
    print("Bounties: \(all.count) total, \(open.count) open")
    print("Open rewards: \(formatter.string(from: total) ?? "$\(total)")")
    for status in BountyStatus.allCases {
        let count = all.filter { $0.status == status }.count
        print("  \(status.displayName): \(count)")
    }
    exit(0)
}

let pageRequest: PageRequest
do {
    pageRequest = try PageRequest(page: page, pageSize: pageSize)
} catch {
    fail(error.localizedDescription)
}

let result = store.query(
    filter: filter, sortKey: sortKey, sortOrder: sortOrder, page: pageRequest)

if asJSON {
    do {
        let data = try BountyJSON.encodeList(result.items)
        print(String(decoding: data, as: UTF8.self))
    } catch {
        fail("could not encode JSON: \(error.localizedDescription)")
    }
    exit(0)
}

if result.items.isEmpty {
    print("No bounties match. (\(result.totalItems) total, page \(result.page) of \(max(result.totalPages, 1)))")
    exit(0)
}

let dateFormatter = DateFormatter()
dateFormatter.dateStyle = .medium
dateFormatter.timeStyle = .none

let rewardFormatter = NumberFormatter()
rewardFormatter.numberStyle = .currency
rewardFormatter.currencyCode = "USD"
rewardFormatter.maximumFractionDigits = 0

for bounty in result.items {
    let reward = rewardFormatter.string(
        from: bounty.rewardUSD as NSDecimalNumber) ?? "$\(bounty.rewardUSD)"
    let days = bounty.daysRemaining()
    let daysText = days < 0 ? "overdue \(-days)d" : "\(days)d left"
    print("\(reward)  \(bounty.title)")
    print("  \(bounty.sponsor) · \(bounty.status.displayName) · \(bounty.skills.joined(separator: ", "))")
    print("  Deadline \(dateFormatter.string(from: bounty.deadline)) (\(daysText))")
    print("")
}
print("Page \(result.page) of \(max(result.totalPages, 1)) — showing \(result.items.count) of \(result.totalItems) bounties")
