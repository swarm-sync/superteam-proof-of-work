package bounty

import java.time.LocalDate

/**
 * Input for creating a listing. All fields arrive as raw values (e.g. from
 * parsed JSON) and are validated by [validate] before any business logic runs,
 * so a half-created listing can never exist.
 */
data class CreateListingRequest(
    val title: String?,
    val description: String?,
    val category: String?,
    val rewardMinorUnits: Long?,
    val currency: String?,
    val deadline: String?,
) {
    companion object {
        const val MAX_TITLE_LENGTH = 120
        const val MIN_DESCRIPTION_LENGTH = 10
        const val MAX_DESCRIPTION_LENGTH = 2000
        const val MAX_REWARD_MINOR_UNITS = 10_000_000_00L // $10,000,000 ceiling

        fun fromMap(map: Map<String, Any?>): CreateListingRequest = CreateListingRequest(
            title = map["title"] as? String,
            description = map["description"] as? String,
            category = map["category"] as? String,
            rewardMinorUnits = (map["rewardMinorUnits"] as? Number)?.toLong(),
            currency = map["currency"] as? String,
            deadline = map["deadline"] as? String,
        )
    }

    /**
     * Validates every field and returns ALL problems at once (not just the
     * first), so a caller can fix everything in one round trip.
     */
    fun validate(today: LocalDate = LocalDate.now()): ListingResult<Unit> {
        val errors = mutableListOf<FieldError>()

        when {
            title.isNullOrBlank() -> errors += FieldError("title", "title is required")
            title.length > MAX_TITLE_LENGTH ->
                errors += FieldError("title", "title must be at most $MAX_TITLE_LENGTH characters")
        }
        when {
            description.isNullOrBlank() -> errors += FieldError("description", "description is required")
            description.length < MIN_DESCRIPTION_LENGTH ->
                errors += FieldError("description", "description must be at least $MIN_DESCRIPTION_LENGTH characters")
            description.length > MAX_DESCRIPTION_LENGTH ->
                errors += FieldError("description", "description must be at most $MAX_DESCRIPTION_LENGTH characters")
        }
        if (category.isNullOrBlank()) {
            errors += FieldError("category", "category is required")
        } else if (Category.entries.none { it.name == category }) {
            errors += FieldError(
                "category",
                "unknown category '$category' (expected one of ${Category.entries.joinToString()})",
            )
        }
        when {
            rewardMinorUnits == null -> errors += FieldError("rewardMinorUnits", "rewardMinorUnits is required")
            rewardMinorUnits <= 0 -> errors += FieldError("rewardMinorUnits", "reward must be positive")
            rewardMinorUnits > MAX_REWARD_MINOR_UNITS ->
                errors += FieldError("rewardMinorUnits", "reward exceeds the maximum of $MAX_REWARD_MINOR_UNITS")
        }
        if (currency.isNullOrBlank()) {
            errors += FieldError("currency", "currency is required")
        } else if (Currency.entries.none { it.name == currency }) {
            errors += FieldError(
                "currency",
                "unknown currency '$currency' (expected one of ${Currency.entries.joinToString()})",
            )
        }
        if (!deadline.isNullOrBlank()) {
            val parsed = runCatching { LocalDate.parse(deadline) }.getOrNull()
            when {
                parsed == null -> errors += FieldError("deadline", "deadline must be an ISO date (yyyy-MM-dd)")
                parsed.isBefore(today) -> errors += FieldError("deadline", "deadline must not be in the past")
            }
        }

        return if (errors.isEmpty()) ListingResult.Success(Unit)
        else ListingResult.Failure(ListingError.Validation(errors))
    }

    /** Converts a validated request into its domain values. Call only after [validate] succeeds. */
    fun toDomain(): Triple<Category, Currency, LocalDate?> = Triple(
        Category.valueOf(category!!),
        Currency.valueOf(currency!!),
        deadline?.takeIf { it.isNotBlank() }?.let(LocalDate::parse),
    )
}
