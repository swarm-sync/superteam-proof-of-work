package com.benstone.listings;

import java.time.Instant;
import java.util.Map;

/**
 * Uniform error body for every failure response. No stack traces leak to clients.
 * Serialized with {@link #toJson()} via the project's minimal JSON writer.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, Map.of());
    }

    public static ApiError ofFields(
            int status, String error, String message, String path, Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status, error, message, path, Map.copyOf(fieldErrors));
    }

    public String toJson() {
        return Json.stringify(Json.obj(
                "timestamp", timestamp.toString(),
                "status", status,
                "error", error,
                "message", message,
                "path", path,
                "fieldErrors", fieldErrors));
    }
}
