#include "store.h"

namespace bounty {

bool Store::add(const Listing& listing, std::string& error) {
    const std::string v = listing.validation_error();
    if (!v.empty()) { error = v; return false; }
    if (find(listing.id) != nullptr) {
        error = "duplicate id: " + listing.id;
        return false;
    }
    listings_.push_back(listing);
    error.clear();
    return true;
}

const Listing* Store::find(const std::string& id) const {
    for (const auto& l : listings_) {
        if (l.id == id) return &l;
    }
    return nullptr;
}

}  // namespace bounty
