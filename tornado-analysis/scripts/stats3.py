"""
stats3.py -- statistics for the Agee et al. (2016) replication, run after analyze2.py.

Adds the three items listed as TO DO in CLAUDE.md:

1. Field significance (Agee et al. 2016, Sec. 3, following Elmore et al. 2006):
   - Local test, every 2.5 deg box: moving-block bootstrap (block size 5, 10,000
     resamples) of (mean annual count, later period) - (mean, earlier period).
     A box is locally significant when the two-sided 95% percentile interval
     excludes zero.  The same resampled years are used for every box in a given
     resample, so the spatial correlation between boxes is preserved.
   - N = fraction of the 80 boxes that are locally significant.
   - Threshold: Monte Carlo (10,000 trials).  For each trial a series of N(0,1)
     values, one per year, is correlated with every box's annual series; we count
     the fraction of boxes whose correlation is significant at alpha = 0.05.  The
     95th percentile of that fraction is the threshold (Livezey & Chen 1983 style,
     which is what Elmore et al. 2006 build on).  The paper's wording of this
     step is brief; this is our reading of it.  Field significant if N > threshold.
     Paper: F1+ N = 27.5 %, threshold 8.75 %; F2+ N = 37.5 %, threshold 8.75 %.
2. Bootstrap of annual means, east (GE) vs west (GW) box (paper Fig. 12): for a
   period of n years, draw n east years and n west years independently with
   replacement, take the mean of the n differences; repeat 10,000 times.
   Reported: 95 % and 99 % percentile intervals, plus each box's own mean and 95 % CI.
3. Seasonal analysis: DJF / MAM / JJA / SON grids for counts and tornado days,
   F1+ and F2+.  Seasons are assigned by calendar month within the calendar year
   (December 1983 is in Period I), which keeps the period boundaries identical
   to the annual analysis.

Usage:  python3 -I stats3.py --csv DATA.csv --out OUTDIR [--end-year 2022] [--exclude-years 2024]
"""
import argparse, json, os
import numpy as np, pandas as pd
from scipy import stats

ap = argparse.ArgumentParser()
ap.add_argument('--csv', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--end-year', type=int, default=2022)
ap.add_argument('--exclude-years', type=int, nargs='*', default=[])
ap.add_argument('--n-boot', type=int, default=10000); ap.add_argument('--block', type=int, default=5)
ap.add_argument('--alpha', type=float, default=0.05); ap.add_argument('--seed', type=int, default=20161681)
A = ap.parse_args()
rng = np.random.default_rng(A.seed)
END, EXCL, NB, BL, ALPHA = A.end_year, set(A.exclude_years), A.n_boot, A.block, A.alpha

LAT0, LON0, D = 30.0, -105.0, 2.5; NY, NX = 8, 10
PERIODS = {'I': (1954, 1983), 'II': (1984, 2013), 'III': (2014, END)}
SEASONS = {'DJF': (12, 1, 2), 'MAM': (3, 4, 5), 'JJA': (6, 7, 8), 'SON': (9, 10, 11)}
MON2SEA = {m: s for s, ms in SEASONS.items() for m in ms}

# ---------------------------------------------------------------- data -> box records
df = pd.read_csv(A.csv)
df['mag'] = pd.to_numeric(df['mag'], errors='coerce')
df = df[(df.yr >= 1954) & (df.yr <= END) & (~df.yr.isin(EXCL)) & (df.mag >= 1)].copy()

def touched(r):  # identical rule to analyze2.py
    if r.elat != 0 and r.elon != 0:
        la = np.linspace(r.slat, r.elat, 100); lo = np.linspace(r.slon, r.elon, 100)
    else:
        la = np.array([r.slat]); lo = np.array([r.slon])
    iy = np.floor((la - LAT0) / D).astype(int); ix = np.floor((lo - LON0) / D).astype(int)
    return {(a, b) for a, b in zip(iy, ix) if 0 <= a < NY and 0 <= b < NX}

rows = [(r.yr, r.mo, r.date, int(r.mag), a, b) for r in df.itertuples() for (a, b) in touched(r)]
T = pd.DataFrame(rows, columns=['yr', 'mo', 'date', 'mag', 'iy', 'ix'])
T['sea'] = T.mo.map(MON2SEA)
YEARS = np.array([y for y in range(1954, END + 1) if y not in EXCL])
YI = {y: i for i, y in enumerate(YEARS)}

def annual(thr, kind, season=None):
    """(n_years, NY, NX) array of annual counts or tornado days."""
    s = T[T.mag >= thr]
    if season: s = s[s.sea == season]
    if kind == 'days': s = s.drop_duplicates(['date', 'iy', 'ix'])
    g = np.zeros((len(YEARS), NY, NX))
    for (y, a, b), n in s.groupby(['yr', 'iy', 'ix']).size().items(): g[YI[y], a, b] = n
    return g

def pidx(p):
    a, b = PERIODS[p]; return np.where((YEARS >= a) & (YEARS <= b))[0]

def bounds(i):
    return [float(LAT0 + D * i[0]), float(LAT0 + D * (i[0] + 1)), float(LON0 + D * i[1]), float(LON0 + D * (i[1] + 1))]

# ---------------------------------------------------------------- 1. field significance
def block_resample_idx(n, nb):
    """Moving-block bootstrap indices: (nb, n), blocks of length BL, truncated to n."""
    k = int(np.ceil(n / BL)); starts = rng.integers(0, n - BL + 1, size=(nb, k)) if n >= BL \
        else np.zeros((nb, k), int)
    idx = (starts[:, :, None] + np.arange(min(BL, n))[None, None, :]).reshape(nb, -1)[:, :n]
    return idx

def field_sig(G, p0, p1):
    i0, i1 = pidx(p0), pidx(p1)
    X0, X1 = G[i0].reshape(len(i0), -1), G[i1].reshape(len(i1), -1)       # (n, 80)
    obs = X1.mean(0) - X0.mean(0)
    b0, b1 = block_resample_idx(len(i0), NB), block_resample_idx(len(i1), NB)
    diffs = X1[b1].mean(1) - X0[b0].mean(1)                                 # (NB, 80)
    lo, hi = np.percentile(diffs, [100 * ALPHA / 2, 100 * (1 - ALPHA / 2)], axis=0)
    local = (lo > 0) | (hi < 0)
    N = local.mean()
    # Monte Carlo threshold: random N(0,1) series vs each box series over both periods
    Xb = np.vstack([X0, X1]); n = Xb.shape[0]
    sd = Xb.std(0); ok = sd > 0
    Zx = (Xb[:, ok] - Xb[:, ok].mean(0)) / sd[ok]
    R = rng.standard_normal((NB, n)); R = (R - R.mean(1, keepdims=True)) / R.std(1, keepdims=True)
    r = R @ Zx / n                                                          # (NB, n_ok)
    tcrit = stats.t.ppf(1 - ALPHA / 2, n - 2); rcrit = tcrit / np.sqrt(n - 2 + tcrit ** 2)
    frac = (np.abs(r) > rcrit).sum(1) / Xb.shape[1]                         # over all 80 boxes
    thr = float(np.percentile(frac, 100 * (1 - ALPHA)))
    return dict(compare=f'{p1} minus {p0}', N_pct=round(100 * N, 2), n_sig_boxes=int(local.sum()),
                threshold_pct=round(100 * thr, 2), field_significant=bool(N > thr),
                local_sig_grid=local.reshape(NY, NX).astype(int).tolist(),
                diff_grid=np.round(obs.reshape(NY, NX), 3).tolist())

# ---------------------------------------------------------------- 2. bootstrap east vs west
def ci(x, lev): return [round(float(v), 3) for v in np.percentile(x, [50 - lev / 2, 50 + lev / 2])]

def east_west(G):
    d = G[pidx('II')].sum(0) - G[pidx('I')].sum(0)
    gw = np.unravel_index(np.argmin(d), d.shape); ge = np.unravel_index(np.argmax(d), d.shape)
    out = dict(GE=dict(idx=[int(v) for v in ge], bounds=bounds(ge)),
               GW=dict(idx=[int(v) for v in gw], bounds=bounds(gw)), periods={})
    for p in PERIODS:
        ii = pidx(p); n = len(ii)
        if n == 0: continue
        e, w = G[ii][:, ge[0], ge[1]], G[ii][:, gw[0], gw[1]]
        be = e[rng.integers(0, n, (NB, n))]; bw = w[rng.integers(0, n, (NB, n))]
        md = (be - bw).mean(1)
        out['periods'][p] = dict(
            n_years=n, east_mean=round(float(e.mean()), 3), east_ci95=ci(be.mean(1), 95),
            west_mean=round(float(w.mean()), 3), west_ci95=ci(bw.mean(1), 95),
            diff_mean=round(float(e.mean() - w.mean()), 3), diff_ci95=ci(md, 95), diff_ci99=ci(md, 99),
            p_diff_le_0=round(float((md <= 0).mean()), 4), p_diff_ge_0=round(float((md >= 0).mean()), 4),
            pdf=np.histogram(md, bins=40)[0].tolist(), pdf_edges=np.round(np.histogram(md, bins=40)[1], 3).tolist())
    return out

# ---------------------------------------------------------------- 3. seasonal grids
def seasonal(thr, kind):
    res = {}
    for s in SEASONS:
        G = annual(thr, kind, s)
        tot = {p: G[pidx(p)].sum(0) for p in PERIODS if len(pidx(p))}
        per_yr = {p: tot[p] / len(pidx(p)) for p in tot}
        d = tot['II'] - tot['I']
        mx = {p: [int(tot[p].max()), [int(v) for v in np.unravel_index(np.argmax(tot[p]), tot[p].shape)]] for p in tot}
        res[s] = dict(totals={p: tot[p].astype(int).tolist() for p in tot},
                      per_year={p: np.round(per_yr[p], 3).tolist() for p in per_yr},
                      max=mx,
                      largest_increase_II_I=dict(idx=[int(v) for v in np.unravel_index(np.argmax(d), d.shape)], change=int(d.max())),
                      largest_decrease_II_I=dict(idx=[int(v) for v in np.unravel_index(np.argmin(d), d.shape)], change=int(d.min())))
    return res

out = dict(meta=dict(end_year=END, exclude_years=sorted(EXCL), n_boot=NB, block=BL, alpha=ALPHA, seed=A.seed,
                     years=[int(YEARS[0]), int(YEARS[-1])], n_years={p: int(len(pidx(p))) for p in PERIODS},
                     grid=dict(lat0=LAT0, lon0=LON0, d=D, ny=NY, nx=NX)),
           field_sig={}, east_west={}, seasonal={})
for lab, thr in [('f1', 1), ('f2', 2)]:
    for kind in ['counts', 'days']:
        key = f'{lab}_{kind}'; G = annual(thr, kind)
        out['field_sig'][key] = {'II_vs_I': field_sig(G, 'I', 'II')}
        if len(pidx('III')) >= 2: out['field_sig'][key]['III_vs_II'] = field_sig(G, 'II', 'III')
        out['east_west'][key] = east_west(G)
        out['seasonal'][key] = seasonal(thr, kind)

os.makedirs(A.out, exist_ok=True)
json.dump(out, open(os.path.join(A.out, 'stats3.json'), 'w'))

# ---------------------------------------------------------------- console summary
print(f"years {YEARS[0]}-{YEARS[-1]} excl={sorted(EXCL)}  n_years={out['meta']['n_years']}")
print('\nFIELD SIGNIFICANCE (N vs threshold, % of 80 boxes)   [paper II-I: f1 27.5/8.75, f2 37.5/8.75]')
for k, v in out['field_sig'].items():
    for c, r in v.items():
        print(f"  {k:10s} {c:9s} N={r['N_pct']:5.1f}%  thr={r['threshold_pct']:5.2f}%  field sig={r['field_significant']}")
print('\nEAST (GE) vs WEST (GW) annual means, bootstrap')
for k, v in out['east_west'].items():
    print(f"  {k}: GE {v['GE']['bounds']}  GW {v['GW']['bounds']}")
    for p, r in v['periods'].items():
        print(f"    {p:3s} n={r['n_years']:2d}  E={r['east_mean']:6.2f} {r['east_ci95']}  W={r['west_mean']:6.2f} {r['west_ci95']}"
              f"  E-W={r['diff_mean']:6.2f} 95%{r['diff_ci95']} 99%{r['diff_ci99']}")
print('\nSEASONAL max box per period (total, [iy,ix]) and largest II-I change')
for k, v in out['seasonal'].items():
    for s, r in v.items():
        print(f"  {k:10s} {s}  max {r['max']}  +{r['largest_increase_II_I']}  {r['largest_decrease_II_I']}")
