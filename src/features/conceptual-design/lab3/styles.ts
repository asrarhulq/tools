// All CSS for the guide, scoped under .l3-root so it cannot leak into the host site.
//
// A light, editorial design system — generous whitespace, a restrained
// muted palette (one hue per step, desaturated rather than neon), refined
// hairline borders instead of glowing neon ones, soft low-opacity shadows
// instead of colored glows, and the site's own already-loaded fonts
// (`--font-sans`/`--font-display`, set globally on <html> — see
// src/lib/fonts.ts) instead of a bundled monospace "terminal" face. Every
// selector below matches a class name the components already use, so this
// file is the entire visual language — no component needed to change.
export const CSS = `
.l3-root{--bg:#FAFAF8;--panel:#FFFFFF;--panel2:#F5F3EE;--line:#E7E2D8;--line2:#EFEBE3;
--ink:#1C1A17;--mute:#78746B;--cyan:#3E6D8E;--green:#3E7A5C;--amber:#A67C3D;--orange:#B4603C;--pink:#A14F68;--violet:#5F5590;--bad:#B2453E;--accent:#2F5D50;
--mono:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);--sans:var(--font-sans,-apple-system,"Segoe UI",system-ui,Roboto,Helvetica,Arial,sans-serif);--display:var(--font-display,var(--sans));
position:relative;min-height:100vh;color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.6;background-color:var(--bg);-webkit-font-smoothing:antialiased}
.l3-root *,.l3-root *::before,.l3-root *::after{box-sizing:border-box}
.l3-root h1,.l3-root h2,.l3-root h3,.l3-root h4,.l3-root p,.l3-root ul,.l3-root ol{margin:0}
.l3-root button{font:inherit;color:inherit;cursor:pointer}
.l3-root input,.l3-root textarea,.l3-root select{font:inherit;color:var(--ink)}
.l3-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.l3-root a{color:var(--accent)}
.l3-boot{padding:80px 20px;text-align:center;color:var(--mute);font-family:var(--sans);background:#FAFAF8;min-height:60vh}

/* top bar */
.l3-top{position:sticky;top:0;z-index:30;backdrop-filter:blur(14px);background:rgba(250,250,248,.86);border-bottom:1px solid var(--line)}
.l3-topin{max-width:1180px;margin:0 auto;padding:14px 20px;display:flex;gap:16px;align-items:center}
.l3-brand{display:flex;gap:11px;align-items:center;cursor:pointer;background:none;border:0;padding:0;text-align:left;flex:none}
.l3-logo{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-family:var(--display);font-weight:700;color:#fff;font-size:13px;background:var(--ink)}
.l3-brand b{display:block;font-size:14.5px;font-family:var(--display);font-weight:600;letter-spacing:-.005em;line-height:1.2}.l3-brand small{display:block;color:var(--mute);font-size:11.5px}
.l3-nav{display:flex;gap:6px;overflow-x:auto;flex:1;scrollbar-width:none;padding:2px}
.l3-nav::-webkit-scrollbar{display:none}
.l3-pill{flex:none;display:flex;align-items:center;gap:7px;padding:6px 13px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--mute);font-size:13px;white-space:nowrap;transition:.15s}
.l3-pill:hover{background:var(--panel2);color:var(--ink)}
.l3-pill.on{border-color:var(--line);background:var(--panel2);color:var(--ink);box-shadow:0 1px 2px rgba(20,16,8,.04)}
.l3-pill i{font-style:normal;font-family:var(--display);font-weight:700;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-size:10.5px;border:1.3px solid var(--c,var(--accent));color:var(--c,var(--accent))}
.l3-pill.done i{background:var(--c,var(--accent));color:#fff;border-color:transparent}
.l3-topr{display:flex;gap:10px;align-items:center;flex:none}
.l3-save{font-size:12px;color:var(--mute)}
.l3-save.err{color:var(--bad)}
.l3-kbd{font-family:var(--mono);font-size:10.5px;border:1px solid var(--line);border-radius:5px;padding:1.5px 6px;color:var(--mute);background:var(--panel2)}
.l3-main{max-width:1180px;margin:0 auto;padding:36px 20px 100px}
.l3-foot{max-width:1180px;margin:0 auto;padding:0 20px 48px;color:var(--mute);font-size:12.5px}

/* primitives */
.l3-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.l3-col{display:flex;flex-direction:column;gap:10px}
.l3-grow{flex:1;min-width:0}.l3-end{margin-left:auto}
.l3-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.l3-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.l3-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.l3-gauto{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.l3-split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:20px;align-items:start}
.l3-mute{color:var(--mute)}.l3-mono{font-family:var(--mono)}.l3-small{font-size:13px}.l3-b{font-weight:700}.l3-tc{text-align:center}
.l3-ok{color:var(--green)}.l3-warn{color:var(--amber)}.l3-bad{color:var(--bad)}
.l3-eyebrow{font-family:var(--sans);font-size:11.5px;font-weight:600;letter-spacing:.08em;color:var(--mute);text-transform:uppercase}
.l3-h1{font-family:var(--display);font-size:clamp(32px,5vw,52px);line-height:1.04;letter-spacing:-.025em;font-weight:700;color:var(--ink)}
.l3-h2{font-family:var(--display);font-size:clamp(25px,3.4vw,36px);line-height:1.1;letter-spacing:-.02em;font-weight:700;color:var(--ink)}
.l3-h3{font-family:var(--display);font-size:18px;font-weight:600;line-height:1.3;color:var(--ink)}.l3-h4{font-size:14.5px;font-weight:650}
.l3-lead{color:var(--mute);max-width:66ch;margin:8px 0 12px;font-size:16px;line-height:1.6}
.l3-sub{color:var(--mute);font-size:13.5px;margin-top:3px;line-height:1.5}
.l3-panel{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:18px;box-shadow:0 1px 2px rgba(20,16,8,.03)}
.l3-ph{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
.l3-phr{display:flex;align-items:center;gap:8px;flex:none}
.l3-tb{font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--mute);text-transform:uppercase;white-space:nowrap}
.l3-btn{display:inline-flex;gap:7px;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:10px;padding:9px 16px;font-size:14px;font-weight:500;transition:.15s;line-height:1.2}
.l3-btn:hover:not(:disabled){border-color:#D9D3C5;background:var(--panel2)}
.l3-btn:disabled{opacity:.4;cursor:not-allowed}.l3-btn[aria-pressed="true"]{border-color:var(--ink);background:var(--ink);color:#fff}
.l3-primary{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600}
.l3-primary:hover:not(:disabled){filter:brightness(1.08);border-color:var(--accent)}
.l3-danger{border-color:var(--line);color:var(--bad)}.l3-danger:hover:not(:disabled){background:color-mix(in srgb,var(--bad) 8%,transparent);border-color:var(--bad)}
.l3-quiet{border-color:transparent;background:transparent;color:var(--mute)}
.l3-sm{padding:5px 11px;font-size:12.5px;border-radius:8px}
.l3-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid transparent;border-radius:999px;padding:3px 11px;font-size:12px;font-weight:500;color:var(--mute);background:var(--panel2)}
.l3-t-accent{color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--panel2))}.l3-t-good{color:var(--green);background:color-mix(in srgb,var(--green) 12%,var(--panel2))}.l3-t-warn{color:var(--amber);background:color-mix(in srgb,var(--amber) 14%,var(--panel2))}.l3-t-bad{color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--panel2))}
.l3-slide{font-size:11.5px;color:var(--amber);border:1px solid color-mix(in srgb,var(--amber) 35%,transparent);border-radius:999px;padding:2px 9px;white-space:nowrap;background:color-mix(in srgb,var(--amber) 7%,transparent)}
.l3-input,.l3-textarea,.l3-select{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:9px 12px;font-size:14.5px}
.l3-input:focus,.l3-textarea:focus,.l3-select:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent)}
.l3-textarea{resize:vertical;min-height:72px}.l3-select{appearance:auto}
.l3-input.l3-s{padding:6px 9px;font-size:13.5px}.l3-num{width:90px;text-align:right;font-family:var(--mono)}
.l3-field{display:flex;flex-direction:column;gap:5px}.l3-field>label,.l3-lab{font-size:11.5px;color:var(--mute);font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.l3-hint{font-size:12.5px;color:var(--mute)}
.l3-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line);margin:8px 0 22px;scrollbar-width:none}.l3-tabs::-webkit-scrollbar{display:none}
.l3-tab{flex:none;background:none;border:0;border-bottom:2px solid transparent;padding:11px 15px;color:var(--mute);font-size:14.5px;font-weight:500;display:flex;gap:7px;align-items:center;margin-bottom:-1px;transition:.15s}
.l3-tab:hover{color:var(--ink)}.l3-tab.on{color:var(--accent);border-bottom-color:var(--accent);font-weight:650}
.l3-badge{font-style:normal;font-size:10.5px;font-weight:700;background:var(--accent);color:#fff;border-radius:999px;padding:0 6px}
.l3-meter{margin:7px 0}.l3-ml{display:flex;justify-content:space-between;font-size:12.5px;color:var(--mute);margin-bottom:4px}.l3-ml b{color:var(--ink);font-weight:600}
.l3-mt{height:7px;border-radius:99px;background:var(--panel2);overflow:hidden}.l3-fill{display:block;height:100%;border-radius:99px;transition:width .4s cubic-bezier(.2,.8,.2,1)}
.l3-f-cyan{background:var(--cyan)}.l3-f-green{background:var(--green)}.l3-f-amber{background:var(--amber)}.l3-f-orange{background:var(--orange)}.l3-f-pink{background:var(--pink)}.l3-f-violet{background:var(--violet)}.l3-f-bad{background:var(--bad)}
.l3-ring{position:relative;display:inline-grid;place-items:center;flex:none}.l3-ring svg{position:absolute;inset:0}.l3-ring span{position:relative;font-weight:700;font-size:12px;color:var(--ink)}
.l3-call{border:1px solid var(--line);border-left-width:3px;border-radius:12px;padding:12px 15px;margin:12px 0;background:var(--panel2);font-size:14px;line-height:1.55}
.l3-call p+p{margin-top:6px}.l3-ct{display:block;margin-bottom:3px;font-weight:600}
.l3-c-info{border-left-color:var(--cyan)}.l3-c-warn{border-left-color:var(--amber);background:color-mix(in srgb,var(--amber) 6%,var(--panel2))}.l3-c-good{border-left-color:var(--green);background:color-mix(in srgb,var(--green) 6%,var(--panel2))}.l3-c-bad{border-left-color:var(--bad);background:color-mix(in srgb,var(--bad) 6%,var(--panel2))}
.l3-stamp{display:inline-flex;align-items:center;gap:6px;border:1px solid color-mix(in srgb,var(--green) 35%,transparent);color:var(--green);background:color-mix(in srgb,var(--green) 8%,transparent);padding:5px 14px;border-radius:999px;font-weight:650;font-size:13px;letter-spacing:.03em;animation:l3stamp .35s ease}
@keyframes l3stamp{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.l3-empty{border:1px dashed var(--line);border-radius:14px;padding:26px;text-align:center;color:var(--mute);display:flex;flex-direction:column;gap:12px;align-items:center}
.l3-tip{display:flex;gap:10px;border:1px solid var(--line);border-radius:12px;padding:11px 14px;margin:12px 0;color:var(--mute);font-size:13.5px;background:var(--panel2)}.l3-tip>span{color:var(--amber)}
.l3-code{font-family:var(--mono);background:var(--panel2);border:1px solid var(--line);border-radius:7px;padding:2px 7px;font-size:13px}
.l3-pre{font-family:var(--mono);font-size:12.5px;white-space:pre-wrap;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:14px;max-height:380px;overflow:auto}
.l3-tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
.l3-table{width:100%;border-collapse:collapse;font-size:13.5px}.l3-table th,.l3-table td{padding:9px 11px;border-bottom:1px solid var(--line2);text-align:left;vertical-align:top}
.l3-table th{font-size:11px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);background:var(--panel2);white-space:nowrap}
.l3-table tr:last-child td{border-bottom:0}.l3-table .r{text-align:right;font-family:var(--mono)}
.l3-win td{background:color-mix(in srgb,var(--green) 7%,transparent)}
.l3-diagram{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:10px}.l3-diagram svg{max-width:none;height:auto;display:block;margin:0 auto}
.l3-hr{height:1px;background:var(--line);border:0;margin:16px 0}
.l3-x{background:none;border:0;color:var(--mute);padding:2px 6px;border-radius:6px;font-size:18px;line-height:1}.l3-x:hover{color:var(--bad);background:color-mix(in srgb,var(--bad) 8%,transparent)}
.l3-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:80;background:var(--ink);color:#fff;padding:10px 20px;border-radius:999px;font-weight:600;font-size:14px;box-shadow:0 10px 30px rgba(20,16,8,.22);animation:l3up .25s ease}
@keyframes l3up{from{transform:translate(-50%,14px);opacity:0}to{transform:translate(-50%,0);opacity:1}}

/* what-next */
.l3-next{margin-top:32px;border:1px solid var(--line);border-radius:18px;padding:22px;background:var(--panel)}
.l3-nh{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
.l3-ck{list-style:none;padding:0;display:flex;flex-direction:column;gap:7px;margin:12px 0}
.l3-ck li{display:flex;gap:11px;align-items:center;border:1px solid var(--line2);border-radius:12px;padding:10px 12px;background:var(--panel2)}
.l3-ck li.ok{border-color:color-mix(in srgb,var(--green) 30%,transparent);background:color-mix(in srgb,var(--green) 6%,transparent)}
.l3-ckt{flex:1;min-width:0}.l3-ckt b{font-weight:600;font-size:14px;display:block}.l3-ckt small{color:var(--mute);font-size:12.5px;display:block}
.l3-tick,.l3-box{width:22px;height:22px;flex:none;border-radius:50%;border:1.5px solid var(--line);display:grid;place-items:center;color:var(--mute);background:var(--panel)}
.l3-box{border-radius:6px}.l3-tick.on{background:var(--green);border-color:var(--green);color:#fff}
.l3-cbx{display:flex;cursor:pointer}.l3-cbx input{position:absolute;opacity:0;width:1px;height:1px}.l3-cbx input:checked+.l3-box{background:var(--green);border-color:var(--green);color:#fff}
.l3-cbx input:focus-visible+.l3-box{outline:2px solid var(--accent);outline-offset:2px}
.l3-cleared{display:flex;gap:16px;align-items:center;margin:8px 0 12px}
.l3-cta{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:16px;margin-top:8px}
.l3-cta p{color:var(--mute);font-size:13.5px;max-width:60ch}
.l3-branch{margin-top:18px;border-top:1px solid var(--line);padding-top:14px}
.l3-bchips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.l3-bchip{border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:6px 13px;font-size:13px;text-align:left;color:var(--ink)}.l3-bchip:hover,.l3-bchip.on{border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,var(--panel2))}
.l3-branch-a{margin-top:10px;padding:14px;border-radius:12px;background:var(--panel2);border:1px solid var(--line2);display:flex;flex-direction:column;gap:10px}

/* step header */
.l3-sh{display:flex;gap:20px;align-items:flex-start}
.l3-numeral{font-family:var(--display);font-weight:700;font-size:clamp(56px,9vw,100px);line-height:.85;color:color-mix(in srgb,var(--accent) 16%,transparent);flex:none}
.l3-sht{flex:1;min-width:0}

/* home */
.l3-hero{padding:8px 0 10px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:30px;align-items:center}
.l3-map{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:10px 0 20px}
.l3-node{position:relative;text-align:left;border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--panel);display:flex;flex-direction:column;gap:8px;transition:.2s;min-height:178px;box-shadow:0 1px 2px rgba(20,16,8,.03)}
.l3-node:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(20,16,8,.07)}
.l3-node.here{border-color:var(--c);box-shadow:0 0 0 1.5px var(--c)}
.l3-node .n{font-family:var(--display);font-size:26px;font-weight:700;color:var(--c);line-height:1}
.l3-node b{font-size:14.5px;line-height:1.25}.l3-node small{color:var(--mute);font-size:12px;line-height:1.4}
.l3-node .you{position:absolute;top:-10px;right:12px;background:var(--c);color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:99px;letter-spacing:.06em}
.l3-node .stat{margin-top:auto;font-size:11.5px;color:var(--mute)}
.l3-funnel{display:flex;align-items:center;gap:0;margin:14px 0}
.l3-fn{flex:1;text-align:center;position:relative}
.l3-fn .bubble{margin:0 auto;border-radius:50%;display:grid;place-items:center;font-family:var(--display);font-weight:700;color:#fff;transition:.4s}
.l3-fn.ghost .bubble{background:transparent!important;border:2px dashed var(--c);color:var(--c)}
.l3-fn small{display:block;font-size:11.5px;color:var(--mute);margin-top:5px}
.l3-pulse{display:flex;align-items:flex-end;gap:6px;height:90px}
.l3-pulse div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;font-size:11px}
.l3-pulse i{display:block;width:100%;border-radius:4px 4px 0 0;background:var(--c);min-height:3px;transition:height .5s}
.l3-nm{display:flex;gap:16px;align-items:center;flex-wrap:wrap;border:1px solid var(--line);border-radius:16px;padding:18px;background:var(--panel)}
.l3-atlas{display:flex;flex-direction:column;gap:6px}
.l3-ar{display:flex;gap:12px;align-items:center;text-align:left;border:1px solid var(--line2);border-radius:10px;padding:9px 11px;background:var(--panel2);width:100%;transition:.15s}.l3-ar:hover{border-color:var(--accent)}
.l3-ar .pg{font-family:var(--mono);color:var(--amber);min-width:70px;font-size:12.5px}

/* learn cards & games */
.l3-card{border:1px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--panel)}
.l3-op{display:flex;gap:12px;align-items:flex-start}.l3-opn{font-family:var(--display);font-weight:700;font-size:24px;color:var(--accent);line-height:1;flex:none;width:34px}
.l3-ba{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;font-size:13px;margin-top:6px}.l3-ba span{border:1px solid var(--line2);border-radius:8px;padding:5px 9px;background:var(--panel2)}.l3-ba em{color:var(--accent);font-style:normal}
.l3-lad{display:grid;grid-template-columns:44px 1fr;gap:16px;align-items:stretch}
.l3-rail{position:relative;border:1px solid var(--line);border-radius:12px;background:var(--panel2);min-height:260px}
.l3-car{position:absolute;left:3px;right:3px;height:28px;border:1.5px solid var(--accent);border-radius:8px;background:color-mix(in srgb,var(--accent) 12%,var(--panel));transition:top .35s cubic-bezier(.2,.8,.2,1);display:grid;place-items:center;font-size:12px;color:var(--accent);font-weight:600}
.l3-quiz-btns{display:flex;gap:8px;flex-wrap:wrap}.l3-opt{border:1px solid var(--line);border-radius:10px;padding:9px 13px;background:var(--panel)}
.l3-opt.right{border-color:var(--green);background:color-mix(in srgb,var(--green) 10%,transparent)}.l3-opt.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,transparent)}
.l3-match{display:grid;grid-template-columns:1fr 1fr;gap:14px}.l3-mi{border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--panel);text-align:left;width:100%;margin-bottom:8px;font-size:13.5px}
.l3-mi.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}.l3-mi.done{border-color:var(--green);background:color-mix(in srgb,var(--green) 8%,transparent);opacity:.7}
.l3-ft{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500}.l3-ft i{display:inline-block;width:34px;height:0;border-top:2px solid}
.l3-ft.E i{border-color:var(--orange)}.l3-ft.M i{border-color:var(--cyan);border-top-width:5px}.l3-ft.S i{border-color:var(--green);border-top-style:dashed}
.l3-ft.E{color:var(--orange)}.l3-ft.M{color:var(--cyan)}.l3-ft.S{color:var(--green)}

/* forge / chart */
.l3-fnrow{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;margin-bottom:6px}
.l3-flrow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 70px minmax(0,1fr) auto;gap:6px;align-items:center;margin-bottom:6px}
.l3-lint{display:flex;gap:8px;font-size:13px;align-items:flex-start;margin:5px 0}.l3-lint b{flex:none}
.l3-morph{overflow-x:auto;padding-bottom:8px}
.l3-mrow{display:flex;gap:10px;margin-bottom:12px;align-items:stretch;min-width:max-content}
.l3-mfn{width:168px;flex:none;border:1px solid var(--line);border-radius:12px;padding:11px;background:var(--panel);display:flex;flex-direction:column;gap:6px;position:sticky;left:0;z-index:2;box-shadow:0 1px 2px rgba(20,16,8,.03)}
.l3-cell{width:228px;flex:none;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel2);display:flex;flex-direction:column;gap:6px;position:relative}
.l3-cell .cn{position:absolute;right:9px;top:7px;font-family:var(--mono);font-size:10.5px;color:var(--mute)}
.l3-cell.ok{border-color:color-mix(in srgb,var(--green) 45%,transparent)}.l3-cell.add{border-style:dashed;align-items:center;justify-content:center;color:var(--mute);min-height:120px;width:140px;background:transparent}
.l3-thumb{width:100%;aspect-ratio:5/3;border:1px solid var(--line2);border-radius:8px;background:#FDFCF7 center/contain no-repeat;display:grid;place-items:center;color:var(--mute);font-size:12px;cursor:pointer}
.l3-effcard{border:1px solid var(--line);border-radius:14px;padding:13px;background:var(--panel);display:flex;flex-direction:column;gap:6px}.l3-effcard h4{font-size:15px;font-weight:600}
.l3-effcard:hover{border-color:var(--amber)}
.l3-timer{font-family:var(--display);font-size:38px;font-weight:700;color:var(--accent);line-height:1}
.l3-scamper{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line2);border-radius:10px;padding:10px 12px;background:var(--panel2);margin-bottom:8px}
.l3-scamper b{color:var(--accent);min-width:110px;font-size:13px;font-weight:600}

/* weave */
.l3-wvfn{display:flex;gap:10px;align-items:flex-start;border-bottom:1px solid var(--line2);padding:11px 0}.l3-wvfn>b{width:150px;flex:none;font-size:13.5px}
.l3-pick{border:1px solid var(--line);border-radius:10px;padding:7px 11px;background:var(--panel);font-size:13px;text-align:left;max-width:240px}.l3-pick.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}
.l3-dots{display:flex;gap:3px;margin-top:3px}.l3-dots i{width:8px;height:8px;border-radius:50%;display:block}
.l3-diffm{border-collapse:collapse;font-family:var(--mono);font-size:13px}.l3-diffm td,.l3-diffm th{border:1px solid var(--line2);padding:6px 11px;text-align:center}
.l3-diffm .lo{background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad)}.l3-diffm .hi{background:color-mix(in srgb,var(--green) 10%,transparent);color:var(--green)}

/* arena */
.l3-mk{width:38px;height:30px;border:1px solid var(--line);border-radius:8px;background:var(--panel);font-weight:700;font-size:15px}
.l3-mk[data-v="+"]{color:var(--green);border-color:var(--green)}.l3-mk[data-v="-"]{color:var(--bad);border-color:var(--bad);background:color-mix(in srgb,var(--bad) 8%,transparent)}.l3-mk[data-v="?"]{color:var(--amber);border-color:var(--amber)}.l3-mk[data-v="!"]{color:var(--cyan);border-color:var(--cyan)}
.l3-out{opacity:.45;text-decoration:line-through}
.l3-bar{height:18px;border-radius:5px;background:var(--accent);min-width:2px;transition:width .4s}
.l3-quad{position:relative;aspect-ratio:1/1;max-width:440px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(to right,transparent 49.7%,var(--line) 49.7% 50.3%,transparent 50.3%),linear-gradient(to bottom,transparent 49.7%,var(--line) 49.7% 50.3%,transparent 50.3%),var(--panel);touch-action:none}
.l3-qd{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:12px;display:grid;place-items:center;cursor:grab;border:2px solid #fff;box-shadow:0 1px 3px rgba(20,16,8,.2);touch-action:none}
.l3-qlab{position:absolute;font-size:10.5px;color:var(--mute);font-weight:600;letter-spacing:.04em}
.l3-tree ul{list-style:none;padding-left:18px;border-left:1px solid var(--line)}.l3-tree li{margin:6px 0}
.l3-tn{display:flex;gap:6px;align-items:center;flex-wrap:wrap}

/* sketch */
.l3-sk{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#FDFCF7}.l3-sk canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}
.l3-skb{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px;background:var(--panel);border-bottom:1px solid var(--line)}
.l3-sw{width:21px;height:21px;border-radius:50%;border:2px solid transparent;padding:0}.l3-sw.on{border-color:var(--ink)}
.l3-modal{position:fixed;inset:0;z-index:70;background:rgba(28,26,23,.4);display:grid;place-items:center;padding:16px;overflow:auto;backdrop-filter:blur(2px)}
.l3-mbox{width:min(980px,100%);background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 20px 60px rgba(20,16,8,.18)}

/* palette */
.l3-pal{width:min(620px,100%);background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden;align-self:start;margin-top:10vh;box-shadow:0 20px 60px rgba(20,16,8,.18)}
.l3-pal input{border:0;border-bottom:1px solid var(--line);border-radius:0;padding:16px 18px;font-size:16px;background:transparent}
.l3-pl{max-height:50vh;overflow:auto;padding:6px}.l3-pi{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;border-radius:9px;padding:9px 11px;align-items:center}
.l3-pi.on{background:var(--panel2)}.l3-pi small{margin-left:auto;color:var(--mute);flex:none}

/* paper / appendix */
.l3-paper{background:#fff;color:#1a1a17;border:1px solid var(--line);border-radius:14px;padding:30px 34px;font-family:Georgia,"Times New Roman",serif;font-size:13px;line-height:1.5;box-shadow:0 1px 2px rgba(20,16,8,.04);margin-bottom:22px}
.l3-paper h2{font-size:19px;margin-bottom:3px;font-family:Georgia,serif}.l3-paper h3{font-size:14.5px;margin:16px 0 5px}.l3-paper .meta{color:#6b675f;font-size:11.5px;margin-bottom:12px}
.l3-paper table{border-collapse:collapse;width:100%;font-size:11.5px;margin:6px 0}.l3-paper th,.l3-paper td{border:1px solid #d8d4c9;padding:5px 7px;text-align:left;vertical-align:top}.l3-paper th{background:#f5f3ee}
.l3-paper img{max-width:100%;max-height:260px;border:1px solid #d8d4c9;border-radius:6px}.l3-paper .svgw{overflow-x:auto}.l3-paper .svgw svg{max-width:100%;height:auto}
.l3-paper .win td{background:#eaf3ee}.l3-paper .out td{color:#9a968c;text-decoration:line-through}
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
 .l3-printarea .l3-paper{box-shadow:none;margin:0;padding:0;border-radius:0;border:0;page-break-after:always}
 @page{margin:14mm}
}
`;
