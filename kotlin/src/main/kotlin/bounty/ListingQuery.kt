package bounty

/** How a listing page may be sorted. */
enum class SortField { REWARD, DEADLINE, CREATED }

enum class SortDirection { ASC, DESC }

/**
 * Everything a listing search can filter, sort and page by. [validate]
 * rejects nonsense paging before the repository is touched.
 */
data class ListingQuery(
    val category: Category? = null,
    val status: ListingStatus? = null,
    val minRewardMinorUnits: Long? = null,
    val maxRewardMinorUnits: Long? = null,
    /** Case-insensitive substring match against title and description. */
    val search: String? = null,
    val sortBy: SortField = SortField.CREATED,
    val sortDirection: SortDirection = SortDirection.DESC,
    val page: Int = 1,
    val pageSize: Int = 10,
) {
    companion object {
        const val MAX_PAGE_SIZE = 50
    }

    fun validate(): ListingResult<Unit> {
        val errors = mutableListOf<FieldError>()
        if (page < 1) errors += FieldError("page", "page must be at least 1")
        if (pageSize < 1) errors += FieldError("pageSize", "pageSize must be at least 1")
        if (pageSize > MAX_PAGE_SIZE) errors += FieldError("pageSize", "pageSize must be at most $MAX_PAGE_SIZE")
        if (minRewardMinorUnits != null && minRewardMinorUnits < 0) {
            errors += FieldError("minRewardMinorUnits", "minRewardMinorUnits must not be negative")
        }
        if (maxRewardMinorUnits != null && maxRewardMinorUnits < 0) {
            errors += FieldError("maxRewardMinorUnits", "maxRewardMinorUnits must not be negative")
        }
        if (minRewardMinorUnits != null && maxRewardMinorUnits != null && minRewardMinorUnits > maxRewardMinorUnits) {
            errors += FieldError("minRewardMinorUnits", "minRewardMinorUnits must not exceed maxRewardMinorUnits")
        }
        return if (errors.isEmpty()) ListingResult.Success(Unit)
        else ListingResult.Failure(ListingError.Validation(errors))
    }
}

/** One page of results, with the totals a client needs to build its own pager. */
data class Page<T>(
    val items: List<T>,
    val totalItems: Int,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int,
) {
    fun toMap(itemToMap: (T) -> Map<String, Any?>): Map<String, Any?> = linkedMapOf(
        "items" to items.map(itemToMap),
        "totalItems" to totalItems,
        "page" to page,
        "pageSize" to pageSize,
        "totalPages" to totalPages,
    )
}
