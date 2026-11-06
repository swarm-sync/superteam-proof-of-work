#!/usr/bin/env bash
# Builds (if needed) and runs the listings CLI: ./run.sh <command> [options]
# Examples:
#   ./run.sh seed
#   ./run.sh list --category DEVELOPMENT --sort reward --dir desc --page 1 --size 5
#   ./run.sh create '{"title":"...","description":"...","category":"DEVELOPMENT","rewardMinorUnits":100000,"currency":"USDC","deadline":null}'
set -euo pipefail

export TMPDIR="$HOME/tmp"
export JAVA_HOME="$HOME/.jdk21"
export PATH="$JAVA_HOME/bin:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d "$ROOT/out/main" ] || [ -z "$(ls -A "$ROOT/out/main" 2>/dev/null)" ]; then
  "$ROOT/build.sh"
fi

java -cp "$ROOT/out/main:$ROOT/lib/kotlin-stdlib.jar:$ROOT/lib/kotlinx-coroutines-core-jvm.jar" \
  bounty.MainKt "$@"
