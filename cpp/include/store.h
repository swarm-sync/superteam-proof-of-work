#pragma once
// store.h — ownership of the listing collection.
// Only job: hold listings, reject invalid/duplicate ids, answer lookups.
// No filtering, sorting, parsing, or I/O lives here.
#include <string>
#include <vector>

#include "listing.h"

namespace bounty {

class Store {
public:
    // Adds a listing. Returns false (and sets `error`) if invalid or
    // if another listing already uses the same id. Never stores a copy
    // of an invalid listing.
    bool add(const Listing& listing, std::string& error);
    const Listing* find(const std::string& id) const;
    const std::vector<Listing>& all() const { return listings_; }
    std::size_t size() const { return listings_.size(); }
    bool empty() const { return listings_.empty(); }
    void clear() { listings_.clear(); }

private:
    std::vector<Listing> listings_;
};

}  // namespace bounty
