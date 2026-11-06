#!/usr/bin/env bash
# Builds everything, then runs the JUnit test suite and reports the counts.
set -euo pipefail

export TMPDIR="$HOME/tmp"
export JAVA_HOME="$HOME/.jdk21"
export PATH="$JAVA_HOME/bin:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
"$ROOT/build.sh"

echo "== running tests =="
java -cp "$ROOT/out/main:$ROOT/out/test:$ROOT/lib/kotlin-stdlib.jar:$ROOT/lib/kotlin-test.jar:$ROOT/lib/kotlin-test-junit.jar:$ROOT/lib/kotlinx-coroutines-core-jvm.jar:$ROOT/lib/junit-4.13.2.jar:$ROOT/lib/hamcrest-core-1.3.jar" \
  org.junit.runner.JUnitCore bounty.ListingServiceTest
