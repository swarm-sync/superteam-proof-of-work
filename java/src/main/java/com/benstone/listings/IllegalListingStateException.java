package com.benstone.listings;

/** Thrown when a state transition is illegal (e.g. closing an already-closed listing). Mapped to 409. */
public class IllegalListingStateException extends RuntimeException {

    public IllegalListingStateException(String message) {
        super(message);
    }
}
