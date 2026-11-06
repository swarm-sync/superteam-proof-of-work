package bounty

import java.util.UUID

/** One field-level validation problem, surfaced to the caller instead of a bare 400. */
data class FieldError(val field: String, val message: String)

/**
 * Every failure the service can return, as a sealed type so callers handle
 * each case explicitly — no exceptions for expected failures, no nulls.
 */
sealed interface ListingError {
    val message: String

    /** One or more request fields failed validation. */
    data class Validation(val errors: List<FieldError>) : ListingError {
        override val message: String =
            errors.joinToString("; ") { "${it.field}: ${it.message}" }
    }

    /** No listing exists with this id. */
    data class NotFound(val id: UUID) : ListingError {
        override val message: String = "Listing $id not found"
    }

    /** The requested status change is not a legal transition. */
    data class IllegalTransition(val id: UUID, val from: ListingStatus, val to: ListingStatus) : ListingError {
        override val message: String = "Cannot move listing $id from $from to $to"
    }

    /** The supplied JSON could not be parsed. */
    data class MalformedJson(val detail: String) : ListingError {
        override val message: String = "Malformed JSON: $detail"
    }
}

/**
 * Sealed result type: every service operation returns either a value or a
 * typed [ListingError]. Callers use `when` and the compiler enforces that
 * every branch is handled.
 */
sealed interface ListingResult<out T> {
    data class Success<T>(val value: T) : ListingResult<T>
    data class Failure(val error: ListingError) : ListingResult<Nothing>

    val isSuccess: Boolean get() = this is Success

    fun getOrNull(): T? = (this as? Success)?.value

    fun errorOrNull(): ListingError? = (this as? Failure)?.error

    /** Map the success value, passing failures through untouched. */
    fun <R> map(transform: (T) -> R): ListingResult<R> = when (this) {
        is Success -> Success(transform(value))
        is Failure -> this
    }
}
