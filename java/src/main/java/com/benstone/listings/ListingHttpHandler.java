package com.benstone.listings;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * HTTP layer for the listings API (JDK built-in {@code HttpServer}, no framework).
 *
 * <pre>
 * POST   /api/listings                  create (201, starts DRAFT)
 * GET    /api/listings                  list, ?status=&amp;category=&amp;offset=&amp;limit=
 * GET    /api/listings/{id}             one listing (404 when unknown)
 * POST   /api/listings/{id}/open        DRAFT -&gt; OPEN
 * POST   /api/listings/{id}/close       OPEN -&gt; CLOSED
 * DELETE /api/listings/{id}             delete (204; 404 when unknown)
 * GET    /health                        liveness probe
 * </pre>
 *
 * <p>Every failure maps to one status, in one place:
 * 400 malformed JSON / validation / bad enum / bad UUID / bad query value,
 * 404 unknown listing, 409 illegal state transition, 500 anything else
 * (logged server-side, generic message to the client — never a stack trace).
 */
public class ListingHttpHandler implements HttpHandler {

    private static final Logger LOG = Logger.getLogger(ListingHttpHandler.class.getName());
    private static final int MAX_LIMIT = 100;

    private final ListingService service;

    public ListingHttpHandler(ListingService service) {
        this.service = service;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        try {
            if (method.equals("GET") && path.equals("/health")) {
                send(exchange, 200, Json.stringify(Json.obj("status", "ok")));
                return;
            }
            if (path.equals("/api/listings")) {
                if (method.equals("POST")) {
                    create(exchange);
                } else if (method.equals("GET")) {
                    list(exchange);
                } else {
                    methodNotAllowed(exchange);
                }
                return;
            }
            if (path.startsWith("/api/listings/")) {
                String rest = path.substring("/api/listings/".length());
                String[] parts = rest.split("/");
                if (parts.length == 1) {
                    UUID id = parseId(exchange, parts[0]);
                    if (id == null) return;
                    if (method.equals("GET")) {
                        send(exchange, 200, toJson(service.get(id)));
                    } else if (method.equals("DELETE")) {
                        service.delete(id);
                        sendNoBody(exchange, 204);
                    } else {
                        methodNotAllowed(exchange);
                    }
                    return;
                }
                if (parts.length == 2 && method.equals("POST")) {
                    UUID id = parseId(exchange, parts[0]);
                    if (id == null) return;
                    switch (parts[1]) {
                        case "open" -> send(exchange, 200, toJson(service.open(id)));
                        case "close" -> send(exchange, 200, toJson(service.close(id)));
                        default -> notFound(exchange, path);
                    }
                    return;
                }
            }
            notFound(exchange, path);
        } catch (ListingNotFoundException e) {
            sendError(exchange, ApiError.of(404, "Not Found", e.getMessage(), path));
        } catch (IllegalListingStateException e) {
            sendError(exchange, ApiError.of(409, "Conflict", e.getMessage(), path));
        } catch (RespondedException e) {
            // A response was already sent (e.g. bad query parameter); nothing more to do.
        } catch (Exception e) {
            LOG.log(Level.SEVERE, "unexpected error handling " + method + " " + path, e);
            sendError(exchange, ApiError.of(
                    500, "Internal Server Error", "an unexpected error occurred", path));
        } finally {
            exchange.close();
        }
    }

    private void create(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        Map<String, Object> body;
        try {
            body = Json.parseObject(readBody(exchange));
        } catch (Json.JsonException e) {
            sendError(exchange, ApiError.of(
                    400, "Bad Request", "request body is not valid JSON: " + e.getMessage(), path));
            return;
        }
        CreateListingRequest.ValidationResult result = CreateListingRequest.parse(body);
        if (!result.valid()) {
            sendError(exchange, ApiError.ofFields(
                    400, "Bad Request", "validation failed", path, result.errors()));
            return;
        }
        Listing created = service.create(result.request());
        send(exchange, 201, toJson(created));
    }

    private void list(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        Map<String, String> query = queryParams(exchange.getRequestURI());

        Listing.Status status = null;
        if (query.containsKey("status")) {
            try {
                status = Listing.Status.valueOf(query.get("status"));
            } catch (IllegalArgumentException e) {
                sendError(exchange, ApiError.of(
                        400, "Bad Request", "unknown status: " + query.get("status"), path));
                return;
            }
        }
        Listing.Category category = null;
        if (query.containsKey("category")) {
            try {
                category = Listing.Category.valueOf(query.get("category"));
            } catch (IllegalArgumentException e) {
                sendError(exchange, ApiError.of(
                        400, "Bad Request", "unknown category: " + query.get("category"), path));
                return;
            }
        }
        int offset = parseIntOr(exchange, query.get("offset"), 0);
        int limit = parseIntOr(exchange, query.get("limit"), 20);
        if (offset < 0 || limit < 0) {
            sendError(exchange, ApiError.of(
                    400, "Bad Request", "offset and limit must not be negative", path));
            return;
        }
        offset = Math.max(0, offset);
        limit = Math.min(MAX_LIMIT, Math.max(1, limit));

        List<Map<String, Object>> out = new ArrayList<>();
        for (Listing l : service.list(status, category, offset, limit)) {
            out.add(toMap(l));
        }
        send(exchange, 200, Json.stringify(out));
    }

    // ---- helpers ----

    private UUID parseId(HttpExchange exchange, String raw) throws IOException {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            sendError(exchange, ApiError.of(400, "Bad Request",
                    "invalid listing id: " + raw, exchange.getRequestURI().getPath()));
            return null;
        }
    }

    private int parseIntOr(HttpExchange exchange, String raw, int fallback) throws IOException {
        if (raw == null) return fallback;
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException e) {
            sendError(exchange, ApiError.of(400, "Bad Request",
                    "invalid integer value: " + raw, exchange.getRequestURI().getPath()));
            throw new RespondedException();
        }
    }

    private Map<String, String> queryParams(URI uri) {
        Map<String, String> params = new LinkedHashMap<>();
        String raw = uri.getRawQuery();
        if (raw == null || raw.isEmpty()) return params;
        for (String pair : raw.split("&")) {
            int eq = pair.indexOf('=');
            String key = eq >= 0 ? decode(pair.substring(0, eq)) : decode(pair);
            String value = eq >= 0 ? decode(pair.substring(eq + 1)) : "";
            params.put(key, value);
        }
        return params;
    }

    private String decode(String s) {
        return java.net.URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream in = exchange.getRequestBody()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void send(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private void sendNoBody(HttpExchange exchange, int status) throws IOException {
        exchange.sendResponseHeaders(status, -1);
    }

    private void sendError(HttpExchange exchange, ApiError error) throws IOException {
        send(exchange, error.status(), error.toJson());
    }

    private void notFound(HttpExchange exchange, String path) throws IOException {
        sendError(exchange, ApiError.of(404, "Not Found", "no such route: " + path, path));
    }

    private void methodNotAllowed(HttpExchange exchange) throws IOException {
        sendError(exchange, ApiError.of(405, "Method Not Allowed",
                "method not allowed for this route", exchange.getRequestURI().getPath()));
    }

    private String toJson(Listing listing) {
        return Json.stringify(toMap(listing));
    }

    private Map<String, Object> toMap(Listing l) {
        return Json.obj(
                "id", l.id().toString(),
                "title", l.title(),
                "description", l.description(),
                "category", l.category().name(),
                "rewardAmount", l.rewardAmount(),
                "currency", l.currency().name(),
                "status", l.status().name(),
                "createdAt", l.createdAt().toString(),
                "updatedAt", l.updatedAt().toString());
    }

    /**
     * Thrown after a response has already been sent (e.g. a bad query
     * parameter), so the outer handler skips its own error mapping.
     */
    private static final class RespondedException extends RuntimeException {}
}
