#include "listing.h"

#include <algorithm>
#include <cctype>

namespace bounty {

namespace {
std::string lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return s;
}
}  // namespace

Status status_from_string(const std::string& s, bool& ok) {
    const std::string v = lower(s);
    if (v == "open") { ok = true; return Status::Open; }
    if (v == "closed") { ok = true; return Status::Closed; }
    ok = false;
    return Status::Open;
}

std::string status_to_string(Status s) {
    return s == Status::Open ? "open" : "closed";
}

std::string Listing::validation_error() const {
    if (id.empty()) return "id must not be empty";
    if (title.empty()) return "title must not be empty";
    if (org.empty()) return "org must not be empty";
    if (reward_usd < 0) return "reward_usd must be >= 0";
    if (skills.empty()) return "skills must contain at least one skill";
    for (const auto& s : skills) {
        if (s.empty()) return "skills must not contain an empty skill";
    }
    return "";
}

bool Listing::has_skill(const std::string& skill) const {
    const std::string want = lower(skill);
    for (const auto& s : skills) {
        if (lower(s) == want) return true;
    }
    return false;
}

bool Listing::matches_keyword(const std::string& keyword) const {
    if (keyword.empty()) return true;
    const std::string k = lower(keyword);
    return lower(title).find(k) != std::string::npos ||
           lower(org).find(k) != std::string::npos;
}

}  // namespace bounty
