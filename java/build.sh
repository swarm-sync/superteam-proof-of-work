#!/bin/bash
# Compile the listings service. Zero dependencies: plain javac, JDK 17+.
# Usage: ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
JAVA="${JAVA_HOME:+$JAVA_HOME/bin/}javac"
mkdir -p out/classes out/test-classes
"$JAVA" -d out/classes $(find src/main/java -name '*.java')
"$JAVA" -cp out/classes -d out/test-classes $(find src/test/java -name '*.java')
echo "build OK: classes in out/"
