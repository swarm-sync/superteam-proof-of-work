# Superteam Earn — Proof of Work submission (Java)

**Suggested title (60 chars):**
Listings REST service in Java: validation & state machine

**Description:**
Bounty/job listings REST API in Java 21 with zero dependencies (JDK
`HttpServer` only): strict request validation with per-field 400 errors, a
real DRAFT → OPEN → CLOSED state machine where illegal transitions are
explicit 409s, uniform error bodies that never leak stack traces, and a
thread-safe in-memory store behind a repository seam ready for JPA/Postgres.
Nine integration tests (47 checks) run against live HTTP and pass.

**Skills tag:** Java

**What it demonstrates:** backend fundamentals — API design, validation,
error handling, state machines, thread safety, and honest testing. Built by
the backend architect (no dedicated Java specialist on the team); Spring Boot
was attempted first but Maven Central is unreachable from the JVM in this
sandbox, so the service is dependency-free and fully verified here instead
of shipping uncompiled framework code.

Public link: https://github.com/swarm-sync/superteam-proof-of-work/tree/main/java
