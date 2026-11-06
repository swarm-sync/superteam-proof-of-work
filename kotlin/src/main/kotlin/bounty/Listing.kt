package bounty

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/** Bounty categories a listing can belong to. Unknown values are rejected at validation time. */
enum class Category {
    DEVELOPMENT, DESIGN, CONTENT, MARKETING, RESEARCH, SECURITY
}

/** Currencies rewards can be denominated in. */
enum class Currency {
    USDC, SOL, USD
}

/**
 * Listing lifecycle. A listing starts as DRAFT (never public by accident) and
 * may only move DRAFT -> OPEN -> CLOSED. Any other transition is rejected.
 */
enum class ListingStatus {
    DRAFT, OPEN, CLOSED
}

/**
 * A bounty listing. Immutable data class: state changes produce a copy, so a
 * stored instance can never be mutated behind the repository's back.
 *
 * @property rewardMinorUnits reward in the currency's minor unit (cents for
 *   USD/USDC, lamports are NOT used — SOL rewards are whole SOL * 1_000_000).
 * @property deadline optional closing date, ISO-8601 (yyyy-MM-dd) when present.
 */
data class Listing(
    val id: UUID,
    val title: String,
    val description: String,
    val category: Category,
    val rewardMinorUnits: Long,
    val currency: Currency,
    val status: ListingStatus,
    val deadline: LocalDate?,
    val createdAt: Instant,
) {
    /** Serialisable view used by the JSON layer and the CLI. */
    fun toMap(): Map<String, Any?> = linkedMapOf(
        "id" to id.toString(),
        "title" to title,
        "description" to description,
        "category" to category.name,
        "rewardMinorUnits" to rewardMinorUnits,
        "currency" to currency.name,
        "status" to status.name,
        "deadline" to deadline?.toString(),
        "createdAt" to createdAt.toString(),
    )

    companion object {
        fun fromMap(map: Map<String, Any?>): Listing = Listing(
            id = UUID.fromString(map["id"] as String),
            title = map["title"] as String,
            description = map["description"] as String,
            category = Category.valueOf(map["category"] as String),
            rewardMinorUnits = (map["rewardMinorUnits"] as Number).toLong(),
            currency = Currency.valueOf(map["currency"] as String),
            status = ListingStatus.valueOf(map["status"] as String),
            deadline = (map["deadline"] as? String)?.let(LocalDate::parse),
            createdAt = Instant.parse(map["createdAt"] as String),
        )
    }
}
