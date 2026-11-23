import json, numpy as np, argparse, os
ap=argparse.ArgumentParser(); ap.add_argument('--out',required=True); A=ap.parse_args(); FIG=os.path.join(A.out,'fig'); os.makedirs(FIG,exist_ok=True)
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle
plt.rcParams.update({'font.family':'serif','font.serif':['Liberation Serif','Times New Roman','DejaVu Serif'],'font.size':9,'axes.linewidth':0.6})
R=json.load(open(os.path.join(A.out,'results2.json')))
END=R.get('meta',{}).get('end_year',2022); P3L='2014–%02d'%(END%100)
INK='#222222'; GRID='#BBBBBB'
def box(ax,x,y,w,h,fc='#F2F2F2'):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.01,rounding_size=0.015',fc=fc,ec=INK,lw=0.8))
def arrow(ax,p,q): ax.add_patch(FancyArrowPatch(p,q,arrowstyle='-|>',mutation_scale=9,lw=0.9,color=INK))
# F1 pipeline
fig,ax=plt.subplots(figsize=(7,2.3)); ax.set_xlim(-0.02,1.02); ax.set_ylim(0,1); ax.axis('off')
steps=[('1  Download','NOAA SPC\ntornado records\n(one CSV)'),('2  Select','(E)F1 and up\n30–50°N,\n80–105°W'),('3  Grid','2.5° boxes; count\ntornadoes and\ntornado days'),
       ('4  Compare','Period I, II, III;\ndifference maps;\nbox maxima'),('5  Test','Field significance\nand bootstrap\n(planned)'),('6  Show','Interactive map\nand 2-page\nreport')]
w,h=0.13,0.5; gap=(1-6*w)/5
for i,(a,b) in enumerate(steps):
    x=i*(w+gap); box(ax,x,0.28,w,h)
    ax.text(x+w/2,0.73,a,ha='center',va='center',fontsize=7.8,fontweight='bold',color=INK)
    ax.text(x+w/2,0.5,b,ha='center',va='center',fontsize=7.0,color=INK,linespacing=1.3)
    if i<5: arrow(ax,(x+w+0.004,0.53),(x+w+gap-0.004,0.53))
ax.text(0.5,0.1,'First, reproduce the published numbers as a check; then add the years after 2013',ha='center',fontsize=8,style='italic',color=INK)
fig.savefig(os.path.join(FIG,'g1_pipeline.png'),dpi=220,bbox_inches='tight'); plt.close(fig)
# F2 maps (counts)
lon=np.arange(-105,-79.9,2.5); lat=np.arange(30,50.1,2.5)
fig,axs=plt.subplots(2,3,figsize=(7,4.4),sharex=True,sharey=True)
for r,(key,rname) in enumerate([('f1_counts','(E)F1 and stronger'),('f2_counts','(E)F2 and stronger')]):
    M=R[key]; I=np.array(M['I']); II=np.array(M['II']); d=II-I
    vm=max(I.max(),II.max()); dm=np.abs(d).max()
    for c,(mat,ttl) in enumerate([(I,'Period I: 1954–1983'),(II,'Period II: 1984–2013'),(d,'Period II minus Period I')]):
        ax=axs[r,c]
        if c<2: m=ax.pcolormesh(lon,lat,mat,cmap='Greys',vmin=0,vmax=vm,edgecolors='white',linewidth=0.4)
        else: m=ax.pcolormesh(lon,lat,mat,cmap='PuOr',vmin=-dm,vmax=dm,edgecolors='white',linewidth=0.4)
        ax.plot(-86.91,40.43,marker='*',ms=7,color='#1F4E79',ls='none')
        ax.set_xlim(-105,-80); ax.set_ylim(30,50); ax.set_aspect(1.25); ax.tick_params(labelsize=6.5,length=2,width=0.5)
        if r==0: ax.set_title(ttl,fontsize=8.5)
        if c==0: ax.set_ylabel(rname,fontsize=8.2)
        if c<2:
            sm=R[key+'_summary']['max']['I' if c==0 else 'II']; iy,ix=sm[1]
            ax.add_patch(Rectangle((-105+2.5*ix,30+2.5*iy),2.5,2.5,fc='none',ec='#8B1A1A',lw=1.6))
        if c==2:
            cb=fig.colorbar(m,ax=ax,fraction=0.05,pad=0.03); cb.ax.tick_params(labelsize=6)
fig.text(0.5,0.012,'Counts of tornadoes per 2.5° box per 30-year period. Red outline = box with the most tornadoes. Blue star = Purdue (West Lafayette).',ha='center',fontsize=7.3,color=INK)
fig.tight_layout(rect=[0,0.03,1,1]); fig.savefig(os.path.join(FIG,'g2_maps.png'),dpi=220); plt.close(fig)
# F3 bars + series
fig,axs=plt.subplots(1,2,figsize=(7,2.7),gridspec_kw={'width_ratios':[1,1.3]})
ax=axs[0]; mm=R['means']; x=np.arange(3); wd=0.36
gw=[mm[p]['gw'] for p in ['I','II','III']]; ge=[mm[p]['ge'] for p in ['I','II','III']]
b1=ax.bar(x-wd/2,gw,wd,color='#777777',label='West box (greatest decrease)'); b2=ax.bar(x+wd/2,ge,wd,color='#8B1A1A',label='East box (greatest increase)')
for rect,v in list(zip(b1,gw))+list(zip(b2,ge)): ax.text(rect.get_x()+rect.get_width()/2,v+0.2,'%.1f'%v,ha='center',fontsize=7)
ax.set_xticks(x); ax.set_xticklabels(['I\n1954–83','II\n1984–2013','III\n'+P3L],fontsize=7.5)
ax.set_ylabel('Tornadoes per year (EF1+)',fontsize=8); ax.set_ylim(0,17); ax.legend(fontsize=6.6,frameon=False,loc='upper right'); ax.tick_params(labelsize=7); ax.set_title('Yearly average in the two boxes',fontsize=9)
ax=axs[1]; s=R['series']; yr=np.array(s['yr'])
ax.plot(yr,s['gw'],color='#777777',lw=0.9); ax.plot(yr,s['ge'],color='#8B1A1A',lw=0.9)
for p,(a,b) in {'I':(1954,1983),'II':(1984,2013),'III':(2014,END)}.items():
    ax.hlines(mm[p]['gw'],a,b,color='#444444',lw=2,ls='--'); ax.hlines(mm[p]['ge'],a,b,color='#5A0F0F',lw=2,ls='--')
ax.axvline(1983.5,color=GRID,lw=0.8); ax.axvline(2013.5,color=GRID,lw=0.8)
ax.set_xlabel('Year',fontsize=8.5); ax.set_ylabel('Tornadoes per year',fontsize=8); ax.set_title('Year by year (dashed = period average)',fontsize=9); ax.tick_params(labelsize=7)
fig.tight_layout(); fig.savefig(os.path.join(FIG,'g3_boxes.png'),dpi=220); plt.close(fig)
# F5 tool schematic
fig,ax=plt.subplots(figsize=(7,3.2)); ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis('off')
ax.add_patch(Rectangle((0.01,0.03),0.98,0.94,fc='white',ec=INK,lw=0.9))
ax.text(0.03,0.92,'Alley Tracker: Boilermaker Edition',fontsize=9,fontweight='bold',va='center')
ax.add_patch(Rectangle((0.03,0.08),0.6,0.76,fc='#F2F2F2',ec=INK,lw=0.7))
for i in range(8):
    ax.plot([0.03+0.6*i/8]*2,[0.08,0.84],color='white',lw=0.8)
for j in range(8): ax.plot([0.03,0.63],[0.08+0.76*j/8]*2,color='white',lw=0.8)
rng=np.random.default_rng(5)
for i in range(8):
    for j in range(8):
        v=0.1+0.8*np.exp(-((i-3)**2+(j-2.5)**2)/5)
        ax.add_patch(Rectangle((0.03+0.6*i/8,0.08+0.76*j/8),0.6/8,0.76/8,fc=plt.cm.Greys(v*0.8),ec='white',lw=0.8))
ax.add_patch(Circle((0.45,0.6),0.075,fc='none',ec='#1F4E79',lw=1,ls='--')); ax.plot(0.45,0.6,'*',ms=8,color='#1F4E79')
ax.text(0.33,0.04,'map of 2.5° boxes (illustrative)',ha='center',fontsize=7.2,style='italic')
panels=[(0.66,0.64,'Period','I  1954–83     II  1984–2013     III  '+P3L),(0.66,0.46,'Which tornadoes','(E)F1+    (E)F2+    tornado days'),(0.66,0.28,'Season','all    winter    spring    summer    autumn'),(0.66,0.1,'Distance from Purdue','ring: 100 – 500 km')]
for x,y,t,d in panels:
    ax.add_patch(Rectangle((x,y),0.32,0.15,fc='white',ec=INK,lw=0.7)); ax.text(x+0.012,y+0.108,t,fontsize=7.4,fontweight='bold',va='center'); ax.text(x+0.012,y+0.042,d,fontsize=6.6,va='center')
fig.savefig(os.path.join(FIG,'g5_tool.png'),dpi=220,bbox_inches='tight'); plt.close(fig)
print('ok')
