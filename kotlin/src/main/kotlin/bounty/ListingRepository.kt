package bounty

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Persistence seam: the service only ever talks to this interface, so the
 * in-memory store can be swapped for a real database (e.g. Exposed/Postgres)
 * without touching any business rule.
 */
interface ListingRepository {
    fun save(listing: Listing): Listing
    fun findById(id: UUID): Listing?
    fun findAll(): List<Listing>
    fun count(): Int

    /**
     * Atomically replaces the listing with [id] by applying [update], or
     * returns null when no listing with that id exists. The atomic step is
     * what makes concurrent state transitions safe.
     */
    fun updateIfPresent(id: UUID, update: (Listing) -> Listing): Listing?
}

/** Thread-safe in-memory implementation backed by a [ConcurrentHashMap]. */
class InMemoryListingRepository : ListingRepository {
    private val store = ConcurrentHashMap<UUID, Listing>()

    override fun save(listing: Listing): Listing = listing.also { store[it.id] = it }

    override fun findById(id: UUID): Listing? = store[id]

    override fun findAll(): List<Listing> = store.values.toList()

    override fun count(): Int = store.size

    override fun updateIfPresent(id: UUID, update: (Listing) -> Listing): Listing? =
        store.computeIfPresent(id) { _, current -> update(current) }
}
