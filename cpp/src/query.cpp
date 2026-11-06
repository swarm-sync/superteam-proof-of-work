#include "query.h"

#include <algorithm>

namespace bounty {

std::vector<Listing> apply_filter(const std::vector<Listing>& in, const Filter& f) {
    std::vector<Listing> out;
    for (const auto& l : in) {
        if (f.skill && !l.has_skill(*f.skill)) continue;
        if (f.min_reward_usd && l.reward_usd < *f.min_reward_usd) continue;
        if (f.status && l.status != *f.status) continue;
        if (f.keyword && !l.matches_keyword(*f.keyword)) continue;
        out.push_back(l);
    }
    return out;
}

void sort_listings(std::vector<Listing>& in, SortKey key) {
    switch (key) {
        case SortKey::RewardDesc:
            std::sort(in.begin(), in.end(), [](const Listing& a, const Listing& b) {
                return a.reward_usd > b.reward_usd;
            });
            break;
        case SortKey::RewardAsc:
            std::sort(in.begin(), in.end(), [](const Listing& a, const Listing& b) {
                return a.reward_usd < b.reward_usd;
            });
            break;
        case SortKey::TitleAsc:
            std::sort(in.begin(), in.end(), [](const Listing& a, const Listing& b) {
                return a.title < b.title;
            });
            break;
    }
}

std::vector<Listing> query(const std::vector<Listing>& in, const Filter& f, SortKey key) {
    auto out = apply_filter(in, f);
    sort_listings(out, key);
    return out;
}

}  // namespace bounty
