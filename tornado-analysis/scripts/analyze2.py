import pandas as pd, numpy as np, json, argparse, os
ap=argparse.ArgumentParser(description='Agee et al. (2016) grid-box counts, Periods I/II/III')
ap.add_argument('--csv',required=True); ap.add_argument('--out',required=True)
ap.add_argument('--end-year',type=int,default=2022); ap.add_argument('--exclude-years',type=int,nargs='*',default=[])
A=ap.parse_args(); END=A.end_year; NP3=END-2013-len([y for y in A.exclude_years if 2014<=y<=END])
from scipy.stats import theilslopes, kendalltau
df=pd.read_csv(A.csv)
df['mag']=pd.to_numeric(df['mag'],errors='coerce')
df=df[(df.yr>=1954)&(df.yr<=END)&(~df.yr.isin(A.exclude_years))].copy()
LAT0,LON0,D=30.0,-105.0,2.5; NY,NX=8,10
def per(y): return 'I' if y<=1983 else ('II' if y<=2013 else 'III')
df['per']=df.yr.map(per)
def touched(r):
    if r.elat!=0 and r.elon!=0:
        la=np.linspace(r.slat,r.elat,100); lo=np.linspace(r.slon,r.elon,100)
    else:
        la=np.array([r.slat]); lo=np.array([r.slon])
    iy=np.floor((la-LAT0)/D).astype(int); ix=np.floor((lo-LON0)/D).astype(int)
    return {(a,b) for a,b in zip(iy,ix) if 0<=a<NY and 0<=b<NX}
rows=[]
for r in df[df.mag>=1].itertuples():
    for (a,b) in touched(r): rows.append((r.yr,r.per,r.date,int(r.mag),a,b))
T=pd.DataFrame(rows,columns=['yr','per','date','mag','iy','ix'])
print("tornado-box records",len(T))
out={}
yrs={'I':30,'II':30,'III':NP3}
for lab,thr in [('f1',1),('f2',2)]:
    S=T[T.mag>=thr]
    for kind in ['counts','days']:
        M={}
        for p in ['I','II','III']:
            s=S[S.per==p]
            if kind=='days': s=s.drop_duplicates(['date','iy','ix'])
            g=np.zeros((NY,NX))
            for (a,b),n in s.groupby(['iy','ix']).size().items(): g[a,b]=n
            M[p]=g
        out[f'{lab}_{kind}']={p:M[p].tolist() for p in M}
        d=M['II']-M['I']
        iw=np.unravel_index(np.argmin(d),d.shape); ie=np.unravel_index(np.argmax(d),d.shape)
        mx={p:(int(M[p].max()),tuple(int(v) for v in np.unravel_index(np.argmax(M[p]),M[p].shape))) for p in M}
        def desc(ix_): return (LAT0+D*ix_[0],LAT0+D*(ix_[0]+1),LON0+D*ix_[1],LON0+D*(ix_[1]+1))
        out[f'{lab}_{kind}_summary']=dict(max=mx,gw=dict(idx=[int(v) for v in iw],change=int(d[iw]),bounds=desc(iw),P1=int(M['I'][iw]),P2=int(M['II'][iw]),annual_P3=round(float(M['III'][iw])/NP3,2)),
            ge=dict(idx=[int(v) for v in ie],change=int(d[ie]),bounds=desc(ie),P1=int(M['I'][ie]),P2=int(M['II'][ie]),annual_P3=round(float(M['III'][ie])/NP3,2)))
        print(lab,kind,out[f'{lab}_{kind}_summary'])
# annual series GE-GW (F1+ counts) with trend
S=T[T.mag>=1]; sm=out['f1_counts_summary']; gw=tuple(sm['gw']['idx']); ge=tuple(sm['ge']['idx'])
ann=S.groupby(['yr','iy','ix']).size()
ys=[y for y in range(1954,END+1) if y not in A.exclude_years]; w=[int(ann.get((y,)+gw,0)) for y in ys]; e=[int(ann.get((y,)+ge,0)) for y in ys]
d=np.array(e)-np.array(w)
ts=theilslopes(d,ys); kt=kendalltau(ys,d)
out['series']=dict(yr=ys,gw=w,ge=e)
out['trend_diff']=dict(slope_per_decade=round(ts[0]*10,2),lo=round(ts[2]*10,2),hi=round(ts[3]*10,2),p=round(float(kt[1]),4))
means={}
for p,(a,b) in {'I':(1954,1983),'II':(1984,2013),'III':(2014,END)}.items():
    sel=[i for i,y in enumerate(ys) if a<=y<=b]
    means[p]=dict(gw=round(float(np.mean([w[i] for i in sel])),2),ge=round(float(np.mean([e[i] for i in sel])),2))
out['means']=means; print(means,out['trend_diff'])
# state check
f1=df[(df.mag>=1)]
out['state']={st:{p:int(((f1.st==st)&(f1.per==p)).sum()) for p in ['I','II']} for st in ['OK','TN']}
print(out['state'])
out['meta']=dict(end_year=END,exclude_years=A.exclude_years,n_years_III=NP3)
os.makedirs(A.out,exist_ok=True); json.dump(out,open(os.path.join(A.out,'results2.json'),'w'))
