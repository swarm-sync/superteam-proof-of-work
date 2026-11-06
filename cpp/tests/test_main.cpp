// Unit tests for the bounty-listings engine. No framework — a tiny
// CHECK harness so the suite stays dependency-free like the program.
// Run with: make test
#include <iostream>
#include <string>
#include <vector>

#include "importer.h"
#include "listing.h"
#include "query.h"
#include "store.h"

static int g_passed = 0;
static int g_failed = 0;

#define CHECK(cond) do { \
    if (cond) { ++g_passed; } \
    else { ++g_failed; std::cout << "FAIL " << __FILE__ << ":" << __LINE__ \
        << ": CHECK(" #cond ")\n"; } \
} while (0)

static bounty::Listing make_listing(const std::string& id, int reward,
                                    const std::string& skill = "C++",
                                    bounty::Status st = bounty::Status::Open) {
    bounty::Listing l;
    l.id = id; l.title = "Build " + id; l.org = "Solana Org";
    l.reward_usd = reward; l.skills = {skill, "Solana"}; l.status = st;
    return l;
}

static void test_validation() {
    CHECK(make_listing("a", 100).valid());
    bounty::Listing empty_id = make_listing("", 100);
    CHECK(!empty_id.valid());
    bounty::Listing neg = make_listing("b", -5);
    CHECK(!neg.valid());
    bounty::Listing no_skills = make_listing("c", 100);
    no_skills.skills.clear();
    CHECK(!no_skills.valid());
    bounty::Listing zero = make_listing("d", 0);
    CHECK(zero.valid());  // $0 (unpaid / glory) is allowed
    bool ok = false;
    CHECK(bounty::status_from_string("open", ok) == bounty::Status::Open && ok);
    CHECK(bounty::status_from_string("CLOSED", ok) == bounty::Status::Closed && ok);
    bounty::status_from_string("bogus", ok);
    CHECK(!ok);
    CHECK(bounty::status_to_string(bounty::Status::Closed) == "closed");
}

static void test_skills_and_keywords() {
    auto l = make_listing("a", 100, "C++");
    CHECK(l.has_skill("c++"));   // case-insensitive
    CHECK(l.has_skill("Solana"));
    CHECK(!l.has_skill("Rust"));
    CHECK(l.matches_keyword("build"));
    CHECK(l.matches_keyword("SOLANA"));  // org match, case-insensitive
    CHECK(!l.matches_keyword("ethereum"));
    CHECK(l.matches_keyword(""));       // empty keyword matches everything
}

static void test_store() {
    bounty::Store s;
    std::string err;
    CHECK(s.add(make_listing("a", 100), err));
    CHECK(s.size() == 1);
    CHECK(s.find("a") != nullptr);
    CHECK(s.find("missing") == nullptr);
    CHECK(!s.add(make_listing("a", 200), err));  // duplicate id rejected
    CHECK(s.size() == 1);
    CHECK(!s.add(make_listing("", 100), err));    // invalid rejected
    CHECK(s.size() == 1);
}

static void test_query() {
    std::vector<bounty::Listing> all = {
        make_listing("low", 100, "C++"),
        make_listing("mid", 500, "Rust"),
        make_listing("high", 1000, "C++", bounty::Status::Closed),
    };
    bounty::Filter f;
    CHECK(bounty::apply_filter(all, f).size() == 3);  // empty filter = all
    f.skill = "c++";
    CHECK(bounty::apply_filter(all, f).size() == 2);
    f.min_reward_usd = 500;
    CHECK(bounty::apply_filter(all, f).size() == 1);  // only "high"
    f = bounty::Filter{};
    f.status = bounty::Status::Closed;
    CHECK(bounty::apply_filter(all, f).size() == 1);
    f = bounty::Filter{};
    f.keyword = "low";
    // keyword searches title ("Build low"), not id
    CHECK(bounty::apply_filter(all, f).size() == 1);

    auto sorted = bounty::query(all, bounty::Filter{}, bounty::SortKey::RewardDesc);
    CHECK(sorted[0].id == "high" && sorted[2].id == "low");
    sorted = bounty::query(all, bounty::Filter{}, bounty::SortKey::RewardAsc);
    CHECK(sorted[0].id == "low" && sorted[2].id == "high");
    sorted = bounty::query(all, bounty::Filter{}, bounty::SortKey::TitleAsc);
    CHECK(sorted[0].title < sorted[1].title && sorted[1].title < sorted[2].title);
}

static void test_importer() {
    std::vector<bounty::Listing> out;
    std::string err;
    const std::string good =
        R"([{"id":"bty-001","title":"Fix indexer","org":"Acme","reward_usd":750,)"
        R"("skills":["C++","Solana"],"status":"open"},)"
        R"({"id":"bty-002","title":"Docs","org":"Acme","reward_usd":100,)"
        R"("skills":["Writing"]}])";  // status defaults to open
    CHECK(bounty::import_json(good, out, err));
    CHECK(out.size() == 2);
    CHECK(out[0].reward_usd == 750 && out[0].has_skill("C++"));
    CHECK(out[1].status == bounty::Status::Open);

    CHECK(bounty::import_json("[]", out, err) && out.empty());
    CHECK(!bounty::import_json("not json", out, err));
    CHECK(!bounty::import_json(R"([{"id":"x"}])", out, err));  // missing fields
    CHECK(!bounty::import_json(
        R"([{"id":"x","title":"t","org":"o","reward_usd":-1,"skills":["C++"]}])",
        out, err));  // negative reward rejected
    CHECK(!bounty::import_json(
        R"([{"id":"x","title":"t","org":"o","reward_usd":1,"skills":["C++"],"status":"weird"}])",
        out, err));  // unknown status rejected
    CHECK(!bounty::import_json(
        R"([{"id":"x","title":"t","org":"o","reward_usd":1,"skills":["C++"]}] trailing)",
        out, err));  // trailing junk rejected
}

int main() {
    test_validation();
    test_skills_and_keywords();
    test_store();
    test_query();
    test_importer();
    std::cout << "tests: " << g_passed << " passed, " << g_failed << " failed\n";
    return g_failed == 0 ? 0 : 1;
}
