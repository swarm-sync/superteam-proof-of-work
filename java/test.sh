#!/bin/bash
# Build and run the integration tests against a real server on an ephemeral port.
# Usage: ./test.sh
set -euo pipefail
cd "$(dirname "$0")"
./build.sh
JAVA="${JAVA_HOME:+$JAVA_HOME/bin/}java"
"$JAVA" -cp out/classes:out/test-classes com.benstone.listings.ListingApiTest
