package com.benstone.listings;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory store.
 *
 * <p>{@link ConcurrentHashMap} gives atomic put/replace semantics, so
 * concurrent creates and closes cannot silently lose an update. The data does
 * not survive a restart by design — this is the demo backing store, not a
 * durability claim. Swap in the JPA implementation for persistence.
 */
public class InMemoryListingRepository implements ListingRepository {

    private final ConcurrentHashMap<UUID, Listing> store = new ConcurrentHashMap<>();

    @Override
    public Listing save(Listing listing) {
        store.put(listing.id(), listing);
        return listing;
    }

    @Override
    public Optional<Listing> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Listing> findAll() {
        List<Listing> all = new ArrayList<>(store.values());
        all.sort(Comparator.comparing(Listing::createdAt).thenComparing(Listing::id));
        return List.copyOf(all);
    }

    @Override
    public void delete(UUID id) {
        store.remove(id);
    }
}
