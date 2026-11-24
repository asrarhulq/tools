#!/usr/bin/env bash
# Full pipeline from the raw SPC file.
#   1. replicate.py  - our independent analysis, check vs Agee et al. (2016), extension past 2013
#   2. export_web.py - the one JSON file the web tool reads
# (analyze2/figs2/stats3 are the original handoff scripts, kept for cross-checking.)
# Usage: scripts/run_all.sh [SPC.csv]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ROOT="$(dirname "$HERE")"
PY="$ROOT/.venv/bin/python3"
CSV="${1:-$ROOT/data/spc-2024/1950-2024_actual_tornadoes.csv}"; CSV="$(cd "$(dirname "$CSV")" && pwd)/$(basename "$CSV")"
cd "$(mktemp -d)"   # run outside data/ and scripts/
"$PY" -I "$HERE/replicate.py" --csv "$CSV" --out "$ROOT/out/replication" | tee "$ROOT/out/replication/validation.txt"
"$PY" -I "$HERE/export_web.py" --csv "$CSV" --topo "$ROOT/data/us-atlas/states-10m.json" \
  --replication "$ROOT/out/replication/replication.json" \
  --json "$ROOT/../src/features/alley-tracker/data/alley-tracker.json"
