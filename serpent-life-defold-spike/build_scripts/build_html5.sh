#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JAVA="$ROOT/../tools/jdk/jdk-25.0.3+9/Contents/Home/bin/java"
BOB="$ROOT/../tools/defold/1.12.4/bob.jar"
OUT="$ROOT/../dist/defold-html5"

"$JAVA" -jar "$BOB" \
  --root "$ROOT" \
  --archive \
  --platform wasm-web \
  --architectures wasm-web \
  --variant release \
  --bundle-output "$OUT" \
  resolve distclean build bundle

