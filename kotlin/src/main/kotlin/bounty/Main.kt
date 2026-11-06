package bounty

import kotlinx.coroutines.runBlocking
import java.util.UUID

/**
 * Small CLI over [ListingService]. No HTTP, no database: the store lives for
 * one invocation, so run `seed` first in a demo, or pipe a `create` result
 * into the next command. Output is JSON on stdout; failures are a JSON error
 * body on stderr with exit code 2.
 *
 * Usage:
 *   listings seed
 *   listings list [--category DEVELOPMENT] [--status OPEN]
 *                 [--min-reward 10000] [--max-reward 500000] [--search escrow]
 *                 [--sort reward|deadline|created] [--dir asc|desc]
 *                 [--page 1] [--size 10]
 *   listings get <id>
 *   listings create '<json>'        (or '-' to read JSON from stdin)
 *   listings open <id>
 *   listings close <id>
 */
fun main(args: Array<String>) {
    val exitCode = runBlocking {
        val service = ListingService()
        runCommand(service, args)
    }
    if (exitCode != 0) kotlin.system.exitProcess(exitCode)
}

private suspend fun runCommand(service: ListingService, args: Array<String>): Int {
    if (args.isEmpty()) {
        System.err.println("Usage: listings <seed|list|get|create|open|close> [options]")
        return 2
    }
    return when (args[0]) {
        "seed" -> {
            val results = service.seed(SeedData.requests)
            val created = results.mapNotNull { it.getOrNull() }
            val failures = results.mapNotNull { it.errorOrNull() }
            if (failures.isNotEmpty()) {
                System.err.println(Json.errorBody(failures.first()))
                2
            } else {
                println(Json.stringify(created.map { it.toMap() }))
                0
            }
        }
        "list" -> {
            when (val query = parseListArgs(args.drop(1))) {
                is ListingResult.Failure -> {
                    System.err.println(Json.errorBody(query.error))
                    2
                }
                is ListingResult.Success -> when (val result = service.list(query.value)) {
                    is ListingResult.Failure -> {
                        System.err.println(Json.errorBody(result.error))
                        2
                    }
                    is ListingResult.Success -> {
                        println(Json.stringify(result.value.toMap { it.toMap() }))
                        0
                    }
                }
            }
        }
        "get" -> {
            val id = parseId(args) ?: return 2
            when (val result = service.get(id)) {
                is ListingResult.Failure -> {
                    System.err.println(Json.errorBody(result.error))
                    2
                }
                is ListingResult.Success -> {
                    println(Json.stringify(result.value.toMap()))
                    0
                }
            }
        }
        "create" -> {
            if (args.size < 2) {
                System.err.println(Json.errorBody(ListingError.Validation(listOf(FieldError("body", "create needs a JSON argument (or '-' for stdin)")))))
                return 2
            }
            val raw = if (args[1] == "-") generateSequence(::readLine).joinToString("\n") else args[1]
            val request = try {
                CreateListingRequest.fromMap(Json.parseObject(raw))
            } catch (e: IllegalArgumentException) {
                System.err.println(Json.errorBody(ListingError.MalformedJson(e.message ?: "invalid JSON")))
                return 2
            }
            when (val result = service.create(request)) {
                is ListingResult.Failure -> {
                    System.err.println(Json.errorBody(result.error))
                    2
                }
                is ListingResult.Success -> {
                    println(Json.stringify(result.value.toMap()))
                    0
                }
            }
        }
        "open", "close" -> {
            val id = parseId(args) ?: return 2
            val result = if (args[0] == "open") service.open(id) else service.close(id)
            when (result) {
                is ListingResult.Failure -> {
                    System.err.println(Json.errorBody(result.error))
                    2
                }
                is ListingResult.Success -> {
                    println(Json.stringify(result.value.toMap()))
                    0
                }
            }
        }
        else -> {
            System.err.println("Unknown command '${args[0]}'. Try: seed, list, get, create, open, close.")
            2
        }
    }
}

private fun parseId(args: Array<String>): UUID? {
    if (args.size < 2) {
        System.err.println("Missing listing id.")
        return null
    }
    return runCatching { UUID.fromString(args[1]) }.getOrNull().also {
        if (it == null) System.err.println(Json.errorBody(ListingError.MalformedJson("'${args[1]}' is not a UUID")))
    }
}

/** Parses `list` flags into a [ListingQuery]; bad flag values are validation failures, not crashes. */
private fun parseListArgs(flags: List<String>): ListingResult<ListingQuery> {
    val errors = mutableListOf<FieldError>()
    val opts = mutableMapOf<String, String>()
    var i = 0
    while (i < flags.size) {
        val flag = flags[i]
        if (!flag.startsWith("--") || i + 1 >= flags.size) {
            errors += FieldError(flag, "expected a '--flag value' pair")
            break
        }
        opts[flag.removePrefix("--")] = flags[i + 1]
        i += 2
    }
    fun enumValue(field: String, raw: String?, values: Array<out Enum<*>>): String? {
        if (raw == null) return null
        if (values.none { it.name == raw }) errors += FieldError(field, "unknown value '$raw'")
        return raw
    }
    fun longValue(field: String, raw: String?): Long? {
        if (raw == null) return null
        return raw.toLongOrNull().also {
            if (it == null) errors += FieldError(field, "'$raw' is not a number")
        }
    }
    fun intValue(field: String, raw: String?): Int? {
        if (raw == null) return null
        return raw.toIntOrNull().also {
            if (it == null) errors += FieldError(field, "'$raw' is not a number")
        }
    }

    val categoryRaw = enumValue("category", opts["category"], Category.entries.toTypedArray())
    val statusRaw = enumValue("status", opts["status"], ListingStatus.entries.toTypedArray())
    val sortRaw = opts["sort"] ?: "created"
    if (sortRaw !in setOf("reward", "deadline", "created")) errors += FieldError("sort", "unknown sort '$sortRaw'")
    val dirRaw = opts["dir"] ?: "desc"
    if (dirRaw !in setOf("asc", "desc")) errors += FieldError("dir", "unknown direction '$dirRaw'")

    if (errors.isNotEmpty()) return ListingResult.Failure(ListingError.Validation(errors))

    val query = ListingQuery(
        category = categoryRaw?.let(Category::valueOf),
        status = statusRaw?.let(ListingStatus::valueOf),
        minRewardMinorUnits = longValue("min-reward", opts["min-reward"]),
        maxRewardMinorUnits = longValue("max-reward", opts["max-reward"]),
        search = opts["search"],
        sortBy = when (sortRaw) {
            "reward" -> SortField.REWARD
            "deadline" -> SortField.DEADLINE
            else -> SortField.CREATED
        },
        sortDirection = if (dirRaw == "asc") SortDirection.ASC else SortDirection.DESC,
        page = intValue("page", opts["page"]) ?: 1,
        pageSize = intValue("size", opts["size"]) ?: 10,
    )
    return when (val validation = query.validate()) {
        is ListingResult.Failure -> validation
        is ListingResult.Success -> ListingResult.Success(query)
    }
}
