package bounty

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.time.Clock
import java.time.LocalDate
import java.util.UUID

/**
 * Owns every business rule for bounty listings, independent of any transport
 * (CLI today, HTTP tomorrow). All operations are `suspend` functions and run
 * on [Dispatchers.Default], so callers can fan work out with coroutines; the
 * repository underneath is thread-safe, so concurrent calls stay correct.
 *
 * @property clock injected time source (never `Instant.now()` inline) so
 *   creation timestamps are testable with a fixed clock.
 */
class ListingService(
    private val repository: ListingRepository = InMemoryListingRepository(),
    private val clock: Clock = Clock.systemUTC(),
) {
    /** Legal state transitions. Anything not listed here is a 409-style rejection. */
    private val legalTransitions: Map<ListingStatus, Set<ListingStatus>> = mapOf(
        ListingStatus.DRAFT to setOf(ListingStatus.OPEN),
        ListingStatus.OPEN to setOf(ListingStatus.CLOSED),
        ListingStatus.CLOSED to emptySet(),
    )

    /** Creates a listing in DRAFT. Validation failures return every bad field at once. */
    suspend fun create(request: CreateListingRequest): ListingResult<Listing> = withContext(Dispatchers.Default) {
        when (val validation = request.validate(LocalDate.now(clock))) {
            is ListingResult.Failure -> validation
            is ListingResult.Success -> {
                val (category, currency, deadline) = request.toDomain()
                val listing = Listing(
                    id = UUID.randomUUID(),
                    title = request.title!!.trim(),
                    description = request.description!!.trim(),
                    category = category,
                    rewardMinorUnits = request.rewardMinorUnits!!,
                    currency = currency,
                    status = ListingStatus.DRAFT,
                    deadline = deadline,
                    createdAt = clock.instant(),
                )
                ListingResult.Success(repository.save(listing))
            }
        }
    }

    suspend fun get(id: UUID): ListingResult<Listing> = withContext(Dispatchers.Default) {
        repository.findById(id)?.let { ListingResult.Success(it) }
            ?: ListingResult.Failure(ListingError.NotFound(id))
    }

    /** Moves a listing one legal step forward. Illegal moves are explicit failures, not silent no-ops. */
    suspend fun transition(id: UUID, to: ListingStatus): ListingResult<Listing> = withContext(Dispatchers.Default) {
        val current = repository.findById(id) ?: return@withContext ListingResult.Failure(ListingError.NotFound(id))
        if (to !in (legalTransitions[current.status] ?: emptySet())) {
            return@withContext ListingResult.Failure(ListingError.IllegalTransition(id, current.status, to))
        }
        // Atomic compare-and-set style update: two racing transitions cannot both win.
        val updated = repository.updateIfPresent(id) { it.copy(status = to) }
            ?: return@withContext ListingResult.Failure(ListingError.NotFound(id))
        ListingResult.Success(updated)
    }

    suspend fun open(id: UUID): ListingResult<Listing> = transition(id, ListingStatus.OPEN)

    suspend fun close(id: UUID): ListingResult<Listing> = transition(id, ListingStatus.CLOSED)

    /** Filtered, sorted, paginated search. Filters compose with AND; sorting is stable (id tie-break). */
    suspend fun list(query: ListingQuery): ListingResult<Page<Listing>> = withContext(Dispatchers.Default) {
        when (val validation = query.validate()) {
            is ListingResult.Failure -> validation
            is ListingResult.Success -> {
                val needle = query.search?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
                var filtered = repository.findAll().asSequence()
                query.category?.let { category -> filtered = filtered.filter { it.category == category } }
                query.status?.let { status -> filtered = filtered.filter { it.status == status } }
                query.minRewardMinorUnits?.let { min -> filtered = filtered.filter { it.rewardMinorUnits >= min } }
                query.maxRewardMinorUnits?.let { max -> filtered = filtered.filter { it.rewardMinorUnits <= max } }
                needle?.let { q ->
                    filtered = filtered.filter {
                        it.title.lowercase().contains(q) || it.description.lowercase().contains(q)
                    }
                }
                val sorted = filtered.sortedWith(comparatorFor(query)).toList()
                val totalPages = if (sorted.isEmpty()) 0 else (sorted.size + query.pageSize - 1) / query.pageSize
                val fromIndex = (query.page - 1) * query.pageSize
                val pageItems = if (fromIndex >= sorted.size) emptyList()
                else sorted.subList(fromIndex, minOf(fromIndex + query.pageSize, sorted.size))
                ListingResult.Success(
                    Page(
                        items = pageItems,
                        totalItems = sorted.size,
                        page = query.page,
                        pageSize = query.pageSize,
                        totalPages = totalPages,
                    ),
                )
            }
        }
    }

    private fun comparatorFor(query: ListingQuery): Comparator<Listing> {
        val base: Comparator<Listing> = when (query.sortBy) {
            SortField.REWARD -> compareBy { it.rewardMinorUnits }
            SortField.DEADLINE -> compareBy(nullsLast()) { it.deadline }
            SortField.CREATED -> compareBy { it.createdAt }
        }
        val directed = if (query.sortDirection == SortDirection.DESC) base.reversed() else base
        return directed.thenBy { it.id } // deterministic tie-break
    }

    /**
     * Loads seed listings concurrently — one coroutine per listing, joined
     * before returning — so a slow source (file, network) would not serialize
     * the whole load. Returns the created listings in seed order.
     */
    suspend fun seed(requests: List<CreateListingRequest>): List<ListingResult<Listing>> = coroutineScope {
        requests.map { request -> async { create(request) } }.awaitAll()
    }

    fun count(): Int = repository.count()
}
