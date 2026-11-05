#!/bin/bash
# Run the listings service. Usage: ./run.sh [port]   (default 8080)
set -euo pipefail
cd "$(dirname "$0")"
./build.sh
export PORT="${1:-8080}"
JAVA="${JAVA_HOME:+$JAVA_HOME/bin/}java"
exec "$JAVA" -cp out/classes com.benstone.listings.ListingsApplication
