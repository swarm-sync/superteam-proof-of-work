package bounty

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.runBlocking
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

/**
 * Tests for [ListingService], [CreateListingRequest] validation, [Json] and
 * the seed data. Run with `./test.sh` (JUnit 4 via JUnitCore).
 */
class ListingServiceTest {

    private val fixedClock: Clock =
        Clock.fixed(Instant.parse("2026-11-05T00:00:00Z"), ZoneOffset.UTC)

    private fun service() = ListingService(InMemoryListingRepository(), fixedClock)

    private fun validRequest(
        title: String = "Build a Solana escrow program",
        description: String = "Write and test an Anchor escrow program with cancel and dispute flows.",
        category: String = "DEVELOPMENT",
        rewardMinorUnits: Long = 500_000L,
        currency: String = "USDC",
        deadline: String? = "2027-03-01",
    ) = CreateListingRequest(title, description, category, rewardMinorUnits, currency, deadline)

    /** Seeds the 8 sample listings and opens the first [openCount] of them. */
    private fun seededService(openCount: Int = 0): ListingService = runBlocking {
        val svc = service()
        val created = svc.seed(SeedData.requests).map { it.getOrNull()!! }
        created.take(openCount).forEach { svc.open(it.id) }
        svc
    }

    @Test
    fun createValidListingStartsDraft() = runBlocking {
        val result = service().create(validRequest())
        val listing = (result as ListingResult.Success).value
        assertEquals(ListingStatus.DRAFT, listing.status)
        assertEquals("Build a Solana escrow program", listing.title)
        assertEquals(500_000L, listing.rewardMinorUnits)
        assertEquals(LocalDate.parse("2027-03-01"), listing.deadline)
        assertEquals(Instant.parse("2026-11-05T00:00:00Z"), listing.createdAt)
    }

    @Test
    fun createRejectsMissingTitleAndDescriptionTogether() = runBlocking {
        val result = service().create(validRequest(title = "  ", description = "short"))
        val error = (result as ListingResult.Failure).error as ListingError.Validation
        val fields = error.errors.map { it.field }.toSet()
        assertTrue("title" in fields, "expected a title error, got: ${error.errors}")
        assertTrue("description" in fields, "expected a description error, got: ${error.errors}")
    }

    @Test
    fun createRejectsUnknownCategoryAndCurrency() = runBlocking {
        val result = service().create(validRequest(category = "MAGIC", currency = "BTC"))
        val error = (result as ListingResult.Failure).error as ListingError.Validation
        assertEquals(setOf("category", "currency"), error.errors.map { it.field }.toSet())
    }

    @Test
    fun createRejectsNonPositiveAndHugeReward() = runBlocking {
        val zero = service().create(validRequest(rewardMinorUnits = 0L))
        assertTrue(zero is ListingResult.Failure)
        val huge = service().create(validRequest(rewardMinorUnits = 10_000_000_01L))
        val error = (huge as ListingResult.Failure).error as ListingError.Validation
        assertEquals(listOf("rewardMinorUnits"), error.errors.map { it.field })
    }

    @Test
    fun createRejectsPastDeadlineAndBadDate() = runBlocking {
        val past = service().create(validRequest(deadline = "2020-01-01"))
        assertTrue(past is ListingResult.Failure)
        val garbage = service().create(validRequest(deadline = "tomorrow"))
        val error = (garbage as ListingResult.Failure).error as ListingError.Validation
        assertEquals("deadline", error.errors.single().field)
        // No deadline at all is fine.
        assertTrue(service().create(validRequest(deadline = null)) is ListingResult.Success)
    }

    @Test
    fun getUnknownIdReturnsNotFound() = runBlocking {
        val id = UUID.randomUUID()
        val result = service().get(id)
        assertEquals(ListingError.NotFound(id), (result as ListingResult.Failure).error)
    }

    @Test
    fun openMovesDraftToOpen() = runBlocking {
        val svc = service()
        val created = (svc.create(validRequest()) as ListingResult.Success).value
        val opened = (svc.open(created.id) as ListingResult.Success).value
        assertEquals(ListingStatus.OPEN, opened.status)
        assertEquals(created.id, opened.id)
    }

    @Test
    fun closeMovesOpenToClosed() = runBlocking {
        val svc = service()
        val created = (svc.create(validRequest()) as ListingResult.Success).value
        svc.open(created.id)
        val closed = (svc.close(created.id) as ListingResult.Success).value
        assertEquals(ListingStatus.CLOSED, closed.status)
    }

    @Test
    fun closeDraftIsIllegalTransition() = runBlocking {
        val svc = service()
        val created = (svc.create(validRequest()) as ListingResult.Success).value
        val result = svc.close(created.id)
        assertEquals(
            ListingError.IllegalTransition(created.id, ListingStatus.DRAFT, ListingStatus.CLOSED),
            (result as ListingResult.Failure).error,
        )
    }

    @Test
    fun openClosedIsIllegalTransition() = runBlocking {
        val svc = service()
        val created = (svc.create(validRequest()) as ListingResult.Success).value
        svc.open(created.id)
        svc.close(created.id)
        val result = svc.open(created.id)
        assertTrue((result as ListingResult.Failure).error is ListingError.IllegalTransition)
    }

    @Test
    fun doubleCloseIsIllegalTransition() = runBlocking {
        val svc = service()
        val created = (svc.create(validRequest()) as ListingResult.Success).value
        svc.open(created.id)
        svc.close(created.id)
        val result = svc.close(created.id)
        assertEquals(
            ListingError.IllegalTransition(created.id, ListingStatus.CLOSED, ListingStatus.CLOSED),
            (result as ListingResult.Failure).error,
        )
    }

    @Test
    fun listFiltersByCategory() = runBlocking {
        val page = (seededService().list(ListingQuery(category = Category.DEVELOPMENT)) as ListingResult.Success).value
        assertEquals(3, page.totalItems)
        assertTrue(page.items.all { it.category == Category.DEVELOPMENT })
    }

    @Test
    fun listFiltersByStatusAndRewardRange() = runBlocking {
        val svc = seededService(openCount = 3)
        val open = (svc.list(ListingQuery(status = ListingStatus.OPEN)) as ListingResult.Success).value
        assertEquals(3, open.totalItems)
        val rich = (svc.list(ListingQuery(minRewardMinorUnits = 200_000L, maxRewardMinorUnits = 600_000L)) as ListingResult.Success).value
        assertEquals(2, rich.totalItems)
        assertTrue(rich.items.all { it.rewardMinorUnits in 200_000L..600_000L })
    }

    @Test
    fun listSearchIsCaseInsensitive() = runBlocking {
        val page = (seededService().list(ListingQuery(search = "ESCROW")) as ListingResult.Success).value
        assertEquals(2, page.totalItems)
        assertTrue(page.items.all { "escrow" in it.title.lowercase() || "escrow" in it.description.lowercase() })
    }

    @Test
    fun listSortsByRewardAscendingAndDescending() = runBlocking {
        val svc = seededService()
        val asc = (svc.list(ListingQuery(sortBy = SortField.REWARD, sortDirection = SortDirection.ASC)) as ListingResult.Success).value
        assertEquals(listOf(45_000L, 60_000L, 90_000L, 120_000L, 150_000L, 250_000L, 500_000L, 800_000L), asc.items.map { it.rewardMinorUnits })
        val desc = (svc.list(ListingQuery(sortBy = SortField.REWARD, sortDirection = SortDirection.DESC)) as ListingResult.Success).value
        assertEquals(800_000L, desc.items.first().rewardMinorUnits)
        assertEquals(45_000L, desc.items.last().rewardMinorUnits)
    }

    @Test
    fun listSortsByDeadlineWithNullsLast() = runBlocking {
        val svc = seededService()
        val page = (svc.list(ListingQuery(sortBy = SortField.DEADLINE, sortDirection = SortDirection.ASC, pageSize = 50)) as ListingResult.Success).value
        val deadlines = page.items.map { it.deadline }
        assertEquals(LocalDate.parse("2027-01-10"), deadlines.first())
        assertTrue(deadlines.takeLast(2).all { it == null }, "listings without a deadline sort last, got: $deadlines")
    }

    @Test
    fun listPaginates() = runBlocking {
        val svc = seededService()
        val p1 = (svc.list(ListingQuery(page = 1, pageSize = 3)) as ListingResult.Success).value
        val p3 = (svc.list(ListingQuery(page = 3, pageSize = 3)) as ListingResult.Success).value
        val p4 = (svc.list(ListingQuery(page = 4, pageSize = 3)) as ListingResult.Success).value
        assertEquals(8, p1.totalItems)
        assertEquals(3, p1.totalPages)
        assertEquals(3, p1.items.size)
        assertEquals(2, p3.items.size)
        assertTrue(p4.items.isEmpty(), "page past the end is empty, not an error")
        assertTrue((p1.items + p3.items).map { it.id }.toSet().size == 5, "pages must not overlap")
    }

    @Test
    fun listRejectsInvalidPaging() = runBlocking {
        val svc = seededService()
        for (bad in listOf(ListingQuery(page = 0), ListingQuery(pageSize = 0), ListingQuery(pageSize = 51),
            ListingQuery(minRewardMinorUnits = 500L, maxRewardMinorUnits = 100L))) {
            val result = svc.list(bad)
            assertTrue(result is ListingResult.Failure, "expected failure for $bad")
            assertTrue((result as ListingResult.Failure).error is ListingError.Validation)
        }
    }

    @Test
    fun jsonRoundTripPreservesListing() = runBlocking {
        val created = (service().create(validRequest()) as ListingResult.Success).value
        val parsed = Listing.fromMap(Json.parseObject(Json.stringify(created.toMap())))
        assertEquals(created, parsed)
    }

    @Test
    fun jsonMalformedInputThrows() {
        assertFailsWith<IllegalArgumentException> { Json.parse("{not json") }
        assertFailsWith<IllegalArgumentException> { Json.parse("{\"a\": }") }
        assertEquals(mapOf("a" to 1L, "b" to listOf("x", true, null)), Json.parseObject("{\"a\": 1, \"b\": [\"x\", true, null]}"))
    }

    @Test
    fun seedLoadsEightListings() = runBlocking {
        val svc = seededService()
        assertEquals(8, svc.count())
        val all = (svc.list(ListingQuery(pageSize = 50)) as ListingResult.Success).value
        assertEquals(8, all.totalItems)
    }

    @Test
    fun concurrentCreatesAreAllStored() = runBlocking {
        val svc = service()
        coroutineScope {
            val jobs = (1..50).map { n ->
                async { svc.create(validRequest(title = "Concurrent bounty $n")) }
            }
            val results = jobs.map { it.await() }
            assertEquals(50, results.count { it is ListingResult.Success })
            val ids = results.mapNotNull { it.getOrNull()?.id }
            assertEquals(50, ids.toSet().size, "every concurrent create must get a distinct id")
        }
        assertEquals(50, svc.count())
    }
}
