#pragma once
// importer.h — JSON import boundary. Parses a JSON array of listing
// objects into validated Listing values. The ONLY place that knows JSON
// syntax; callers only ever see Listing / error strings.
// Supported shape (all fields required except status, default "open"):
//   [{"id":"bty-001","title":"...","org":"...","reward_usd":500,
//     "skills":["C++","Solana"],"status":"open"}]
#include <string>
#include <vector>

#include "listing.h"

namespace bounty {

// Parses `text`. On success returns true and fills `out`.
// On failure returns false and fills `error` (no partial output).
bool import_json(const std::string& text, std::vector<Listing>& out, std::string& error);

}  // namespace bounty
