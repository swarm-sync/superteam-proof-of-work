#pragma once
// query.h — pure functions over listings: filter, search, sort.
// No state, no I/O, no mutation of the store. Easy to test in isolation.
#include <optional>
#include <string>
#include <vector>

#include "listing.h"

namespace bounty {

struct Filter {
    std::optional<std::string> skill;       // exact skill match (case-insensitive)
    std::optional<int> min_reward_usd;      // inclusive lower bound
    std::optional<Status> status;
    std::optional<std::string> keyword;     // substring over title + org
};

enum class SortKey { RewardDesc, RewardAsc, TitleAsc };

std::vector<Listing> apply_filter(const std::vector<Listing>& in, const Filter& f);
void sort_listings(std::vector<Listing>& in, SortKey key);
// Convenience: filter then sort in one call.
std::vector<Listing> query(const std::vector<Listing>& in, const Filter& f, SortKey key);

}  // namespace bounty
