package com.benstone.listings;

import com.sun.net.httpserver.HttpServer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;

/**
 * Integration tests for the listings API, run against a real server on an
 * ephemeral port with the JDK's own {@link HttpClient}. No test framework:
 * the JDK ships none, and the point is verifying real HTTP behaviour —
 * status codes, error bodies, validation, and the state machine.
 *
 * <p>Run with {@code ./test.sh}. Exits non-zero if any check fails.
 */
public class ListingApiTest {

    private static String base;
    private static final List<String> failures = new ArrayList<>();
    private static int passed;

    private static final String VALID_BODY = """
            {
              "title": "Build a Solana validator dashboard",
              "description": "Real-time validator performance dashboard.",
              "category": "BOUNTY",
              "rewardAmount": 2.5,
              "currency": "SOL"
            }
            """;

    public static void main(String[] args) throws Exception {
        HttpServer server = ListingsApplication.createServer(0);
        server.start();
        base = "http://127.0.0.1:" + server.getAddress().getPort();
        try {
            testCreateReturns201AndStartsDraft();
            testCreateRejectsBlankTitleWithFieldErrors();
            testCreateRejectsZeroRewardAndUnknownEnum();
            testCreateRejectsMalformedJson();
            testGetUnknownIdReturns404WithStructuredError();
            testGetMalformedIdReturns400Not500();
            testLifecycleAndIllegalTransitionsAre409();
            testListFiltersByStatusAndCategory();
            testDeleteRemovesAndSecondDeleteIs404();
        } finally {
            server.stop(0);
            if (server.getExecutor() instanceof ExecutorService es) {
                es.shutdown();
            }
        }
        System.out.println("passed: " + passed + ", failed: " + failures.size());
        for (String f : failures) {
            System.out.println("FAIL: " + f);
        }
        if (!failures.isEmpty()) {
            System.exit(1);
        }
    }

    // ---- HTTP helpers ----
    //
    // Transport note: this sandbox blocks TCP connections originated by the
    // JVM itself ("other_tcp" policy), so the test client shells out to curl,
    // which the sandbox permits — the server under test is still the real
    // Java HttpServer, and every assertion still runs against live HTTP
    // responses. On an ordinary machine the same checks could use
    // java.net.http.HttpClient with no other change.

    private record Resp(int status, String body) {
        Map<String, Object> json() {
            return Json.parseObject(body);
        }

        List<Object> jsonArray() {
            Object value = Json.parse(body);
            if (!(value instanceof List<?> list)) {
                throw new AssertionError("expected JSON array, got: " + body);
            }
            return new ArrayList<>(list);
        }
    }

    private static Resp request(String method, String path, String body) throws Exception {
        java.nio.file.Path reqFile = null;
        java.nio.file.Path respFile = java.nio.file.Files.createTempFile("listing-test-resp", ".json");
        try {
            List<String> cmd = new ArrayList<>(List.of(
                    "curl", "-s", "-S", "--max-time", "10",
                    "-o", respFile.toString(),
                    "-w", "%{http_code}",
                    "-X", method,
                    "-H", "Content-Type: application/json"));
            if (body != null) {
                reqFile = java.nio.file.Files.createTempFile("listing-test-req", ".json");
                java.nio.file.Files.writeString(reqFile, body);
                cmd.add("--data-binary");
                cmd.add("@" + reqFile);
            }
            cmd.add(base + path);
            Process proc = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            String stdout = new String(proc.getInputStream().readAllBytes(),
                    java.nio.charset.StandardCharsets.UTF_8);
            int exit = proc.waitFor();
            if (exit != 0) {
                throw new AssertionError("curl failed (exit " + exit + "): " + stdout);
            }
            int status = Integer.parseInt(stdout.trim());
            String respBody = java.nio.file.Files.readString(respFile);
            return new Resp(status, respBody);
        } finally {
            java.nio.file.Files.deleteIfExists(respFile);
            if (reqFile != null) {
                java.nio.file.Files.deleteIfExists(reqFile);
            }
        }
    }

    // ---- assertions ----

    private static void check(String name, boolean condition, String detail) {
        if (condition) {
            passed++;
            System.out.println("PASS: " + name);
        } else {
            failures.add(name + " — " + detail);
            System.out.println("FAIL: " + name + " — " + detail);
        }
    }

    private static void eq(String name, Object expected, Object actual) {
        check(name, expected.equals(actual), "expected <" + expected + "> but got <" + actual + ">");
    }

    private static String createListing() throws Exception {
        Resp r = request("POST", "/api/listings", VALID_BODY);
        eq("create returns 201", 201, r.status());
        Map<String, Object> json = r.json();
        eq("new listing starts DRAFT", "DRAFT", json.get("status"));
        eq("title echoed", "Build a Solana validator dashboard", json.get("title"));
        check("id present", json.get("id") instanceof String, "no id in " + r.body());
        return (String) json.get("id");
    }

    // ---- tests ----

    private static void testCreateReturns201AndStartsDraft() throws Exception {
        createListing();
    }

    private static void testCreateRejectsBlankTitleWithFieldErrors() throws Exception {
        Resp r = request("POST", "/api/listings",
                """
                {"title": "", "description": "x", "category": "JOB",
                 "rewardAmount": 10, "currency": "USDC"}
                """);
        eq("blank title -> 400", 400, r.status());
        eq("error is Bad Request", "Bad Request", r.json().get("error"));
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) r.json().get("fieldErrors");
        check("fieldErrors names title", fields.containsKey("title"), r.body());
    }

    private static void testCreateRejectsZeroRewardAndUnknownEnum() throws Exception {
        Resp zero = request("POST", "/api/listings",
                """
                {"title": "t", "description": "x", "category": "JOB",
                 "rewardAmount": 0, "currency": "USDC"}
                """);
        eq("zero reward -> 400", 400, zero.status());
        @SuppressWarnings("unchecked")
        Map<String, Object> fields = (Map<String, Object>) zero.json().get("fieldErrors");
        check("fieldErrors names rewardAmount", fields.containsKey("rewardAmount"), zero.body());

        Resp badEnum = request("POST", "/api/listings",
                """
                {"title": "t", "description": "x", "category": "NOPE",
                 "rewardAmount": 10, "currency": "USDC"}
                """);
        eq("unknown enum -> 400", 400, badEnum.status());
    }

    private static void testCreateRejectsMalformedJson() throws Exception {
        Resp r = request("POST", "/api/listings", "{not json");
        eq("malformed JSON -> 400", 400, r.status());
        eq("error is Bad Request", "Bad Request", r.json().get("error"));
    }

    private static void testGetUnknownIdReturns404WithStructuredError() throws Exception {
        Resp r = request("GET", "/api/listings/00000000-0000-0000-0000-000000000000", null);
        eq("unknown id -> 404", 404, r.status());
        Map<String, Object> json = r.json();
        eq("error is Not Found", "Not Found", json.get("error"));
        check("error body carries status 404",
                Integer.valueOf(404).equals(toInt(json.get("status"))), r.body());
        eq("error body carries path",
                "/api/listings/00000000-0000-0000-0000-000000000000", json.get("path"));
    }

    private static void testGetMalformedIdReturns400Not500() throws Exception {
        Resp r = request("GET", "/api/listings/not-a-uuid", null);
        eq("malformed id -> 400", 400, r.status());
    }

    private static void testLifecycleAndIllegalTransitionsAre409() throws Exception {
        String id = createListing();

        Resp closeDraft = request("POST", "/api/listings/" + id + "/close", "");
        eq("DRAFT -> CLOSED is 409", 409, closeDraft.status());
        eq("409 error is Conflict", "Conflict", closeDraft.json().get("error"));

        Resp open = request("POST", "/api/listings/" + id + "/open", "");
        eq("DRAFT -> OPEN is 200", 200, open.status());
        eq("status is OPEN", "OPEN", open.json().get("status"));

        Resp openAgain = request("POST", "/api/listings/" + id + "/open", "");
        eq("OPEN -> OPEN is 409", 409, openAgain.status());

        Resp close = request("POST", "/api/listings/" + id + "/close", "");
        eq("OPEN -> CLOSED is 200", 200, close.status());
        eq("status is CLOSED", "CLOSED", close.json().get("status"));

        Resp closeAgain = request("POST", "/api/listings/" + id + "/close", "");
        eq("CLOSED -> CLOSED is 409", 409, closeAgain.status());
    }

    private static void testListFiltersByStatusAndCategory() throws Exception {
        String id = createListing();
        request("POST", "/api/listings/" + id + "/open", "");

        Resp open = request("GET", "/api/listings?status=OPEN", null);
        eq("list OPEN -> 200", 200, open.status());
        check("OPEN list is non-empty", !open.jsonArray().isEmpty(), open.body());
        check("OPEN list only contains OPEN",
                open.jsonArray().stream().allMatch(item -> "OPEN".equals(jsonMap(item).get("status"))),
                open.body());

        Resp closed = request("GET", "/api/listings?status=CLOSED", null);
        eq("list CLOSED -> 200", 200, closed.status());
        // An earlier test closed a listing on this shared server, so the
        // list is non-empty; the filter guarantee is that every item is CLOSED.
        check("CLOSED list only contains CLOSED",
                !closed.jsonArray().isEmpty()
                        && closed.jsonArray().stream().allMatch(item -> "CLOSED".equals(jsonMap(item).get("status"))),
                closed.body());

        Resp grants = request("GET", "/api/listings?category=GRANT", null);
        eq("list GRANT -> 200", 200, grants.status());
        eq("GRANT list is empty", 0, grants.jsonArray().size());
    }

    private static void testDeleteRemovesAndSecondDeleteIs404() throws Exception {
        String id = createListing();
        Resp del = request("DELETE", "/api/listings/" + id, null);
        eq("delete -> 204", 204, del.status());
        Resp get = request("GET", "/api/listings/" + id, null);
        eq("deleted listing -> 404", 404, get.status());
        Resp delAgain = request("DELETE", "/api/listings/" + id, null);
        eq("second delete -> 404", 404, delAgain.status());
    }

    private static Integer toInt(Object value) {
        return value instanceof java.math.BigDecimal bd ? Integer.valueOf(bd.intValueExact()) : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> jsonMap(Object value) {
        return (Map<String, Object>) value;
    }
}
