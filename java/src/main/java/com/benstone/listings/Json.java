package com.benstone.listings;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal, correct JSON reader/writer for the small object shapes this service
 * uses. No third-party dependency: the JDK ships no JSON library, and pulling
 * one in would defeat the zero-dependency build. Supports objects, arrays,
 * strings (with escapes), numbers (as {@link BigDecimal}), booleans and null.
 */
public final class Json {

    private Json() {}

    // ---- Parsing ----

    public static Object parse(String text) {
        Parser p = new Parser(text);
        Object value = p.value();
        p.skipWhitespace();
        if (!p.atEnd()) {
            throw new JsonException("trailing content after JSON value");
        }
        return value;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String text) {
        Object value = parse(text);
        if (!(value instanceof Map)) {
            throw new JsonException("expected a JSON object");
        }
        return (Map<String, Object>) value;
    }

    // ---- Writing ----

    public static String stringify(Object value) {
        StringBuilder sb = new StringBuilder();
        write(value, sb);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void write(Object value, StringBuilder sb) {
        if (value == null) {
            sb.append("null");
        } else if (value instanceof String s) {
            sb.append('"').append(escape(s)).append('"');
        } else if (value instanceof Number || value instanceof Boolean) {
            sb.append(value.toString());
        } else if (value instanceof Map<?, ?> map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<String, Object> e : ((Map<String, Object>) map).entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append('"').append(escape(e.getKey())).append("\":");
                write(e.getValue(), sb);
            }
            sb.append('}');
        } else if (value instanceof List<?> list) {
            sb.append('[');
            boolean first = true;
            for (Object item : list) {
                if (!first) sb.append(',');
                first = false;
                write(item, sb);
            }
            sb.append(']');
        } else {
            throw new JsonException("cannot serialize " + value.getClass());
        }
    }

    private static String escape(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    /** Ordered map builder: {@code Json.obj("a", 1, "b", "x")}. */
    public static Map<String, Object> obj(Object... keysAndValues) {
        if (keysAndValues.length % 2 != 0) {
            throw new IllegalArgumentException("obj() needs even argument count");
        }
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keysAndValues.length; i += 2) {
            map.put((String) keysAndValues[i], keysAndValues[i + 1]);
        }
        return map;
    }

    public static class JsonException extends RuntimeException {
        public JsonException(String message) {
            super(message);
        }
    }

    private static final class Parser {
        private final String text;
        private int pos;

        Parser(String text) {
            this.text = text;
        }

        boolean atEnd() {
            return pos >= text.length();
        }

        void skipWhitespace() {
            while (!atEnd() && Character.isWhitespace(text.charAt(pos))) pos++;
        }

        Object value() {
            skipWhitespace();
            if (atEnd()) throw new JsonException("unexpected end of input");
            char c = text.charAt(pos);
            return switch (c) {
                case '{' -> object();
                case '[' -> array();
                case '"' -> string();
                case 't' -> literal("true", Boolean.TRUE);
                case 'f' -> literal("false", Boolean.FALSE);
                case 'n' -> literal("null", null);
                default -> {
                    if (c == '-' || (c >= '0' && c <= '9')) yield number();
                    throw new JsonException("unexpected character '" + c + "' at " + pos);
                }
            };
        }

        Map<String, Object> object() {
            pos++; // {
            Map<String, Object> map = new LinkedHashMap<>();
            skipWhitespace();
            if (!atEnd() && text.charAt(pos) == '}') {
                pos++;
                return map;
            }
            while (true) {
                skipWhitespace();
                if (atEnd() || text.charAt(pos) != '"') {
                    throw new JsonException("expected string key at " + pos);
                }
                String key = string();
                skipWhitespace();
                if (atEnd() || text.charAt(pos) != ':') {
                    throw new JsonException("expected ':' at " + pos);
                }
                pos++;
                map.put(key, value());
                skipWhitespace();
                if (atEnd()) throw new JsonException("unterminated object");
                char c = text.charAt(pos);
                if (c == '}') {
                    pos++;
                    return map;
                }
                if (c != ',') throw new JsonException("expected ',' or '}' at " + pos);
                pos++;
            }
        }

        List<Object> array() {
            pos++; // [
            List<Object> list = new ArrayList<>();
            skipWhitespace();
            if (!atEnd() && text.charAt(pos) == ']') {
                pos++;
                return list;
            }
            while (true) {
                list.add(value());
                skipWhitespace();
                if (atEnd()) throw new JsonException("unterminated array");
                char c = text.charAt(pos);
                if (c == ']') {
                    pos++;
                    return list;
                }
                if (c != ',') throw new JsonException("expected ',' or ']' at " + pos);
                pos++;
            }
        }

        String string() {
            pos++; // opening quote
            StringBuilder sb = new StringBuilder();
            while (!atEnd()) {
                char c = text.charAt(pos++);
                if (c == '"') return sb.toString();
                if (c == '\\') {
                    if (atEnd()) break;
                    char e = text.charAt(pos++);
                    switch (e) {
                        case '"' -> sb.append('"');
                        case '\\' -> sb.append('\\');
                        case '/' -> sb.append('/');
                        case 'n' -> sb.append('\n');
                        case 'r' -> sb.append('\r');
                        case 't' -> sb.append('\t');
                        case 'b' -> sb.append('\b');
                        case 'f' -> sb.append('\f');
                        case 'u' -> {
                            if (pos + 4 > text.length()) {
                                throw new JsonException("bad unicode escape");
                            }
                            sb.append((char) Integer.parseInt(text.substring(pos, pos + 4), 16));
                            pos += 4;
                        }
                        default -> throw new JsonException("bad escape '\\" + e + "'");
                    }
                } else {
                    sb.append(c);
                }
            }
            throw new JsonException("unterminated string");
        }

        Object literal(String word, Object result) {
            if (!text.startsWith(word, pos)) {
                throw new JsonException("invalid literal at " + pos);
            }
            pos += word.length();
            return result;
        }

        BigDecimal number() {
            int start = pos;
            if (!atEnd() && text.charAt(pos) == '-') pos++;
            while (!atEnd() && Character.isDigit(text.charAt(pos))) pos++;
            if (!atEnd() && text.charAt(pos) == '.') {
                pos++;
                while (!atEnd() && Character.isDigit(text.charAt(pos))) pos++;
            }
            if (!atEnd() && (text.charAt(pos) == 'e' || text.charAt(pos) == 'E')) {
                pos++;
                if (!atEnd() && (text.charAt(pos) == '+' || text.charAt(pos) == '-')) pos++;
                while (!atEnd() && Character.isDigit(text.charAt(pos))) pos++;
            }
            try {
                return new BigDecimal(text.substring(start, pos));
            } catch (NumberFormatException e) {
                throw new JsonException("invalid number at " + start);
            }
        }
    }
}
