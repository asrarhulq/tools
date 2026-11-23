#!/usr/bin/env bash
# Full pipeline: grid counts -> figures -> statistics -> web JSON, for one data configuration.
# Usage: scripts/run_all.sh CSV OUTDIR [extra args, e.g. --end-year 2024 --exclude-years 2024]
# Runs Python in isolated mode (-I) from a scratch working directory so nothing in data/ or
# scripts/ can shadow a stdlib/site module.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ROOT="$(dirname "$HERE")"
PY="$ROOT/.venv/bin/python3"; CSV="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT="$(mkdir -p "$2" && cd "$2" && pwd)"; shift 2
cd "$(mktemp -d)"
"$PY" -I "$HERE/analyze2.py" --csv "$CSV" --out "$OUT" "$@" > "$OUT/analyze2.txt"
"$PY" -I "$HERE/figs2.py" --out "$OUT" > /dev/null
"$PY" -I "$HERE/stats3.py" --csv "$CSV" --out "$OUT" "$@" > "$OUT/stats3.txt"
echo "done -> $OUT"
