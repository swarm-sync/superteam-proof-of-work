#!/usr/bin/env bash
# Builds the Kotlin bounty-listings service (main + tests) with the standalone
# kotlinc compiler. No Gradle/Maven, no network.
set -euo pipefail

export TMPDIR="$HOME/tmp"
export JAVA_HOME="$HOME/.jdk21"
KOTLINC_HOME="$HOME/.kotlin-dist/kotlinc"
export PATH="$KOTLINC_HOME/bin:$JAVA_HOME/bin:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT/out/main" "$ROOT/out/test"

echo "== compiling main =="
kotlinc "$ROOT"/src/main/kotlin/bounty/*.kt \
  -cp "$ROOT/lib/kotlinx-coroutines-core-jvm.jar" \
  -d "$ROOT/out/main"

echo "== compiling tests =="
kotlinc "$ROOT"/src/test/kotlin/bounty/*.kt \
  -cp "$ROOT/out/main:$ROOT/lib/kotlin-stdlib.jar:$ROOT/lib/kotlin-test.jar:$ROOT/lib/kotlin-test-junit.jar:$ROOT/lib/kotlinx-coroutines-core-jvm.jar:$ROOT/lib/junit-4.13.2.jar:$ROOT/lib/hamcrest-core-1.3.jar" \
  -d "$ROOT/out/test"

echo "Build OK."
