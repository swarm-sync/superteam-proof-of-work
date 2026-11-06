package bounty

/**
 * Minimal dependency-free JSON reader/writer (no Jackson / kotlinx-serialization:
 * the sandbox cannot reliably reach Maven Central from the JVM, so the project
 * ships zero third-party runtime dependencies beyond the Kotlin stdlib and
 * kotlinx-coroutines, both bundled with the standalone compiler).
 *
 * Supports objects, arrays, strings (with escapes), integers, decimals,
 * booleans and null. Numbers without a fraction/exponent decode as [Long].
 */
object Json {
    fun parse(text: String): Any? {
        val parser = Parser(text)
        return parser.parseValue().also { parser.expectEnd() }
    }

    fun parseObject(text: String): Map<String, Any?> {
        val value = parse(text)
        require(value is Map<*, *>) { "Expected a JSON object" }
        @Suppress("UNCHECKED_CAST")
        return value as Map<String, Any?>
    }

    fun stringify(value: Any?): String = buildString { appendValue(value) }

    private fun StringBuilder.appendValue(value: Any?) {
        when (value) {
            null -> append("null")
            is String -> appendQuoted(value)
            is Boolean, is Number -> append(value.toString())
            is Map<*, *> -> {
                append('{')
                value.entries.forEachIndexed { index, (key, v) ->
                    if (index > 0) append(',')
                    appendQuoted(key.toString())
                    append(':')
                    appendValue(v)
                }
                append('}')
            }
            is Iterable<*> -> {
                append('[')
                value.forEachIndexed { index, v ->
                    if (index > 0) append(',')
                    appendValue(v)
                }
                append(']')
            }
            else -> appendQuoted(value.toString())
        }
    }

    private fun StringBuilder.appendQuoted(raw: String) {
        append('"')
        for (ch in raw) {
            when (ch) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                '\b' -> append("\\b")
                '' -> append("\\f")
                else -> if (ch.code < 0x20) append("\\u%04x".format(ch.code)) else append(ch)
            }
        }
        append('"')
    }

    /** Error body shape: `{"error": "...", "message": "...", "fieldErrors": [...]}`. */
    fun errorBody(error: ListingError): String {
        val body = linkedMapOf<String, Any?>(
            "error" to error::class.simpleName,
            "message" to error.message,
        )
        if (error is ListingError.Validation) {
            body["fieldErrors"] = error.errors.map { mapOf("field" to it.field, "message" to it.message) }
        }
        return stringify(body)
    }

    private class Parser(private val text: String) {
        private var pos = 0

        fun expectEnd() {
            skipWhitespace()
            check(pos == text.length) { "Trailing characters after JSON value at offset $pos" }
        }

        fun parseValue(): Any? {
            skipWhitespace()
            require(pos < text.length) { "Unexpected end of JSON input" }
            return when (val ch = text[pos]) {
                '{' -> parseObject()
                '[' -> parseArray()
                '"' -> parseString()
                't', 'f' -> parseBoolean()
                'n' -> parseNull()
                else -> parseNumber()
            }
        }

        private fun parseObject(): Map<String, Any?> {
            pos++ // consume '{'
            val result = linkedMapOf<String, Any?>()
            skipWhitespace()
            if (pos < text.length && text[pos] == '}') {
                pos++
                return result
            }
            while (true) {
                skipWhitespace()
                require(pos < text.length && text[pos] == '"') { "Expected string key at offset $pos" }
                val key = parseString()
                skipWhitespace()
                require(pos < text.length && text[pos] == ':') { "Expected ':' at offset $pos" }
                pos++
                result[key] = parseValue()
                skipWhitespace()
                require(pos < text.length) { "Unterminated object" }
                when (text[pos]) {
                    ',' -> pos++
                    '}' -> {
                        pos++
                        return result
                    }
                    else -> error("Expected ',' or '}' at offset $pos")
                }
            }
        }

        private fun parseArray(): List<Any?> {
            pos++ // consume '['
            val result = mutableListOf<Any?>()
            skipWhitespace()
            if (pos < text.length && text[pos] == ']') {
                pos++
                return result
            }
            while (true) {
                result += parseValue()
                skipWhitespace()
                require(pos < text.length) { "Unterminated array" }
                when (text[pos]) {
                    ',' -> pos++
                    ']' -> {
                        pos++
                        return result
                    }
                    else -> error("Expected ',' or ']' at offset $pos")
                }
            }
        }

        private fun parseString(): String {
            pos++ // consume opening quote
            val out = StringBuilder()
            while (pos < text.length) {
                val ch = text[pos++]
                when (ch) {
                    '"' -> return out.toString()
                    '\\' -> {
                        require(pos < text.length) { "Unterminated escape sequence" }
                        when (val esc = text[pos++]) {
                            '"' -> out.append('"')
                            '\\' -> out.append('\\')
                            '/' -> out.append('/')
                            'n' -> out.append('\n')
                            'r' -> out.append('\r')
                            't' -> out.append('\t')
                            'b' -> out.append('\b')
                            'f' -> out.append('')
                            'u' -> {
                                require(pos + 4 <= text.length) { "Bad unicode escape" }
                                out.append(text.substring(pos, pos + 4).toInt(16).toChar())
                                pos += 4
                            }
                            else -> error("Invalid escape '\\$esc' at offset ${pos - 1}")
                        }
                    }
                    else -> out.append(ch)
                }
            }
            error("Unterminated string")
        }

        private fun parseBoolean(): Boolean {
            return when {
                text.startsWith("true", pos) -> {
                    pos += 4
                    true
                }
                text.startsWith("false", pos) -> {
                    pos += 5
                    false
                }
                else -> error("Invalid literal at offset $pos")
            }
        }

        private fun parseNull(): Any? {
            require(text.startsWith("null", pos)) { "Invalid literal at offset $pos" }
            pos += 4
            return null
        }

        private fun parseNumber(): Number {
            val start = pos
            if (pos < text.length && text[pos] == '-') pos++
            while (pos < text.length && (text[pos].isDigit() || text[pos] in ".eE+-")) pos++
            val raw = text.substring(start, pos)
            require(raw.isNotEmpty() && raw != "-") { "Invalid number at offset $start" }
            return if (raw.contains('.') || raw.contains('e') || raw.contains('E')) raw.toDouble() else raw.toLong()
        }

        private fun skipWhitespace() {
            while (pos < text.length && text[pos].isWhitespace()) pos++
        }
    }
}
