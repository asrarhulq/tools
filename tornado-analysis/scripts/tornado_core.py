"""
tornado_core.py -- independent implementation of the Agee et al. (2016) method.

Written from the paper's text (Sec. 2-3), not from the handoff scripts, so the
replication is an independent check:

  data    SPC "actual tornadoes" file (whole tracks), 1954 onward, (E)F1+ only
          (EF-U, coded -9, dropped).
  grid    30-50N, 105-80W, 2.5 deg boxes (8 x 10), as in the paper.
  count   a tornado counts once in every box its straight-line path (start to
          end) starts in, ends in, or crosses.  Crossing is computed EXACTLY:
          the segment is cut at every grid line it crosses and each piece is
          assigned to its box (no point sampling).  Paths without an end point
          count in the start box only.
  days    a tornado day = a calendar date with >= 1 qualifying tornado in the box.
  seasons DJF / MAM / JJA / SON by calendar month (December stays in its year).
  stats   field significance (Elmore et al. 2006 as used in the paper): moving-
          block bootstrap, block 5 yr, 10 000 resamples, alpha 0.05, threshold
          from a Livezey-Chen Monte Carlo; classical bootstrap of annual means
          (paper Fig. 12).
"""
import numpy as np, pandas as pd

LAT0, LON0, D, NY, NX = 30.0, -105.0, 2.5, 8, 10
SEASON_OF = {12: 'DJF', 1: 'DJF', 2: 'DJF', 3: 'MAM', 4: 'MAM', 5: 'MAM',
             6: 'JJA', 7: 'JJA', 8: 'JJA', 9: 'SON', 10: 'SON', 11: 'SON'}
SEASONS = ['DJF', 'MAM', 'JJA', 'SON']


def load(csv, first=1954, last=2024):
    df = pd.read_csv(csv)
    if 'sg' in df.columns:
        df = df[df.sg != 2]                      # keep whole tracks only
    df['mag'] = pd.to_numeric(df['mag'], errors='coerce')
    df = df[(df.yr >= first) & (df.yr <= last) & (df.mag >= 1)].copy()
    df['season'] = df.mo.map(SEASON_OF)
    return df.reset_index(drop=True)


def boxes_on_path(slat, slon, elat, elon):
    """Exact set of (iy, ix) boxes touched by the straight segment start->end."""
    x0, y0 = (slon - LON0) / D, (slat - LAT0) / D
    if elat == 0 or elon == 0:                   # no end point recorded
        pts = [(x0, y0)]
    else:
        x1, y1 = (elon - LON0) / D, (elat - LAT0) / D
        ts = {0.0, 1.0}
        for a0, a1 in ((x0, x1), (y0, y1)):      # parameters where a grid line is crossed
            if a1 != a0:
                lo, hi = sorted((a0, a1))
                for k in range(int(np.ceil(lo)), int(np.floor(hi)) + 1):
                    t = (k - a0) / (a1 - a0)
                    if 0 < t < 1: ts.add(t)
        ts = sorted(ts)
        # midpoint of each piece identifies its box; endpoints count too
        pts = [(x0, y0), (x1, y1)] + [(x0 + (x1 - x0) * (a + b) / 2, y0 + (y1 - y0) * (a + b) / 2)
                                      for a, b in zip(ts[:-1], ts[1:])]
    out = set()
    for x, y in pts:
        ix, iy = int(np.floor(x)), int(np.floor(y))
        if 0 <= iy < NY and 0 <= ix < NX: out.add((iy, ix))
    return out


def box_records(df):
    """One row per (tornado, box) pair."""
    rows = []
    for r in df.itertuples():
        for iy, ix in boxes_on_path(r.slat, r.slon, r.elat, r.elon):
            rows.append((r.yr, r.date, r.season, int(r.mag), iy, ix))
    return pd.DataFrame(rows, columns=['yr', 'date', 'season', 'mag', 'iy', 'ix'])


def annual(B, years, thr=1, days=False, season=None):
    """(n_years, NY, NX) annual counts (or tornado days)."""
    s = B[B.mag >= thr]
    if season: s = s[s.season == season]
    if days: s = s.drop_duplicates(['date', 'iy', 'ix'])
    yi = {y: i for i, y in enumerate(years)}
    g = np.zeros((len(years), NY, NX))
    for (y, a, b), n in s.groupby(['yr', 'iy', 'ix']).size().items():
        if y in yi: g[yi[y], a, b] = n
    return g


def period_idx(years, a, b, exclude=()):
    return np.array([i for i, y in enumerate(years) if a <= y <= b and y not in exclude])


def box_name(b):
    iy, ix = b
    return f"{LAT0 + D * iy:g}-{LAT0 + D * (iy + 1):g}N, {-(LON0 + D * ix):g}-{-(LON0 + D * (ix + 1)):g}W"


# ----------------------------------------------------------------- statistics
def _blocks(n, nb, block, rng):
    L = min(block, n); k = int(np.ceil(n / L))
    starts = rng.integers(0, n - L + 1, size=(nb, k))
    return (starts[:, :, None] + np.arange(L)[None, None, :]).reshape(nb, -1)[:, :n]


def field_significance(G, iA, iB, n_boot=10000, block=5, alpha=0.05, seed=1):
    rng = np.random.default_rng(seed)
    XA, XB = G[iA].reshape(len(iA), -1), G[iB].reshape(len(iB), -1)
    diffs = XB[_blocks(len(iB), n_boot, block, rng)].mean(1) - XA[_blocks(len(iA), n_boot, block, rng)].mean(1)
    lo, hi = np.percentile(diffs, [100 * alpha / 2, 100 * (1 - alpha / 2)], axis=0)
    local = (lo > 0) | (hi < 0)
    X = np.vstack([XA, XB]); n = len(X); sd = X.std(0); ok = sd > 0
    Z = (X[:, ok] - X[:, ok].mean(0)) / sd[ok]
    R = rng.standard_normal((n_boot, n)); R = (R - R.mean(1, keepdims=True)) / R.std(1, keepdims=True)
    from scipy import stats
    tc = stats.t.ppf(1 - alpha / 2, n - 2); rc = tc / np.sqrt(n - 2 + tc ** 2)
    frac = (np.abs(R @ Z / n) > rc).sum(1) / X.shape[1]
    thr = np.percentile(frac, 100 * (1 - alpha))
    return dict(N_pct=round(100 * local.mean(), 2), threshold_pct=round(100 * thr, 2),
                field_significant=bool(local.mean() > thr), n_sig=int(local.sum()),
                local=local.reshape(NY, NX).astype(int).tolist())


def bootstrap_diff(east, west, n_boot=10000, seed=2):
    """Paper Fig. 12: n east and n west years drawn independently; mean of differences."""
    rng = np.random.default_rng(seed); n = len(east)
    m = (east[rng.integers(0, n, (n_boot, n))] - west[rng.integers(0, n, (n_boot, n))]).mean(1)
    return dict(diff=round(float(east.mean() - west.mean()), 3),
                ci95=[round(float(v), 3) for v in np.percentile(m, [2.5, 97.5])],
                ci99=[round(float(v), 3) for v in np.percentile(m, [0.5, 99.5])])
