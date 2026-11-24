"""
export_web.py -- build the single precomputed JSON read by the Next.js tool
"Alley Tracker: Boilermaker Edition" (src/features/alley-tracker/data/alley-tracker.json).

Everything the page needs is aggregated here so the browser never sees raw tornado records:

boxes   annual per-box values, Agee et al. (2016) grid (30-50N, 105-80W, 2.5 deg, 8 x 10),
        for {F1+, F2+} x {tornado counts, tornado days} x {DJF, MAM, JJA, SON}.
        Every series is year-major, row-major: value[(yearIndex * 8 + iy) * 10 + ix].
        Season totals add up to the annual total (a calendar date is in exactly one season),
        so "all seasons" = sum of the four.  Counting rule identical to analyze2.py.
ring    distance from West Lafayette (40.43N, 86.91W): for every tornado the closest point
        of its straight-line path (100 samples, haversine); for every tornado day the
        closest tornado of that day.  Histogrammed in 25-km bins out to 500 km per year,
        season and rating, so the page gets counts within any radius r by a cumulative sum.
outline US state borders (us-atlas 3.0.1, ISC; from US Census cartographic boundaries),
        clipped to the map frame and simplified (Douglas-Peucker, 0.02 deg).
validation / extension  copied from replicate.py (paper check + Period III).

Usage: python3 -I export_web.py --csv SPC.csv --topo states-10m.json --replication replication.json --json DEST
"""
import argparse, json, math, os, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # our own core module
import numpy as np, pandas as pd
from tornado_core import boxes_on_path

ap = argparse.ArgumentParser()
ap.add_argument('--csv', required=True); ap.add_argument('--topo', required=True)
ap.add_argument('--replication', required=True, help='replication.json from replicate.py')
ap.add_argument('--json', required=True); ap.add_argument('--end-year', type=int, default=2024)
A = ap.parse_args()

LAT0, LON0, D, NY, NX = 30.0, -105.0, 2.5, 8, 10
WL = (40.43, -86.91); BIN_KM, NBIN = 25, 20
SEASONS = ['DJF', 'MAM', 'JJA', 'SON']
MON2SEA = {12: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3}
YEARS = list(range(1954, A.end_year + 1)); NYR = len(YEARS)

df = pd.read_csv(A.csv)
if 'sg' in df.columns: df = df[df.sg != 2]          # SPC raw file: drop per-state segments
df['mag'] = pd.to_numeric(df['mag'], errors='coerce')
df = df[(df.yr >= 1954) & (df.yr <= A.end_year) & (df.mag >= 1)].copy()
df['si'] = df.mo.map(MON2SEA); df['yi'] = df.yr - 1954

def path(r):
    if r.elat != 0 and r.elon != 0:
        return np.linspace(r.slat, r.elat, 100), np.linspace(r.slon, r.elon, 100)
    return np.array([r.slat]), np.array([r.slon])

def hav_km(la, lo):
    p1, p2 = math.radians(WL[0]), np.radians(la)
    dphi = p2 - p1; dl = np.radians(lo - WL[1])
    a = np.sin(dphi / 2) ** 2 + math.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * 6371.0 * np.arcsin(np.sqrt(a))

box = np.zeros((2, 2, 4, NYR, NY, NX), dtype=np.int32)   # thr, kind(0 count,1 day), season, year, iy, ix
ring_c = np.zeros((2, 4, NYR, NBIN), dtype=np.int32)
seen_day_box = [set(), set()]; day_min = [{}, {}]
for r in df.itertuples():
    la, lo = path(r)
    cells = boxes_on_path(r.slat, r.slon, r.elat, r.elon)   # exact, same as replicate.py
    dmin = float(hav_km(la, lo).min())
    for t in (0, 1):
        if r.mag < t + 1: continue
        for (a, b) in cells:
            box[t, 0, r.si, r.yi, a, b] += 1
            k = (r.date, a, b)
            if k not in seen_day_box[t]:
                seen_day_box[t].add(k); box[t, 1, r.si, r.yi, a, b] += 1
        if dmin < BIN_KM * NBIN: ring_c[t, r.si, r.yi, int(dmin // BIN_KM)] += 1
        key = r.date; prev = day_min[t].get(key)
        if prev is None or dmin < prev[0]: day_min[t][key] = (dmin, r.si, r.yi)
ring_d = np.zeros_like(ring_c)
for t in (0, 1):
    for dmin, si, yi in day_min[t].values():
        if dmin < BIN_KM * NBIN: ring_d[t, si, yi, int(dmin // BIN_KM)] += 1

# sanity: reproduce analyze2's busiest Period-I F1+ box (479) from the exported arrays
p1 = box[0, 0, :, 0:30].sum(axis=(0, 1)); assert int(p1.max()) >= 470, p1.max()

# ------------------------------------------------------------- state outlines
topo = json.load(open(A.topo)); sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
def decode(arc):
    x = y = 0; out = []
    for dx, dy in arc:
        x += dx; y += dy; out.append((x * sx + tx, y * sy + ty))
    return out
def dp(pts, eps):
    if len(pts) < 3: return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]; dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy) or 1e-12
    dists = [abs(dy * (px - x0) - dx * (py - y0)) / L for px, py in pts[1:-1]]
    i = int(np.argmax(dists)) + 1
    if dists[i - 1] > eps: return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [pts[0], pts[-1]]
W, E, S, N = -107.0, -78.0, 28.5, 51.5
lines = []
for arc in topo['arcs']:
    cur = []
    for (x, y) in decode(arc):
        if W <= x <= E and S <= y <= N: cur.append((x, y))
        else:
            if len(cur) > 1: lines.append(cur)
            cur = []
    if len(cur) > 1: lines.append(cur)
outline = []
for l in lines:
    s = dp(l, 0.02)
    if len(s) > 1: outline.append([round(v, 2) for p in s for v in p])

# ------------------------------------------------------------- validation + extension (replicate.py)
rep = json.load(open(A.replication))

def flat(a): return a.reshape(-1).astype(int).tolist()
out = dict(
    meta=dict(title='Alley Tracker: Boilermaker Edition', generated=datetime.date.today().isoformat(),
              source='NOAA/NWS Storm Prediction Center, Severe Weather Database, 1950-2024_actual_tornadoes.csv',
              sourceUrl='https://www.spc.noaa.gov/wcm/', years=[YEARS[0], YEARS[-1]],
              grid=dict(lat0=LAT0, lon0=LON0, d=D, ny=NY, nx=NX), center=dict(lat=WL[0], lon=WL[1], name='West Lafayette, IN'),
              ringBinKm=BIN_KM, ringBins=NBIN, seasons=SEASONS,
              GE=rep['GE']['idx'], GW=rep['GW']['idx'],
              tornadoesUsed={'f1': int((df.mag >= 1).sum()), 'f2': int((df.mag >= 2).sum())}),
    boxes={f'{t}{k}': {s: flat(box[ti, ki, si]) for si, s in enumerate(SEASONS)}
           for ti, t in enumerate(['f1', 'f2']) for ki, k in enumerate(['c', 'd'])},
    ring={f'{t}{k}': {s: flat(arr[ti, si]) for si, s in enumerate(SEASONS)}
          for ti, t in enumerate(['f1', 'f2']) for k, arr in (('c', ring_c), ('d', ring_d))},
    outline=outline,
    validation=rep['validation'], fieldSig=rep['field_sig'], extension=rep['extension'])
os.makedirs(os.path.dirname(A.json), exist_ok=True)
json.dump(out, open(A.json, 'w'), separators=(',', ':'))
print('wrote', A.json, os.path.getsize(A.json), 'bytes;', len(outline), 'outline lines;',
      'F1+ P-I max box', int(p1.max()))
