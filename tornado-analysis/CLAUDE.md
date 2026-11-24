# Tornado shift project (Purdue final project, ME/EAPS class)

Goal: replicate Agee, Larson, Childs, Marmo (2016), JAMC 55, 1681-1697 (agee_2016.pdf), then extend past 2013, and build an interactive Next.js tool "Alley Tracker: Boilermaker Edition".

## Method (from the paper)
- Domain 30-50N, 80-105W, 2.5 degree boxes. (E)F1+ only (F0 excluded). Significant = F2+.
- A tornado counts once in every box its path starts in, ends in, or crosses (straight line start to end).
- Period I 1954-1983, Period II 1984-2013, new Period III 2014-latest full year (unequal length, so compare yearly averages).
- Also count "tornado days" (days with >=1 F1+ tornado in a box).
- Still TO DO: field significance (block bootstrap, block size 5, 10,000 resamples, alpha 0.05) and bootstrap CI of annual means; seasonal (DJF/MAM/JJA/SON) analysis.

## Status
- scripts/analyze2.py and figs2.py work on data/tornados.csv (SPC copy, 1950-2022).
- Validation: busiest box Period I = 479 (paper 477, SE OK/NE TX); Period II = 448 (paper 477, N Alabama). State F1+ counts OK 1192/734 vs paper 1096/713, TN 280/477 vs 275/457. Gaps likely from database revisions since 2016; document, don't hide.
- Preliminary: east box (35-37.5N, 87.5-85W) ~12 tornadoes/yr in II and III, 6 in I. Shift held, not grown (first look only).

## Status (2026-11-23)
- Data: data/spc-2024/1950-2024_actual_tornadoes.csv (official SPC, whole tracks, sg=1 only). Old data/tornados.csv (to 2022) kept for comparison; 1954-2022 agree to within 4 F1+ tornadoes.
- Pipeline: `scripts/run_all.sh CSV OUTDIR [--end-year 2024] [--exclude-years 2024]` runs analyze2 -> figs2 -> stats3 (python3 -I, .venv). Outputs in out/thru2022, out/thru2024, out/thru2023_no2024.
- stats3.py: field significance (block bootstrap 5 yr, 10k, alpha .05; Livezey-Chen Monte Carlo threshold), east/west bootstrap CIs (paper Fig. 12), seasonal DJF/MAM/JJA/SON. F1+ II vs I: N 27.5% (paper 27.5), threshold 10.0% (paper 8.75).
- Web: scripts/export_web.py writes src/features/alley-tracker/data/alley-tracker.json (needs data/us-atlas/states-10m.json). Tool live at /general/alley-tracker with PDF report; TS stats port matches Python.
- Period III vs II field significance is descriptive only (10-11 yrs = ~2 blocks).

## Independent replication (2026-11-23, supersedes the numbers above)
- scripts/tornado_core.py + replicate.py: written from the paper's text, exact path-box intersection (no point sampling). `scripts/run_all.sh` runs replicate -> export_web.
- Validation: 30 of 33 published numbers within 10%. Outside: F2+ busiest box Period II (162 vs 185), central-TN tornado-day change (14 vs 29, F2+ 15 vs 25; same box is still the domain's largest increase). Field significance verdict matches (F1+ N 30% vs 27.5%).
- Paper's "southern Mississippi" = box 30-32.5N, 92.5-90W (SON 74 -> 122 vs paper 74 -> 124).
- After 2013: east box 13.3/yr vs west 7.5 (to 2024); 12.7 vs 6.5 (to 2023). Shift holds, not grown.

## Next
1. Get the SPC file through 2024/2025 (spc.noaa.gov/wcm, download manually; it blocks bots). NCEI Storm Events is only a cross-check (it splits tornadoes by county).
2. Re-run with newer years; show results with and without 2024 (record year).
3. Add field significance + bootstrap, EF2+ and seasonal runs.
4. Export small precomputed JSON for the web tool.
5. Next.js page with period slider, F1+/F2+/days toggle, season filter, ring around West Lafayette (40.43N, -86.91W).
6. Repo with README, data dictionary, DOI (FAIR). 2-page report PDF.

## Style
Professional, plain Times-style PDFs, no decoration. Refer to "Professor Ernest Agee".
