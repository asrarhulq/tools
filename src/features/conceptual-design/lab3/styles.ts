// All CSS for the guide, scoped under .l3-root so it cannot leak into the host site.
export const CSS = `
.l3-root{--bg:#07111F;--bg2:#0C1B2E;--panel:rgba(14,31,52,.78);--panel2:rgba(255,255,255,.04);--line:rgba(143,196,255,.22);--line2:rgba(143,196,255,.1);
--ink:#E8F3FF;--mute:#9DB8D6;--cyan:#5CE1E6;--green:#7BD88F;--amber:#FFC145;--orange:#FF8A4C;--pink:#FF6B9A;--violet:#B38CFF;--bad:#FF6B6B;--accent:#5CE1E6;
--mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:"IBM Plex Sans","Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
position:relative;min-height:100vh;color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;background-color:var(--bg);
background-image:linear-gradient(var(--line2) 1px,transparent 1px),linear-gradient(90deg,var(--line2) 1px,transparent 1px),radial-gradient(1200px 600px at 80% -10%,rgba(92,225,230,.12),transparent 60%),radial-gradient(900px 500px at -10% 30%,rgba(179,140,255,.1),transparent 60%);
background-size:32px 32px,32px 32px,auto,auto;-webkit-font-smoothing:antialiased}
.l3-root *,.l3-root *::before,.l3-root *::after{box-sizing:border-box}
.l3-root h1,.l3-root h2,.l3-root h3,.l3-root h4,.l3-root p,.l3-root ul,.l3-root ol{margin:0}
.l3-root button{font:inherit;color:inherit;cursor:pointer}
.l3-root input,.l3-root textarea,.l3-root select{font:inherit;color:var(--ink)}
.l3-root :focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.l3-root a{color:var(--cyan)}
.l3-boot{padding:60px 20px;text-align:center;color:#9DB8D6;font-family:ui-monospace,monospace;background:#07111F;min-height:60vh}

/* top bar */
.l3-top{position:sticky;top:0;z-index:30;backdrop-filter:blur(10px);background:rgba(7,17,31,.88);border-bottom:1px solid var(--line)}
.l3-topin{max-width:1180px;margin:0 auto;padding:10px 16px;display:flex;gap:14px;align-items:center}
.l3-brand{display:flex;gap:10px;align-items:center;cursor:pointer;background:none;border:0;padding:0;text-align:left;flex:none}
.l3-logo{width:34px;height:34px;border:1.5px solid var(--cyan);border-radius:6px;display:grid;place-items:center;font-family:var(--mono);font-weight:700;color:var(--cyan);font-size:14px;box-shadow:0 0 18px rgba(92,225,230,.25) inset}
.l3-brand b{display:block;font-size:14px;letter-spacing:.02em;line-height:1.15}.l3-brand small{display:block;color:var(--mute);font-size:11px;font-family:var(--mono)}
.l3-nav{display:flex;gap:6px;overflow-x:auto;flex:1;scrollbar-width:none;padding:2px}
.l3-nav::-webkit-scrollbar{display:none}
.l3-pill{flex:none;display:flex;align-items:center;gap:7px;padding:6px 11px;border:1px solid var(--line);border-radius:999px;background:var(--panel2);font-size:13px;white-space:nowrap;transition:.15s}
.l3-pill:hover{border-color:var(--cyan)}
.l3-pill.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent);box-shadow:0 0 0 1px var(--accent) inset}
.l3-pill i{font-style:normal;font-family:var(--mono);font-weight:700;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;border:1.5px solid var(--c,var(--cyan));color:var(--c,var(--cyan))}
.l3-pill.done i{background:var(--c,var(--cyan));color:#07111F}
.l3-topr{display:flex;gap:8px;align-items:center;flex:none}
.l3-save{font-family:var(--mono);font-size:11px;color:var(--mute)}
.l3-save.err{color:var(--bad)}
.l3-kbd{font-family:var(--mono);font-size:11px;border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--mute)}
.l3-main{max-width:1180px;margin:0 auto;padding:22px 16px 90px}
.l3-foot{max-width:1180px;margin:0 auto;padding:0 16px 40px;color:var(--mute);font-size:12px;font-family:var(--mono)}

/* primitives */
.l3-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.l3-col{display:flex;flex-direction:column;gap:10px}
.l3-grow{flex:1;min-width:0}.l3-end{margin-left:auto}
.l3-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.l3-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.l3-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.l3-gauto{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.l3-split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}
.l3-mute{color:var(--mute)}.l3-mono{font-family:var(--mono)}.l3-small{font-size:12.5px}.l3-b{font-weight:700}.l3-tc{text-align:center}
.l3-ok{color:var(--green)}.l3-warn{color:var(--amber)}.l3-bad{color:var(--bad)}
.l3-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
.l3-h1{font-size:clamp(28px,5vw,46px);line-height:1.05;letter-spacing:-.02em;font-weight:700}
.l3-h2{font-size:clamp(24px,3.4vw,34px);line-height:1.1;letter-spacing:-.015em;font-weight:700}
.l3-h3{font-size:17px;font-weight:650;line-height:1.25}.l3-h4{font-size:14px;font-weight:650}
.l3-lead{color:var(--mute);max-width:70ch;margin:6px 0 10px}
.l3-sub{color:var(--mute);font-size:13px;margin-top:2px}
.l3-panel{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:16px;box-shadow:0 12px 30px rgba(0,0,0,.18)}
.l3-panel::before,.l3-panel::after{content:"";position:absolute;width:10px;height:10px;border:1.5px solid var(--cyan);opacity:.6}
.l3-panel::before{left:-1px;top:-1px;border-right:0;border-bottom:0;border-radius:10px 0 0 0}.l3-panel::after{right:-1px;bottom:-1px;border-left:0;border-top:0;border-radius:0 0 10px 0}
.l3-ph{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
.l3-tb{position:absolute;right:12px;top:-9px;background:var(--bg);padding:0 8px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--mute)}
.l3-btn{display:inline-flex;gap:7px;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--panel2);border-radius:8px;padding:8px 14px;font-size:14px;transition:.15s;line-height:1.2}
.l3-btn:hover:not(:disabled){border-color:var(--cyan);background:rgba(92,225,230,.08)}
.l3-btn:disabled{opacity:.4;cursor:not-allowed}.l3-btn[aria-pressed="true"]{border-color:var(--cyan);background:rgba(92,225,230,.16)}
.l3-primary{background:var(--accent);color:#07111F;border-color:var(--accent);font-weight:650}
.l3-primary:hover:not(:disabled){background:var(--accent);filter:brightness(1.12);box-shadow:0 0 22px color-mix(in srgb,var(--accent) 45%,transparent)}
.l3-danger{border-color:var(--bad);color:var(--bad)}.l3-danger:hover:not(:disabled){background:rgba(255,107,107,.12);border-color:var(--bad)}
.l3-quiet{border-color:transparent;background:transparent;color:var(--mute)}
.l3-sm{padding:4px 9px;font-size:12.5px;border-radius:6px}
.l3-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px;color:var(--mute);font-family:var(--mono)}
.l3-t-accent{border-color:var(--accent);color:var(--accent)}.l3-t-good{border-color:var(--green);color:var(--green)}.l3-t-warn{border-color:var(--amber);color:var(--amber)}.l3-t-bad{border-color:var(--bad);color:var(--bad)}
.l3-slide{font-family:var(--mono);font-size:11.5px;color:var(--amber);border:1px dashed rgba(255,193,69,.5);border-radius:4px;padding:1px 7px;white-space:nowrap}
.l3-input,.l3-textarea,.l3-select{width:100%;background:rgba(3,10,20,.6);border:1px solid var(--line);border-radius:7px;padding:8px 10px;font-size:14px}
.l3-input:focus,.l3-textarea:focus,.l3-select:focus{border-color:var(--cyan);outline:none;box-shadow:0 0 0 3px rgba(92,225,230,.15)}
.l3-textarea{resize:vertical;min-height:70px}.l3-select{appearance:auto}
.l3-input.l3-s{padding:5px 8px;font-size:13px}.l3-num{width:90px;text-align:right;font-family:var(--mono)}
.l3-field{display:flex;flex-direction:column;gap:4px}.l3-field>label,.l3-lab{font-size:12px;color:var(--mute);font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase}
.l3-hint{font-size:12px;color:var(--mute)}
.l3-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line);margin:6px 0 18px;scrollbar-width:none}.l3-tabs::-webkit-scrollbar{display:none}
.l3-tab{flex:none;background:none;border:0;border-bottom:2px solid transparent;padding:10px 14px;color:var(--mute);font-size:14px;display:flex;gap:7px;align-items:center;margin-bottom:-1px}
.l3-tab:hover{color:var(--ink)}.l3-tab.on{color:var(--accent);border-bottom-color:var(--accent);font-weight:650}
.l3-badge{font-style:normal;font-family:var(--mono);font-size:10.5px;background:var(--accent);color:#07111F;border-radius:999px;padding:0 6px}
.l3-meter{margin:6px 0}.l3-ml{display:flex;justify-content:space-between;font-size:12.5px;color:var(--mute);margin-bottom:3px}.l3-ml b{color:var(--ink);font-family:var(--mono)}
.l3-mt{height:8px;border-radius:99px;background:rgba(143,196,255,.14);overflow:hidden}.l3-fill{display:block;height:100%;border-radius:99px;transition:width .4s cubic-bezier(.2,.8,.2,1)}
.l3-f-cyan{background:var(--cyan)}.l3-f-green{background:var(--green)}.l3-f-amber{background:var(--amber)}.l3-f-orange{background:var(--orange)}.l3-f-pink{background:var(--pink)}.l3-f-violet{background:var(--violet)}.l3-f-bad{background:var(--bad)}
.l3-ring{position:relative;display:inline-grid;place-items:center;flex:none}.l3-ring svg{position:absolute;inset:0}.l3-ring span{position:relative;font-family:var(--mono);font-size:12px;font-weight:700}
.l3-call{border:1px solid var(--line);border-left-width:4px;border-radius:8px;padding:10px 14px;margin:10px 0;background:var(--panel2);font-size:14px}
.l3-call p+p{margin-top:6px}.l3-ct{display:block;margin-bottom:3px}
.l3-c-info{border-left-color:var(--cyan)}.l3-c-warn{border-left-color:var(--amber);background:rgba(255,193,69,.07)}.l3-c-good{border-left-color:var(--green);background:rgba(123,216,143,.07)}.l3-c-bad{border-left-color:var(--bad);background:rgba(255,107,107,.08)}
.l3-stamp{display:inline-block;border:3px double var(--green);color:var(--green);padding:4px 14px;border-radius:6px;font-family:var(--mono);font-weight:800;letter-spacing:.14em;transform:rotate(-4deg);animation:l3stamp .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes l3stamp{from{transform:rotate(-14deg) scale(2.2);opacity:0}to{transform:rotate(-4deg) scale(1);opacity:1}}
.l3-empty{border:1px dashed var(--line);border-radius:8px;padding:22px;text-align:center;color:var(--mute);display:flex;flex-direction:column;gap:12px;align-items:center}
.l3-tip{display:flex;gap:10px;border:1px dashed var(--line);border-radius:8px;padding:10px 12px;margin:10px 0;color:var(--mute);font-size:13.5px}.l3-tip>span{color:var(--amber)}
.l3-code{font-family:var(--mono);background:rgba(0,0,0,.35);border:1px solid var(--line);border-radius:6px;padding:2px 7px;font-size:13px}
.l3-pre{font-family:var(--mono);font-size:12.5px;white-space:pre-wrap;background:rgba(0,0,0,.35);border:1px solid var(--line);border-radius:8px;padding:12px;max-height:380px;overflow:auto}
.l3-tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px}
.l3-table{width:100%;border-collapse:collapse;font-size:13.5px}.l3-table th,.l3-table td{padding:7px 9px;border-bottom:1px solid var(--line2);text-align:left;vertical-align:top}
.l3-table th{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);background:rgba(255,255,255,.03);white-space:nowrap}
.l3-table tr:last-child td{border-bottom:0}.l3-table .r{text-align:right;font-family:var(--mono)}
.l3-win td{background:rgba(123,216,143,.08)}
.l3-diagram{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:rgba(3,10,20,.5);padding:8px}.l3-diagram svg{max-width:none;height:auto;display:block;margin:0 auto}
.l3-hr{height:1px;background:var(--line);border:0;margin:14px 0}
.l3-x{background:none;border:0;color:var(--mute);padding:2px 6px;border-radius:4px;font-size:18px;line-height:1}.l3-x:hover{color:var(--bad);background:rgba(255,107,107,.1)}
.l3-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:80;background:var(--cyan);color:#07111F;padding:9px 18px;border-radius:99px;font-weight:650;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:l3up .25s ease}
@keyframes l3up{from{transform:translate(-50%,14px);opacity:0}to{transform:translate(-50%,0);opacity:1}}

/* what-next */
.l3-next{margin-top:26px;border:1px solid var(--accent);border-radius:12px;padding:18px;background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 10%,transparent),rgba(14,31,52,.8));position:relative}
.l3-next::before{content:"";position:absolute;left:24px;top:-26px;width:2px;height:26px;background:repeating-linear-gradient(to bottom,var(--accent) 0 4px,transparent 4px 8px)}
.l3-nh{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}
.l3-ck{list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;margin:10px 0}
.l3-ck li{display:flex;gap:10px;align-items:center;border:1px solid var(--line2);border-radius:8px;padding:8px 10px;background:var(--panel2)}
.l3-ck li.ok{border-color:rgba(123,216,143,.4);background:rgba(123,216,143,.06)}
.l3-ckt{flex:1;min-width:0}.l3-ckt b{font-weight:600;font-size:14px;display:block}.l3-ckt small{color:var(--mute);font-size:12.5px;display:block}
.l3-tick,.l3-box{width:22px;height:22px;flex:none;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;color:var(--mute)}
.l3-box{border-radius:5px}.l3-tick.on{background:var(--green);border-color:var(--green);color:#07111F}
.l3-cbx{display:flex;cursor:pointer}.l3-cbx input{position:absolute;opacity:0;width:1px;height:1px}.l3-cbx input:checked+.l3-box{background:var(--green);border-color:var(--green);color:#07111F}
.l3-cbx input:focus-visible+.l3-box{outline:2px solid var(--cyan);outline-offset:2px}
.l3-cleared{display:flex;gap:16px;align-items:center;margin:6px 0 10px}
.l3-cta{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;border-top:1px dashed var(--line);padding-top:14px;margin-top:6px}
.l3-cta p{color:var(--mute);font-size:13.5px;max-width:60ch}
.l3-branch{margin-top:16px;border-top:1px dashed var(--line);padding-top:12px}
.l3-bchips{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.l3-bchip{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:5px 12px;font-size:13px;text-align:left}.l3-bchip:hover,.l3-bchip.on{border-color:var(--accent);color:var(--accent)}
.l3-branch-a{margin-top:10px;padding:12px;border-radius:8px;background:rgba(0,0,0,.25);border:1px solid var(--line2);display:flex;flex-direction:column;gap:10px}

/* step header */
.l3-sh{display:flex;gap:18px;align-items:flex-start}
.l3-numeral{font-family:var(--mono);font-weight:800;font-size:clamp(60px,10vw,110px);line-height:.85;color:transparent;-webkit-text-stroke:2px var(--accent);flex:none;text-shadow:0 0 30px color-mix(in srgb,var(--accent) 35%,transparent)}
.l3-sht{flex:1;min-width:0}

/* home */
.l3-hero{padding:26px 0 8px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:26px;align-items:center}
.l3-map{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:8px 0 18px}
.l3-node{position:relative;text-align:left;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--panel);display:flex;flex-direction:column;gap:8px;transition:.2s;min-height:178px}
.l3-node:hover{transform:translateY(-3px);border-color:var(--c)}
.l3-node.here{border-color:var(--c);box-shadow:0 0 0 1px var(--c) inset,0 0 28px color-mix(in srgb,var(--c) 28%,transparent)}
.l3-node .n{font-family:var(--mono);font-size:30px;font-weight:800;color:var(--c);line-height:1}
.l3-node b{font-size:14.5px;line-height:1.2}.l3-node small{color:var(--mute);font-size:12px;line-height:1.35}
.l3-node .you{position:absolute;top:-11px;right:10px;background:var(--c);color:#07111F;font-family:var(--mono);font-size:10px;font-weight:800;padding:1px 8px;border-radius:99px;letter-spacing:.1em}
.l3-node .stat{margin-top:auto;font-family:var(--mono);font-size:11.5px;color:var(--mute)}
.l3-funnel{display:flex;align-items:center;gap:0;margin:12px 0}
.l3-fn{flex:1;text-align:center;position:relative}
.l3-fn .bubble{margin:0 auto;border-radius:50%;display:grid;place-items:center;font-family:var(--mono);font-weight:800;color:#07111F;transition:.4s}
.l3-fn.ghost .bubble{background:transparent!important;border:2px dashed var(--c);color:var(--c)}
.l3-fn small{display:block;font-size:11px;color:var(--mute);margin-top:4px}
.l3-pulse{display:flex;align-items:flex-end;gap:6px;height:90px}
.l3-pulse div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;font-family:var(--mono);font-size:11px}
.l3-pulse i{display:block;width:100%;border-radius:4px 4px 0 0;background:var(--c);min-height:3px;transition:height .5s}
.l3-nm{display:flex;gap:16px;align-items:center;flex-wrap:wrap;border:1px solid var(--cyan);border-radius:12px;padding:16px;background:linear-gradient(120deg,rgba(92,225,230,.12),rgba(14,31,52,.8))}
.l3-atlas{display:flex;flex-direction:column;gap:6px}
.l3-ar{display:flex;gap:12px;align-items:center;text-align:left;border:1px solid var(--line2);border-radius:8px;padding:8px 10px;background:var(--panel2);width:100%}.l3-ar:hover{border-color:var(--cyan)}
.l3-ar .pg{font-family:var(--mono);color:var(--amber);min-width:70px;font-size:12.5px}

/* learn cards & games */
.l3-card{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--panel2)}
.l3-op{display:flex;gap:12px;align-items:flex-start}.l3-opn{font-family:var(--mono);font-weight:800;font-size:28px;color:var(--accent);line-height:1;flex:none;width:34px}
.l3-ba{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;font-size:13px;margin-top:6px}.l3-ba span{border:1px solid var(--line2);border-radius:6px;padding:4px 8px;background:rgba(0,0,0,.25)}.l3-ba em{color:var(--accent);font-style:normal}
.l3-lad{display:grid;grid-template-columns:44px 1fr;gap:16px;align-items:stretch}
.l3-rail{position:relative;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.25);min-height:260px}
.l3-car{position:absolute;left:3px;right:3px;height:28px;border:2px solid var(--accent);border-radius:6px;background:color-mix(in srgb,var(--accent) 25%,transparent);transition:top .35s cubic-bezier(.2,.8,.2,1);display:grid;place-items:center;font-family:var(--mono);font-size:11px}
.l3-quiz-btns{display:flex;gap:8px;flex-wrap:wrap}.l3-opt{border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:var(--panel2)}
.l3-opt.right{border-color:var(--green);background:rgba(123,216,143,.12)}.l3-opt.wrong{border-color:var(--bad);background:rgba(255,107,107,.12)}
.l3-match{display:grid;grid-template-columns:1fr 1fr;gap:14px}.l3-mi{border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--panel2);text-align:left;width:100%;margin-bottom:8px;font-size:13.5px}
.l3-mi.sel{border-color:var(--cyan);background:rgba(92,225,230,.12)}.l3-mi.done{border-color:var(--green);background:rgba(123,216,143,.1);opacity:.7}
.l3-ft{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:12px}.l3-ft i{display:inline-block;width:34px;height:0;border-top:2px solid}
.l3-ft.E i{border-color:var(--orange)}.l3-ft.M i{border-color:var(--cyan);border-top-width:5px}.l3-ft.S i{border-color:var(--green);border-top-style:dashed}
.l3-ft.E{color:var(--orange)}.l3-ft.M{color:#6CB6FF}.l3-ft.S{color:var(--green)}

/* forge / chart */
.l3-fnrow{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;margin-bottom:6px}
.l3-flrow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 70px minmax(0,1fr) auto;gap:6px;align-items:center;margin-bottom:6px}
.l3-lint{display:flex;gap:8px;font-size:13px;align-items:flex-start;margin:4px 0}.l3-lint b{font-family:var(--mono);flex:none}
.l3-morph{overflow-x:auto;padding-bottom:8px}
.l3-mrow{display:flex;gap:10px;margin-bottom:12px;align-items:stretch;min-width:max-content}
.l3-mfn{width:168px;flex:none;border:1px solid var(--accent);border-radius:8px;padding:10px;background:color-mix(in srgb,var(--accent) 9%,transparent);display:flex;flex-direction:column;gap:6px;position:sticky;left:0;z-index:2;backdrop-filter:blur(6px)}
.l3-cell{width:228px;flex:none;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--panel2);display:flex;flex-direction:column;gap:6px;position:relative}
.l3-cell .cn{position:absolute;right:8px;top:6px;font-family:var(--mono);font-size:10.5px;color:var(--mute)}
.l3-cell.ok{border-color:rgba(123,216,143,.5)}.l3-cell.add{border-style:dashed;align-items:center;justify-content:center;color:var(--mute);min-height:120px;width:140px}
.l3-thumb{width:100%;aspect-ratio:5/3;border:1px solid var(--line2);border-radius:6px;background:#FDFCF7 center/contain no-repeat;display:grid;place-items:center;color:#667;font-size:12px;cursor:pointer}
.l3-effcard{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel2);display:flex;flex-direction:column;gap:6px}.l3-effcard h4{font-size:15px}
.l3-effcard:hover{border-color:var(--amber)}
.l3-timer{font-family:var(--mono);font-size:42px;font-weight:800;color:var(--accent);line-height:1}
.l3-scamper{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line2);border-radius:8px;padding:9px 11px;background:var(--panel2);margin-bottom:8px}
.l3-scamper b{color:var(--accent);min-width:110px;font-family:var(--mono);font-size:13px}

/* weave */
.l3-wvfn{display:flex;gap:10px;align-items:flex-start;border-bottom:1px solid var(--line2);padding:10px 0}.l3-wvfn>b{width:150px;flex:none;font-size:13.5px}
.l3-pick{border:1px solid var(--line);border-radius:8px;padding:6px 10px;background:var(--panel2);font-size:13px;text-align:left;max-width:240px}.l3-pick.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent);box-shadow:0 0 0 1px var(--accent) inset}
.l3-dots{display:flex;gap:3px;margin-top:3px}.l3-dots i{width:8px;height:8px;border-radius:50%;display:block}
.l3-diffm{border-collapse:collapse;font-family:var(--mono);font-size:13px}.l3-diffm td,.l3-diffm th{border:1px solid var(--line2);padding:5px 10px;text-align:center}
.l3-diffm .lo{background:rgba(255,107,107,.18);color:var(--bad)}.l3-diffm .hi{background:rgba(123,216,143,.12);color:var(--green)}

/* arena */
.l3-mk{width:38px;height:30px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);font-family:var(--mono);font-weight:800;font-size:15px}
.l3-mk[data-v="+"]{color:var(--green);border-color:var(--green)}.l3-mk[data-v="-"]{color:var(--bad);border-color:var(--bad);background:rgba(255,107,107,.1)}.l3-mk[data-v="?"]{color:var(--amber);border-color:var(--amber)}.l3-mk[data-v="!"]{color:var(--cyan);border-color:var(--cyan)}
.l3-out{opacity:.45;text-decoration:line-through}
.l3-bar{height:20px;border-radius:4px;background:var(--accent);min-width:2px;transition:width .4s}
.l3-quad{position:relative;aspect-ratio:1/1;max-width:440px;border:1px solid var(--line);border-radius:8px;background:linear-gradient(to right,transparent 49.7%,var(--line) 49.7% 50.3%,transparent 50.3%),linear-gradient(to bottom,transparent 49.7%,var(--line) 49.7% 50.3%,transparent 50.3%),rgba(0,0,0,.25);touch-action:none}
.l3-qd{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--accent);color:#07111F;font-family:var(--mono);font-weight:800;font-size:12px;display:grid;place-items:center;cursor:grab;border:2px solid #fff;touch-action:none}
.l3-qlab{position:absolute;font-family:var(--mono);font-size:10.5px;color:var(--mute)}
.l3-tree ul{list-style:none;padding-left:18px;border-left:1px dashed var(--line)}.l3-tree li{margin:6px 0}
.l3-tn{display:flex;gap:6px;align-items:center;flex-wrap:wrap}

/* sketch */
.l3-sk{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#FDFCF7}.l3-sk canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}
.l3-skb{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px;background:var(--panel);border-bottom:1px solid var(--line)}
.l3-sw{width:22px;height:22px;border-radius:50%;border:2px solid transparent;padding:0}.l3-sw.on{border-color:#fff;box-shadow:0 0 0 2px var(--cyan)}
.l3-modal{position:fixed;inset:0;z-index:70;background:rgba(2,6,14,.82);display:grid;place-items:center;padding:16px;overflow:auto}
.l3-mbox{width:min(980px,100%);background:var(--bg2);border:1px solid var(--cyan);border-radius:12px;padding:14px}

/* palette */
.l3-pal{width:min(620px,100%);background:var(--bg2);border:1px solid var(--cyan);border-radius:12px;overflow:hidden;align-self:start;margin-top:10vh}
.l3-pal input{border:0;border-bottom:1px solid var(--line);border-radius:0;padding:14px 16px;font-size:16px;background:transparent}
.l3-pl{max-height:50vh;overflow:auto;padding:6px}.l3-pi{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;border-radius:6px;padding:8px 10px;align-items:center}
.l3-pi.on{background:rgba(92,225,230,.14)}.l3-pi small{margin-left:auto;font-family:var(--mono);color:var(--mute);flex:none}

/* paper / appendix */
.l3-paper{background:#fff;color:#111;border-radius:6px;padding:26px 30px;font-family:Georgia,"Times New Roman",serif;font-size:13px;line-height:1.45;box-shadow:0 10px 40px rgba(0,0,0,.4);margin-bottom:20px}
.l3-paper h2{font-size:18px;margin-bottom:2px;font-family:Georgia,serif}.l3-paper h3{font-size:14px;margin:14px 0 4px}.l3-paper .meta{color:#555;font-size:11.5px;margin-bottom:10px}
.l3-paper table{border-collapse:collapse;width:100%;font-size:11.5px;margin:6px 0}.l3-paper th,.l3-paper td{border:1px solid #888;padding:4px 6px;text-align:left;vertical-align:top}.l3-paper th{background:#eee}
.l3-paper img{max-width:100%;max-height:260px;border:1px solid #bbb}.l3-paper .svgw{overflow-x:auto}.l3-paper .svgw svg{max-width:100%;height:auto}
.l3-paper .win td{background:#e8f5e9}.l3-paper .out td{color:#999;text-decoration:line-through}
.l3-printarea{display:none}

@media (max-width:900px){
 .l3-hero,.l3-split,.l3-g2,.l3-match{grid-template-columns:1fr}.l3-g3,.l3-g4{grid-template-columns:repeat(2,minmax(0,1fr))}
 .l3-map{grid-template-columns:repeat(2,minmax(0,1fr))}.l3-node{min-height:0}.l3-brand small{display:none}.l3-sh{flex-wrap:wrap}.l3-numeral{display:none}
 .l3-fnrow{grid-template-columns:1fr auto auto}.l3-flrow{grid-template-columns:1fr 1fr}.l3-wvfn{flex-direction:column}.l3-lad{grid-template-columns:36px 1fr}
 .l3-save{display:none}
}
@media (max-width:520px){.l3-g3,.l3-g4{grid-template-columns:1fr}.l3-map{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.l3-root *{animation:none!important;transition:none!important}}
@media print{
 .l3-top,.l3-main,.l3-foot,.l3-toast,.l3-modal{display:none!important}
 .l3-root{background:#fff!important;min-height:0}
 .l3-printarea{display:block!important}
 .l3-printarea .l3-paper{box-shadow:none;margin:0;padding:0;border-radius:0;page-break-after:always}
 @page{margin:14mm}
}
`;
