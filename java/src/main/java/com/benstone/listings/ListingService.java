package com.benstone.listings;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Business rules for listings. The HTTP handler deals with transport; this
 * class owns every rule, so the rules are testable without HTTP and identical
 * for any future caller (CLI, queue consumer, admin tool).
 *
 * <p>Rules:
 * <ul>
 *   <li>New listings start as {@code DRAFT} — nothing is public by accident.</li>
 *   <li>Only a {@code DRAFT} listing can be opened; only an {@code OPEN} listing
 *       can be closed. Any other transition is a 409, not a silent no-op.</li>
 *   <li>A second close is an explicit, visible error (409) rather than a
 *       second side effect.</li>
 * </ul>
 */
public class ListingService {

    private final ListingRepository repository;
    private final Clock clock;

    public ListingService(ListingRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public Listing create(CreateListingRequest request) {
        Instant now = clock.instant();
        Listing listing = new Listing(
                UUID.randomUUID(),
                request.title(),
                request.description(),
                request.category(),
                request.rewardAmount(),
                request.currency(),
                Listing.Status.DRAFT,
                now,
                now);
        return repository.save(listing);
    }

    public Listing get(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ListingNotFoundException(id));
    }

    /** Lists with optional filters; results are in creation order, paged by offset/limit. */
    public List<Listing> list(Listing.Status status, Listing.Category category, int offset, int limit) {
        return repository.findAll().stream()
                .filter(l -> status == null || l.status() == status)
                .filter(l -> category == null || l.category() == category)
                .skip(offset)
                .limit(limit)
                .toList();
    }

    public Listing open(UUID id) {
        Listing listing = get(id);
        if (listing.status() != Listing.Status.DRAFT) {
            throw new IllegalListingStateException(
                    "only a DRAFT listing can be opened, current status is " + listing.status());
        }
        return repository.save(listing.withStatus(Listing.Status.OPEN, clock.instant()));
    }

    public Listing close(UUID id) {
        Listing listing = get(id);
        if (listing.status() != Listing.Status.OPEN) {
            throw new IllegalListingStateException(
                    "only an OPEN listing can be closed, current status is " + listing.status());
        }
        return repository.save(listing.withStatus(Listing.Status.CLOSED, clock.instant()));
    }

    public void delete(UUID id) {
        get(id); // 404 when unknown, instead of a silent success.
        repository.delete(id);
    }
}
