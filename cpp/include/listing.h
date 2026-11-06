#pragma once
// listing.h — the domain model. Owns ONLY validation and value semantics.
// It knows nothing about files, JSON, sorting, or the CLI.
#include <string>
#include <vector>

namespace bounty {

enum class Status { Open, Closed };

Status status_from_string(const std::string& s, bool& ok);
std::string status_to_string(Status s);

struct Listing {
    std::string id;            // unique, non-empty, e.g. "bty-001"
    std::string title;         // non-empty
    std::string org;           // non-empty
    int reward_usd = 0;        // >= 0
    std::vector<std::string> skills;  // at least one, each non-empty
    Status status = Status::Open;

    // Returns empty string when valid, otherwise a human-readable reason.
    std::string validation_error() const;
    bool valid() const { return validation_error().empty(); }
    bool has_skill(const std::string& skill) const;
    // Case-insensitive substring match against title + org.
    bool matches_keyword(const std::string& keyword) const;
};

}  // namespace bounty
