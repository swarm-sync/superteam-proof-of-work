package com.benstone.listings;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A bounty / grant / job listing.
 *
 * <p>Immutable record: updates build a new instance via {@link #withStatus}.
 * The store is an in-memory {@link ListingRepository}; the repository interface
 * is the seam where a JPA/Postgres implementation plugs in without touching
 * the service or the controller.
 */
public record Listing(
        UUID id,
        String title,
        String description,
        Category category,
        BigDecimal rewardAmount,
        Currency currency,
        Status status,
        Instant createdAt,
        Instant updatedAt) {

    public enum Category {
        BOUNTY,
        GRANT,
        JOB
    }

    public enum Currency {
        SOL,
        USDC
    }

    public enum Status {
        DRAFT,
        OPEN,
        CLOSED
    }

    public Listing withStatus(Status newStatus, Instant now) {
        return new Listing(
                id, title, description, category, rewardAmount, currency,
                newStatus, createdAt, now);
    }
}
