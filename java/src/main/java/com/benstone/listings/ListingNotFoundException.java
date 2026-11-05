package com.benstone.listings;

import java.util.UUID;

/** Thrown when a listing id is unknown. Mapped to 404 by {@link GlobalExceptionHandler}. */
public class ListingNotFoundException extends RuntimeException {

    private final UUID id;

    public ListingNotFoundException(UUID id) {
        super("listing not found: " + id);
        this.id = id;
    }

    public UUID id() {
        return id;
    }
}
