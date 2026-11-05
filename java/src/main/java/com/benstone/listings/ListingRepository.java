package com.benstone.listings;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Persistence seam. The in-memory implementation is a deliberate stand-in for JPA/Postgres. */
public interface ListingRepository {

    Listing save(Listing listing);

    Optional<Listing> findById(UUID id);

    List<Listing> findAll();

    void delete(UUID id);
}
