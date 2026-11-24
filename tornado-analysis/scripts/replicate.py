"""
replicate.py -- (1) our own analysis from the raw SPC file, (2) validation
against every number Agee et al. (2016) publish, (3) the identical method
applied after 2013 (Period III), with and without the record year 2024.

Usage: python3 -I replicate.py --csv SPC.csv --out DIR
Writes DIR/replication.json and prints a validation table.
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # our own core module
import numpy as np
from tornado_core import (load, box_records, annual, period_idx, field_significance,
                          bootstrap_diff, box_name, SEASONS)

ap = argparse.ArgumentParser()
ap.add_argument('--csv', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--last', type=int, default=2024)
A = ap.parse_args()

df = load(A.csv, 1954, A.last)
B = box_records(df)
YEARS = list(range(1954, A.last + 1))
I, II = period_idx(YEARS, 1954, 1983), period_idx(YEARS, 1984, 2013)
III = period_idx(YEARS, 2014, A.last); III_ex = period_idx(YEARS, 2014, A.last, exclude=(2024,))

def grids(thr, days=False, season=None):
    return annual(B, YEARS, thr, days, season)

def tot(G, idx): return G[idx].sum(0)
def at(g, b): return int(round(g[b]))
def argmax(g): return tuple(int(v) for v in np.unravel_index(np.argmax(g), g.shape))
def argmin(g): return tuple(int(v) for v in np.unravel_index(np.argmin(g), g.shape))

# Named places in the paper -> our boxes (city inside the box in brackets)
CENTRAL_TN = (2, 7)   # 35-37.5N, 87.5-85W  [Nashville]
N_ALABAMA = (1, 7)    # 32.5-35N, 87.5-85W  [Huntsville]
W_TN = (2, 6)         # 35-37.5N, 90-87.5W  [Jackson TN]
S_MISS = (0, 5)       # 30-32.5N, 92.5-90W  [S Mississippi; same box the paper calls "southern Mississippi" for days]

# ------------------------------------------------------------- validation rows
V = []
def row(group, what, paper, ours, box, place):
    V.append(dict(group=group, what=what, paper=paper, ours=ours, box=box_name(box), place=place,
                  diff_pct=round(100 * (ours - paper) / paper, 1) if paper else None))

for thr, days, label in [(1, False, 'F1+ tornadoes'), (2, False, 'F2+ tornadoes'), (1, True, 'F1+ tornado days'), (2, True, 'F2+ tornado days'), (3, True, 'F3+ tornado days')]:
    G = grids(thr, days); gI, gII = tot(G, I), tot(G, II); d = gII - gI
    if thr == 1 and not days:
        b = argmax(gI); row(label, 'Busiest box, Period I', 477, at(gI, b), b, 'SE Oklahoma / NE Texas')
        row(label, 'Same box, Period II', 260, at(gII, b), b, 'SE Oklahoma / NE Texas')
        b = argmax(gII); row(label, 'Busiest box, Period II', 477, at(gII, b), b, 'northern Alabama')
        row(label, 'Same box, Period I', 323, at(gI, b), b, 'northern Alabama')
    if thr == 2 and not days:
        b = argmax(gI); row(label, 'Busiest box, Period I', 271, at(gI, b), b, 'eastern Oklahoma')
        row(label, 'Same box, Period II', 123, at(gII, b), b, 'eastern Oklahoma')
        b = argmax(gII); row(label, 'Busiest box, Period II', 185, at(gII, b), b, 'northern Alabama')
        b = argmin(d); row(label, 'Largest decrease (II - I)', -159, at(d, b), b, 'SE Oklahoma / NE Texas')
        row(label, 'Central Tennessee, Period I', 84, at(gI, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')
        row(label, 'Central Tennessee, Period II', 166, at(gII, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')
    if thr == 1 and days:
        b = argmax(gI); row(label, 'Most tornado days, Period I', 246, at(gI, b), b, 'S-central Oklahoma / N-central Texas')
        b = argmax(gII); row(label, 'Most tornado days, Period II', 208, at(gII, b), b, 'southern Mississippi')
        row(label, 'Central Tennessee change', 29, at(d, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')
    if thr == 2 and days:
        b = argmax(gI); row(label, 'Most days, Period I', 151, at(gI, b), b, 'traditional Tornado Alley')
        row(label, 'Central Tennessee change', 25, at(d, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')
    if thr == 3 and days:
        row(label, 'Central Tennessee, Period I', 14, at(gI, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')
        row(label, 'Central Tennessee, Period II', 28, at(gII, CENTRAL_TN), CENTRAL_TN, 'central Tennessee')

for season, thr, items in [
    ('MAM', 1, [('Largest increase', 105, 'inc', 'central Tennessee'), ('Largest decrease', -172, 'dec', 'N-central Texas / SW Oklahoma')]),
    ('MAM', 2, [('Largest decrease', -105, 'dec', 'traditional Tornado Alley'), ('Central Tennessee, Period I', 65, ('I', CENTRAL_TN), 'central Tennessee'), ('Central Tennessee, Period II', 101, ('II', CENTRAL_TN), 'central Tennessee')]),
    ('JJA', 1, [('Largest decrease', -81, 'dec', 'central Oklahoma (101 -> 20)'), ('Largest increase', 48, 'inc', 'eastern Colorado')]),
    ('JJA', 2, [('Largest decrease', -44, 'dec', 'east-central Oklahoma')]),
    ('SON', 1, [('Western Tennessee, Period I', 18, ('I', W_TN), 'western Tennessee'), ('Western Tennessee, Period II', 81, ('II', W_TN), 'western Tennessee'),
                ('Southern Mississippi, Period I', 74, ('I', S_MISS), 'southern Mississippi'), ('Southern Mississippi, Period II', 124, ('II', S_MISS), 'southern Mississippi')]),
]:
    G = grids(thr, False, season); gI, gII = tot(G, I), tot(G, II); d = gII - gI
    for what, paper, how, place in items:
        if how == 'inc': b = argmax(d); v = at(d, b)
        elif how == 'dec': b = argmin(d); v = at(d, b)
        else: p, b = how; v = at(gI if p == 'I' else gII, b)
        row(f'{season} F{thr}+ tornadoes', what, paper, v, b, place)

# state totals (paper Sec. 1, by state of touchdown)
for st, (p1, p2), name in [('OK', (1096, 713), 'Oklahoma'), ('TN', (275, 457), 'Tennessee')]:
    for p, paper, idx in [('I', p1, (1954, 1983)), ('II', p2, (1984, 2013))]:
        ours = int(((df.st == st) & df.yr.between(*idx)).sum())
        V.append(dict(group='State totals', what=f'{name} F1+ tornadoes, Period {p}', paper=paper, ours=ours, box='state', place=name,
                      diff_pct=round(100 * (ours - paper) / paper, 1)))

# field significance, exactly as in the paper (Period II vs I, counts)
FS = {}
for thr in (1, 2):
    FS[f'f{thr}_II_vs_I'] = field_significance(grids(thr), I, II)
V.append(dict(group='Field significance', what='F1+ share of boxes significant (%)', paper=27.5, ours=FS['f1_II_vs_I']['N_pct'], box='all 80 boxes', place='', diff_pct=None))
V.append(dict(group='Field significance', what='F1+ threshold (%)', paper=8.75, ours=FS['f1_II_vs_I']['threshold_pct'], box='all 80 boxes', place='', diff_pct=None))
V.append(dict(group='Field significance', what='F2+ share of boxes significant (%)', paper=37.5, ours=FS['f2_II_vs_I']['N_pct'], box='all 80 boxes', place='', diff_pct=None))
V.append(dict(group='Field significance', what='F2+ threshold (%)', paper=8.75, ours=FS['f2_II_vs_I']['threshold_pct'], box='all 80 boxes', place='', diff_pct=None))

# ------------------------------------------------------------- extension: same method after 2013
G1 = grids(1); G2 = grids(2)
d = tot(G1, II) - tot(G1, I); GE, GW = argmax(d), argmin(d)   # our own east / west boxes
def ew(G, idx):
    e, w = G[idx][:, GE[0], GE[1]], G[idx][:, GW[0], GW[1]]
    return dict(n=int(len(idx)), east=round(float(e.mean()), 2), west=round(float(w.mean()), 2), **bootstrap_diff(e, w))
EXT = {}
for key, P3 in [('thru2024', III), ('thru2023', III_ex)]:
    EXT[key] = dict(
        years=[2014, 2024 if key == 'thru2024' else 2023], n_years=int(len(P3)),
        east_west={p: ew(G1, idx) for p, idx in [('I', I), ('II', II), ('III', P3)]},
        busiest_III=dict(box=box_name(argmax(G1[P3].mean(0))), per_year=round(float(G1[P3].mean(0).max()), 2)),
        field_sig_III_vs_II={f'f{t}': {k: v for k, v in field_significance(G, II, P3).items() if k != 'local'} for t, G in ((1, G1), (2, G2))},
        field_sig_III_vs_I={f'f{t}': {k: v for k, v in field_significance(G, I, P3).items() if k != 'local'} for t, G in ((1, G1), (2, G2))},
    )

out = dict(source='SPC 1950-2024 actual tornadoes', method='tornado_core.py (independent, exact path-box intersection)',
           n_tornadoes_f1=int(len(df)), GE=dict(idx=list(GE), box=box_name(GE)), GW=dict(idx=list(GW), box=box_name(GW)),
           validation=V, field_sig=FS, extension=EXT)
os.makedirs(A.out, exist_ok=True)
json.dump(out, open(os.path.join(A.out, 'replication.json'), 'w'), indent=1)

# ------------------------------------------------------------- console report
print(f"(E)F1+ tornadoes 1954-{A.last}: {len(df)}   GE {box_name(GE)}   GW {box_name(GW)}\n")
print(f"{'group':22s} {'quantity':34s} {'paper':>7s} {'ours':>7s} {'diff':>7s}  box")
for v in V:
    dp = f"{v['diff_pct']:+.0f}%" if v['diff_pct'] is not None else ''
    print(f"{v['group']:22s} {v['what']:34s} {v['paper']:>7} {v['ours']:>7} {dp:>7s}  {v['box']}  ({v['place']})")
print()
for k, e in EXT.items():
    print(k, 'n_years', e['n_years'])
    for p, r in e['east_west'].items(): print(f"   {p:3s} east {r['east']:6.2f} west {r['west']:6.2f}  E-W {r['diff']:+.2f} 99% {r['ci99']}")
    for t, r in e['field_sig_III_vs_II'].items(): print(f"   III vs II {t}: N {r['N_pct']}% thr {r['threshold_pct']}%")
    for t, r in e['field_sig_III_vs_I'].items(): print(f"   III vs I  {t}: N {r['N_pct']}% thr {r['threshold_pct']}%")
