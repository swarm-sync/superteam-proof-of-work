# Listings Service — Java

A bounty / grant / job listings REST service in Java 21. No frameworks, no
third-party dependencies: the JDK's built-in `HttpServer`, a hand-written
minimal JSON reader/writer, and a thread-safe in-memory store. The point is
the engineering — validation, a real state machine, uniform errors, and
tests against live HTTP — not the dependency list.

## What it demonstrates

- **Validation before business logic** — title/description required and
  length-capped, category/currency must be known enum values, reward must be
  a positive number with sane digit limits. A bad request is a `400` with
  per-field messages, never a half-created row and never a `500`.
- **A real state machine** — listings start `DRAFT` (nothing public by
  accident); only `DRAFT → OPEN` and `OPEN → CLOSED` are legal. Any other
  transition is a `409 Conflict` with an explicit message — a second close is
  a visible error, not a silent second side effect.
- **Uniform error responses** — every failure is one JSON shape
  (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors`):
  `400` malformed JSON / validation / bad enum / bad UUID, `404` unknown
  listing, `409` illegal transition, `500` unexpected (logged server-side,
  generic message to the client — stack traces never leak).
- **Thread safety** — `ConcurrentHashMap` store, immutable `Listing` records,
  `Clock` injected (not `Instant.now()` inline) so time is testable.
- **Clean seams** — `ListingRepository` is the persistence seam (swap in a
  JPA/Postgres implementation without touching the service or handler);
  `ListingService` owns every rule independent of HTTP.

## Layout

```
src/main/java/com/benstone/listings/
  ListingsApplication.java   entry point, graceful shutdown
  ListingHttpHandler.java    routing + status mapping (the HTTP layer)
  ListingService.java        business rules (the state machine)
  Listing.java               immutable record + enums
  CreateListingRequest.java  JSON parsing + field validation
  ListingRepository.java / InMemoryListingRepository.java
  Json.java                  minimal JSON parser/serializer (no Jackson)
  ApiError.java              uniform error body
  ListingNotFoundException.java / IllegalListingStateException.java
src/test/java/com/benstone/listings/
  ListingApiTest.java        9 integration tests, 47 checks, live HTTP
build.sh / test.sh / run.sh  plain-javac scripts (no build tool needed)
```

## Run it

```bash
./test.sh        # build + 9 integration tests (47 checks) on an ephemeral port
./run.sh 8080    # start the service (PORT env var also works)
```

Requires JDK 17+ (verified with Temurin OpenJDK 21.0.13). No Maven, no
downloads, no accounts, no network calls at runtime.

## Try it live

```bash
# Create (201, starts DRAFT)
curl -X POST localhost:8080/api/listings -H 'content-type: application/json' \
  -d '{"title":"Audit a Solana program","description":"Security review.",
       "category":"BOUNTY","rewardAmount":5,"currency":"SOL"}'

# Open, then close (replace $ID)
curl -X POST localhost:8080/api/listings/$ID/open
curl -X POST localhost:8080/api/listings/$ID/close
curl -X POST localhost:8080/api/listings/$ID/close   # 409 Conflict

# List with filters
curl 'localhost:8080/api/listings?status=OPEN&category=BOUNTY&limit=10'

# Bad create → 400 with per-field errors
curl -X POST localhost:8080/api/listings -H 'content-type: application/json' \
  -d '{"title":"","description":"x","category":"JOB","rewardAmount":0,"currency":"USDC"}'

curl localhost:8080/health
```

## Verified

- `./test.sh`: **47 checks passed, 0 failed** (JDK 21.0.13), verified 2026-11-05.
- Live smoke test: create → open → close → second close `409` →
  bad create `400` with `fieldErrors` → unknown id `404`, all with the
  uniform error body.

## Honest notes

- **Why not Spring Boot?** The first attempt was Spring Boot 3.4.1 via Maven
  3.9.9 (installed for this build). Maven Central is unreachable from the JVM
  in this sandbox: the egress proxy terminates JVM-originated TLS (verified
  with a minimal `HttpURLConnection` probe — empty response even with proxy
  auth), while `curl` reaches the same URL fine. Rather than ship Spring
  source I could not compile or test here, the service is built on the JDK
  alone — every line is compiled, run, and tested in this environment.
  The design (repository seam, service layer, uniform errors) ports directly
  to Spring Boot + JPA on a normal machine.
- **Test transport:** the same sandbox policy blocks TCP from the JVM test
  client, so `ListingApiTest` drives requests through `curl` (subprocess)
  against the real Java server. The server and all assertions are real;
  only the client transport is adapted. On an ordinary machine the same
  checks could use `java.net.http.HttpClient` with no other change.
- The in-memory store does not survive a restart by design; the repository
  interface is where a durable store plugs in.
