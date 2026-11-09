/* Mini App: این فایل همان 01-12-chart-tool-readout.js اپ است.
   v1.2.0 — ابزارها (fib/sr/ma/bb/tl/pv) حالا واقعی‌اند: ema سری واقعی
   برمی‌گرداند و analyzeCS از روی خود cs حساب می‌کند (SMA، سقف/کف ۲۰ و ۵۰
   کندل اخیر برای R/S، بولینگر، ATR وایلدر و MACD). on خالی = همه خاموش؛
   app.js با دکمه‌های ابزار (fib/sr/tl/bb/pv) آن‌ها را روشن/خاموش می‌کند.
   analyzeCS/ema/onellaDrawAdvancedTools فقط برای همان ابزارهاست. */
var on = {};
if (typeof window.ema !== 'function') window.ema = function (cl, n) { return emaSeriesLocal(cl, n); };
function emaSeriesLocal(cl, n) {
  if (!Array.isArray(cl) || cl.length < 1 || !(n > 0)) return [];
  var k = 2 / (n + 1), out = [cl[0]];
  for (var i = 1; i < cl.length; i++) out.push(cl[i] * k + out[i - 1] * (1 - k));
  return out;
}
var ema = window.ema;
/* v1.2.2 — سری‌های ابزارهای تازه (همه از روی همان کندل‌ها؛ بدون دادهٔ جدید). */
function ichimokuSeries(candles) {
  if (!Array.isArray(candles) || candles.length < 52) return null;
  var n = candles.length, i, j;
  function mid(a, b) {
    var hi = -Infinity, lo = Infinity;
    for (var k = a; k <= b; k++) { if (candles[k].h > hi) hi = candles[k].h; if (candles[k].l < lo) lo = candles[k].l; }
    return (hi + lo) / 2;
  }
  var tenkan = [], kijun = [], senA = [], senB = [], chikou = [];
  for (i = 0; i < n; i++) { tenkan.push(null); kijun.push(null); senA.push(null); senB.push(null); chikou.push(null); }
  for (i = 8; i < n; i++) tenkan[i] = mid(i - 8, i);
  for (i = 25; i < n; i++) kijun[i] = mid(i - 25, i);
  /* سنکو A/B بیست‌وشش کندل جلوتر رسم می‌شوند (مقدارِ i-26 در ایندکس i). */
  for (i = 51; i < n; i++) senA[i] = (tenkan[i - 26] + kijun[i - 26]) / 2;
  for (i = 77; i < n; i++) senB[i] = mid(i - 26 - 51, i - 26);
  for (i = 0; i < n - 26; i++) chikou[i] = candles[i + 26].c;
  return { tenkan: tenkan, kijun: kijun, senA: senA, senB: senB, chikou: chikou };
}
function ribbonSeries(closes) {
  if (!Array.isArray(closes) || closes.length < 5) return null;
  var periods = [9, 21, 55, 100, 200];
  return periods.map(function (p) { return emaSeriesLocal(closes, p); });
}
function vwapSeries(candles) {
  var cumPV = 0, cumV = 0, out = [];
  for (var i = 0; i < candles.length; i++) {
    var c = candles[i];
    if (typeof c.v !== 'number' || c.v <= 0) return null;
    cumPV += ((c.h + c.l + c.c) / 3) * c.v; cumV += c.v;
    out.push(cumV > 0 ? cumPV / cumV : null);
  }
  return out;
}
function donchianSeries(candles, n) {
  var u = [], l = [];
  for (var i = 0; i < candles.length; i++) {
    if (i < n - 1) { u.push(null); l.push(null); continue; }
    var w = candles.slice(i - n + 1, i + 1), hi = -Infinity, lo = Infinity, j;
    for (j = 0; j < w.length; j++) { if (w[j].h > hi) hi = w[j].h; if (w[j].l < lo) lo = w[j].l; }
    u.push(hi); l.push(lo);
  }
  return { u: u, l: l };
}
function keltnerSeries(candles, n, mult) {
  var cl = candles.map(function (c) { return c.c; });
  var e = emaSeriesLocal(cl, n);
  if (!e.length) return null;
  var tr = [], i;
  for (i = 1; i < candles.length; i++) { var c = candles[i], p = candles[i - 1]; tr.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c))); }
  var a = [], s = 0;
  for (i = 0; i < 14 && i < tr.length; i++) s += tr[i];
  if (tr.length < 14) return null;
  a[13] = s / 14;
  for (i = 14; i < tr.length; i++) a[i] = (a[i - 1] * 13 + tr[i]) / 14;
  var u = [], l = [];
  for (var j = 0; j < candles.length; j++) {
    var av = a[j - 1];
    if (e[j] == null || av == null) { u.push(null); l.push(null); }
    else { u.push(e[j] + mult * av); l.push(e[j] - mult * av); }
  }
  return { u: u, l: l };
}
function supertrendSeries(candles, period, mult) {
  period = period || 10; mult = mult || 3;
  if (!Array.isArray(candles) || candles.length < period + 1) return null;
  var tr = [], i;
  for (i = 1; i < candles.length; i++) { var c = candles[i], p = candles[i - 1]; tr.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c))); }
  var atr = [], s = 0;
  for (i = 0; i < period && i < tr.length; i++) s += tr[i];
  if (tr.length < period) return null;
  atr[period - 1] = s / period;
  for (i = period; i < tr.length; i++) atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  var out = [], fU = null, fL = null, st = null, dir = 1;
  for (var j = 0; j < candles.length; j++) {
    var av = atr[j - 1];
    if (av == null) { out.push(null); continue; }
    var cc = candles[j], pc = j > 0 ? candles[j - 1].c : cc.c;
    var hl2 = (cc.h + cc.l) / 2, bU = hl2 + mult * av, bL = hl2 - mult * av;
    fU = (fU == null) ? bU : ((bU < fU || pc > fU) ? bU : fU);
    fL = (fL == null) ? bL : ((bL > fL || pc < fL) ? bL : fL);
    if (st == null) { st = fU; dir = -1; }
    else if (st === fU) { if (cc.c <= fU) { st = fU; dir = -1; } else { st = fL; dir = 1; } }
    else { if (cc.c >= fL) { st = fL; dir = 1; } else { st = fU; dir = -1; } }
    out.push({ v: st, dir: dir });
  }
  return out;
}
function sarSeries(candles) {
  if (!Array.isArray(candles) || candles.length < 3) return null;
  var out = [], i;
  var up = candles[1].c >= candles[0].c;
  var sar = up ? Math.min(candles[0].l, candles[1].l) : Math.max(candles[0].h, candles[1].h);
  var ep = up ? Math.max(candles[0].h, candles[1].h) : Math.min(candles[0].l, candles[1].l);
  var af = 0.02;
  out.push(null); out.push(sar);
  for (i = 2; i < candles.length; i++) {
    var c = candles[i], p = candles[i - 1], p2 = candles[i - 2];
    var ns = sar + af * (ep - sar);
    if (up) {
      ns = Math.min(ns, p.l, p2.l);
      if (c.l < ns) { up = false; sar = ep; ep = c.l; af = 0.02; out.push(sar); continue; }
      sar = ns;
      if (c.h > ep) { ep = c.h; af = Math.min(0.2, af + 0.02); }
    } else {
      ns = Math.max(ns, p.h, p2.h);
      if (c.h > ns) { up = true; sar = ep; ep = c.h; af = 0.02; out.push(sar); continue; }
      sar = ns;
      if (c.l < ep) { ep = c.l; af = Math.min(0.2, af + 0.02); }
    }
    out.push(sar);
  }
  return out;
}
if (typeof window.analyzeCS !== 'function') window.analyzeCS = function () { return analyzeCSLocal(); };
function analyzeCSLocal() {
  var z = { l: 0, R1: 0, R2: 0, S1: 0, S2: 0, s20: 0, s50: 0, pb: 0.5, bw: 0, atr: 0, hist: 0 };
  try {
    if (!Array.isArray(cs) || cs.length < 2) return z;
    var closes = cs.map(function (c) { return +c.c; }).filter(Number.isFinite);
    var last = closes[closes.length - 1];
    var smaN = function (n) {
      if (closes.length < n) return 0;
      var s = 0;
      for (var i = closes.length - n; i < closes.length; i++) s += closes[i];
      return s / n;
    };
    var win = function (n, f) {
      var w = cs.slice(-n);
      return f.apply(null, w.map(function (c) { return f === Math.max ? c.h : c.l; }));
    };
    var hi20 = win(20, Math.max), lo20 = win(20, Math.min);
    var hi50 = cs.length >= 50 ? win(50, Math.max) : hi20;
    var lo50 = cs.length >= 50 ? win(50, Math.min) : lo20;
    var m20 = smaN(20), sd = 0;
    if (closes.length >= 20) {
      var w20 = closes.slice(-20), m = 0, i;
      for (i = 0; i < 20; i++) m += w20[i];
      m /= 20;
      var v = 0;
      for (i = 0; i < 20; i++) v += (w20[i] - m) * (w20[i] - m);
      sd = Math.sqrt(v / 20);
    }
    var up = m20 + 2 * sd, dn = m20 - 2 * sd;
    var atrV = 0;
    if (cs.length >= 15) {
      var s2 = 0, n2 = Math.min(14, cs.length - 1);
      for (var j = cs.length - n2; j < cs.length; j++) {
        var c = cs[j], p = cs[j - 1];
        s2 += Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
      }
      atrV = s2 / n2;
    }
    var e12 = emaSeriesLocal(closes, 12), e26 = emaSeriesLocal(closes, 26), hist = 0;
    if (e12.length && e26.length) {
      var line = e12.map(function (x, i) { return x - e26[i]; });
      var sig = emaSeriesLocal(line, 9);
      if (sig.length) hist = line[line.length - 1] - sig[sig.length - 1];
    }
    z = { l: last, R1: hi20, R2: hi50, S1: lo20, S2: lo50, s20: m20, s50: smaN(50),
      pb: (up > dn) ? (last - dn) / (up - dn) : 0.5, bw: (m20 > 0) ? (up - dn) / m20 : 0,
      atr: atrV, hist: hist };
  } catch (e) {}
  return z;
}
var analyzeCS = window.analyzeCS;
if (typeof window.onellaDrawAdvancedTools !== 'function') window.onellaDrawAdvancedTools = function () {};
var onellaDrawAdvancedTools = window.onellaDrawAdvancedTools;
if (typeof window.ichimokuSeries !== 'function') window.ichimokuSeries = ichimokuSeries;
if (typeof window.ribbonSeries !== 'function') window.ribbonSeries = ribbonSeries;
/* js/01-12-chart-tool-readout.js — ابزارهای روی چارت (drawTools) و خوانش آن‌ها (toolNote)  [مرحله ۳ ریفکتور: خطوط 469–494 از 01-inline.js قبلی؛ بدنه بایت‌به‌بایت همان است] */
function swing(){const W=$("cc").clientWidth||360,n=Math.min(cs.length,Math.floor((W-46)/7)),v=cs.slice(-n);let ih=0,il=0;v.forEach((c,i)=>{if(c.h>v[ih].h)ih=i;if(c.l<v[il].l)il=i});return{v,ih,il,H:v[ih].h,Lw:v[il].l,up:il<ih}}
function reg(){const v=swing().v,m=v.length,my=v.reduce((a,c)=>a+c.c,0)/m,mx=(m-1)/2;let nu=0,de=0;v.forEach((c,i)=>{nu+=(i-mx)*(c.c-my);de+=(i-mx)**2});const sl=nu/de,ic=my-sl*mx,sd=Math.sqrt(v.reduce((a,c,i)=>a+(c.c-(ic+sl*i))**2,0)/m)||1e-9;return{m,sl,ic,sd}}
function hl(g,Y,p,x0,cw,col,lab,d){const y=Y(p);g.strokeStyle=col;g.fillStyle=col;g.lineWidth=1;g.setLineDash(d?[4,4]:[]);g.beginPath();g.moveTo(x0,y);g.lineTo(cw,y);g.stroke();g.setLineDash([]);g.fillText(lab+" "+fmt(p),x0+3,y-2)}
function drawTools(g,o){const{off,n,X,Y,cw}=o;if(cs.length<60)return;try{
 const replayOn=!!(window.onellaReplay&&window.onellaReplay.active);
 if(!replayOn&&on.fib){const s=swing(),x0=X(Math.min(s.ih,s.il));[0,.236,.382,.5,.618,.786,1].forEach(r=>hl(g,Y,s.up?(window.OnellaChartStyle&&OnellaChartStyle.lerp?OnellaChartStyle.lerp:function(a,b,r){return a+(b-a)*r})(s.H,s.Lw,r):(window.OnellaChartStyle&&OnellaChartStyle.lerp?OnellaChartStyle.lerp:function(a,b,r){return a+(b-a)*r})(s.Lw,s.H,r),x0,cw,r===.618?"#ffb347":"rgba(255,179,71,.55)",String(r),1));
  g.strokeStyle="rgba(255,179,71,.6)";g.beginPath();g.moveTo(X(s.il),Y(s.Lw));g.lineTo(X(s.ih),Y(s.H));g.stroke()}
 if(!replayOn&&on.sr){const a=analyzeCS();[[a.R1,"R1"],[a.R2,"R2"]].forEach(([p,l])=>hl(g,Y,p,0,cw,(window.OnellaChartStyle?OnellaChartStyle.pc("#ff5d6c"):"#ff5d6c"),l,1));[[a.S1,"S1"],[a.S2,"S2"]].forEach(([p,l])=>hl(g,Y,p,0,cw,(window.OnellaChartStyle?OnellaChartStyle.pc("#2ecc8f"):"#2ecc8f"),l,1))}
 if(!replayOn&&(on.ma||on.bb)){const cl=cs.map(x=>x.c),sm=(k,m)=>k>=m-1?cl.slice(k-m+1,k+1).reduce((a,b)=>a+b,0)/m:null;
  const line=(f,col)=>{g.strokeStyle=col;g.lineWidth=1.2;g.beginPath();let s=0;for(let i=0;i<n;i++){const y=f(off+i);if(y==null)continue;s?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y));s=1}g.stroke()};
  if(on.ma){line(k=>sm(k,50),"#6aa8ff");const e=ema(cl,12);line(k=>e[k],"#c58bff")}
  if(on.bb){const bd=(k,sg)=>{const m=sm(k,20);if(m==null)return null;return m+sg*2*Math.sqrt(cl.slice(k-19,k+1).reduce((a,b)=>a+(b-m)**2,0)/20)};line(k=>bd(k,1),"rgba(120,170,255,.75)");line(k=>bd(k,-1),"rgba(120,170,255,.75)")}}
 if(on.tl){const r=reg();[[0,"#ffb347",0],[1.5*r.sd,"rgba(255,179,71,.55)",1],[-1.5*r.sd,"rgba(255,179,71,.55)",1]].forEach(([d,col,dash])=>{g.strokeStyle=col;g.lineWidth=1.2;g.setLineDash(dash?[4,4]:[]);g.beginPath();g.moveTo(X(n-r.m),Y(r.ic+d));g.lineTo(X(n-1),Y(r.ic+r.sl*(r.m-1)+d));g.stroke()});g.setLineDash([])}
 if(!replayOn&&on.pv){const c=cs[cs.length-2],P=(c.h+c.l+c.c)/3,r=c.h-c.l;[[P,"P","#c8d2e6"],[2*P-c.l,"R1",(window.OnellaChartStyle?OnellaChartStyle.pc("#ff5d6c"):"#ff5d6c")],[2*P-c.h,"S1",(window.OnellaChartStyle?OnellaChartStyle.pc("#2ecc8f"):"#2ecc8f")],[P+r,"R2",(window.OnellaChartStyle?OnellaChartStyle.pc("#ff5d6c"):"#ff5d6c")],[P-r,"S2",(window.OnellaChartStyle?OnellaChartStyle.pc("#2ecc8f"):"#2ecc8f")]].forEach(([p,l,col])=>hl(g,Y,p,0,cw,col,l,1))}
 /* v1.2.2 — ابزارهای تازه (پالت مینیمال: هر ابزار رنگ ثابت خودش را دارد). */
 if(!replayOn&&(on.ema||on.vwap||on.donch||on.kelt)){
  const line2=(f,col,wd)=>{g.strokeStyle=col;g.lineWidth=wd||1.2;g.beginPath();let s=0;for(let i=0;i<n;i++){const y=f(off+i);if(y==null||!isFinite(y))continue;s?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y));s=1}g.stroke()};
  const cl2=cs.map(x=>x.c);
  if(on.ema){const e20=emaSeriesLocal(cl2,20),e50=emaSeriesLocal(cl2,50),e200=emaSeriesLocal(cl2,200);line2(k=>e20[k],"#7aa2d6");line2(k=>e50[k],"#a58fd6");line2(k=>e200[k],"#d6a55f");}
  if(on.vwap){const vw=vwapSeries(cs);if(vw)line2(k=>vw[k],"#5fb8a6");}
  if(on.donch){const dn=donchianSeries(cs,20);line2(k=>dn.u[k],"#8fa3b8");line2(k=>dn.l[k],"#8fa3b8");}
  if(on.kelt){const kl=keltnerSeries(cs,20,1.5);if(kl){line2(k=>kl.u[k],"#d6a55f");line2(k=>kl.l[k],"#d6a55f");}}
 }
 if(!replayOn&&on.super){const st=supertrendSeries(cs,10,3);if(st){for(let i=0;i<n;i++){const v=st[off+i];if(!v)continue;const nx2=st[off+i+1];g.strokeStyle=v.dir>0?"#2ecc8f":"#ff5d6c";g.lineWidth=1.4;g.beginPath();g.moveTo(X(i),Y(v.v));if(nx2&&i+1<n)g.lineTo(X(i+1),Y(nx2.v));else{g.lineTo(X(i)+3,Y(v.v));}g.stroke();}}}
 if(!replayOn&&on.sar){const sr=sarSeries(cs);if(sr){g.fillStyle="#ffb347";for(let i=0;i<n;i++){const v=sr[off+i];if(v==null||!isFinite(v))continue;g.beginPath();g.arc(X(i),Y(v),1.8,0,7);g.fill();}}}
 /* v1.9.0 — ایچیموکو (تنکان/کیجون + ابر) و روبان EMA (۹/۲۱/۵۵/۱۰۰/۲۰۰). */
 if(!replayOn&&on.ichi){const im=ichimokuSeries(cs);if(im){
  const line3=(arr,col,wd)=>{g.strokeStyle=col;g.lineWidth=wd||1.2;g.beginPath();let s=0;for(let i=0;i<n;i++){const y=arr[off+i];if(y==null||!isFinite(y))continue;s?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y));s=1}g.stroke()};
  /* ابر: بین سنکو A و B روی پنجرهٔ دیده‌شده؛ رنگ از آخرین مقدار. */
  let a0=-1,a1=-1;for(let i=0;i<n;i++){if(im.senA[off+i]!=null&&im.senB[off+i]!=null){if(a0<0)a0=i;a1=i}}
  if(a0>=0){const up=im.senA[off+a1]>im.senB[off+a1];g.fillStyle=up?"rgba(46,204,143,.07)":"rgba(255,93,108,.07)";g.beginPath();let s2=0;for(let i=a0;i<=a1;i++){const y=Y(im.senA[off+i]);s2?g.lineTo(X(i),y):g.moveTo(X(i),y);s2=1}for(let i=a1;i>=a0;i--)g.lineTo(X(i),Y(im.senB[off+i]));g.closePath();g.fill()}
  line3(im.tenkan,"#7aa2d6",1.2);line3(im.kijun,"#d6a55f",1.4);line3(im.senA,"rgba(122,162,214,.55)",1);line3(im.senB,"rgba(214,165,95,.55)",1);
  line3(im.chikou,"#8fa3b8",1);
 }}
 if(!replayOn&&on.ribbon){const rb=ribbonSeries(cs.map(x=>x.c));if(rb){const cols=["#7aa2d6","#a58fd6","#5fb8a6","#d6a55f","#d68a8a"];rb.forEach((arr,idx)=>{const col=cols[idx%cols.length];g.strokeStyle=col;g.lineWidth=1;g.beginPath();let s=0;for(let i=0;i<n;i++){const y=arr[off+i];if(y==null||!isFinite(y))continue;s?g.lineTo(X(i),Y(y)):g.moveTo(X(i),Y(y));s=1}g.stroke()});}}
 /* v1.9.0 — خط‌های هشدار فعال نماد فعلی (خط‌چین نارنجی + برچسب قیمت روی محور). */
 try{const AL=window.OnellaAlerts,sk=(window.pair&&window.pair.sym)||null;
  if(AL&&sk){AL.listActive(sk).forEach(function(a){let p=a.price;try{const m=window.__dispMul;if(a.mode==="iran"&&typeof m==="number"&&m>0&&m!==1)p=a.price/m}catch(_){ }
   const yy=Math.round(Y(p))+.5;if(yy<0||yy>ph)return;g.strokeStyle="#f06a15";g.lineWidth=1.2;g.setLineDash([5,3]);g.beginPath();g.moveTo(0,yy);g.lineTo(cw,yy);g.stroke();g.setLineDash([]);
   g.fillStyle="#f06a15";g.beginPath();if(g.roundRect)g.roundRect(cw+1,yy-8,W-cw-2,16,3);else g.rect(cw+1,yy-8,W-cw-2,16);g.fill();g.fillStyle="#0a0f1a";g.font="bold 10px sans-serif";try{g.fillText(fmt(p),cw+5,yy+3.5)}catch(_){}g.font="10px sans-serif";});}
 }catch(_){}
 onellaDrawAdvancedTools(g,{off,n,X,Y,cw});
}catch(e){}}
function toolNote(id){if(cs.length<60)return"";const a=analyzeCS(),l=a.l,nm=marketPairName(),pc=x=>(Math.abs(x-l)/l*100).toFixed(1)+"٪";
 if(id==="fib"){const s=swing(),lv=[.236,.382,.5,.618,.786].map(r=>[r,s.up?(window.OnellaChartStyle&&OnellaChartStyle.lerp?OnellaChartStyle.lerp:function(a,b,r){return a+(b-a)*r})(s.H,s.Lw,r):(window.OnellaChartStyle&&OnellaChartStyle.lerp?OnellaChartStyle.lerp:function(a,b,r){return a+(b-a)*r})(s.Lw,s.H,r)]),nr=lv.reduce((b,x)=>Math.abs(x[1]-l)<Math.abs(b[1]-l)?x:b),k=lv[3][1];
  return T("فیبوناچی "+nm+": موج "+(s.up?"صعودی":"نزولی")+" از "+fmt(s.up?s.Lw:s.H)+" تا "+fmt(s.up?s.H:s.Lw)+". قیمت نزدیک سطح "+nr[0]+" ("+fmt(nr[1])+") هست. سطوح کلیدی: 0.382 → "+fmt(lv[1][1])+"، 0.618 → "+fmt(k)+". "+(s.up?"تا وقتی اصلاح زیر "+fmt(k)+" نره، ساختار صعودی سالمه.":"تا وقتی پولبک بالای "+fmt(k)+" نره، ساختار نزولی سالمه."),
   "Fibonacci "+nm+": "+(s.up?"up":"down")+"swing from "+fmt(s.up?s.Lw:s.H)+" to "+fmt(s.up?s.H:s.Lw)+". Price is near the "+nr[0]+" level ("+fmt(nr[1])+"). Key levels: 0.382 → "+fmt(lv[1][1])+", 0.618 → "+fmt(k)+". "+(s.up?"The uptrend stays intact while pullbacks hold above "+fmt(k)+".":"The downtrend stays intact while bounces fail below "+fmt(k)+"."))}
 if(id==="sr")return T("حمایت و مقاومت: نزدیک‌ترین مقاومت "+fmt(a.R1)+" ("+pc(a.R1)+" بالاتر) و بعدی "+fmt(a.R2)+"؛ نزدیک‌ترین حمایت "+fmt(a.S1)+" ("+pc(a.S1)+" پایین‌تر) و بعدی "+fmt(a.S2)+".","Support/Resistance: nearest resistance "+fmt(a.R1)+" ("+pc(a.R1)+" above), next "+fmt(a.R2)+"; nearest support "+fmt(a.S1)+" ("+pc(a.S1)+" below), next "+fmt(a.S2)+".");
 if(id==="ma"){const u=a.s50?a.s20>a.s50:a.l>a.s20;return T("میانگین متحرک: قیمت "+(l>a.s20?"بالای":"زیر")+" میانگین ۲۰ ("+fmt(a.s20)+")"+(a.s50?" و "+(l>a.s50?"بالای":"زیر")+" میانگین ۵۰ ("+fmt(a.s50)+")":"")+"؛ میانگین ۲۰ "+(u?"بالای":"زیر")+" ۵۰ است که یعنی روند "+(u?"صعودی":"نزولی")+".","Moving averages: price is "+(l>a.s20?"above":"below")+" SMA20 ("+fmt(a.s20)+")"+(a.s50?" and "+(l>a.s50?"above":"below")+" SMA50 ("+fmt(a.s50)+")":"")+"; SMA20 is "+(u?"above":"below")+" SMA50, so the trend is "+(u?"up":"down")+".")}
 if(id==="bb")return T("بولینگر: قیمت "+(a.pb>1?"بالای باند بالایی (کشیدگی صعودی)":a.pb<0?"زیر باند پایینی (کشیدگی نزولی)":a.pb>.8?"نزدیک باند بالا":a.pb<.2?"نزدیک باند پایین":"وسط باند")+"؛ عرض باند "+(a.bw*100).toFixed(1)+"٪ "+(a.bw<.06?"و فشرده است (احتمال حرکت شدید بعدی).":"."),"Bollinger: price is "+(a.pb>1?"above the upper band (stretched up)":a.pb<0?"below the lower band (stretched down)":a.pb>.8?"near the upper band":a.pb<.2?"near the lower band":"mid-band")+"; band width "+(a.bw*100).toFixed(1)+"%"+(a.bw<.06?", squeezed (a sharp move may follow).":"."));
 if(id==="tl"){const r=reg(),z=(l-(r.ic+r.sl*(r.m-1)))/r.sd,s=(r.sl/l*100).toFixed(2);return T("خط روند (رگرسیون): شیب "+(r.sl>0?"صعودی":"نزولی")+" حدود "+s+"٪ در هر کندل؛ قیمت "+(z>1.5?"بالای کانال (کشیدگی)":z<-1.5?"زیر کانال (کشیدگی)":"داخل کانال، در نیمه "+(z>0?"بالا":"پایین"))+".","Trendline (regression): "+(r.sl>0?"up":"down")+"slope of about "+s+"% per candle; price is "+(z>1.5?"above the channel (stretched)":z<-1.5?"below the channel (stretched)":"inside the channel, "+(z>0?"upper":"lower")+" half")+".")}
 if(id==="pv"){const c=cs[cs.length-2],P=(c.h+c.l+c.c)/3,r=c.h-c.l;return T("پیوت پوینت (از کندل قبل): P "+fmt(P)+"، R1 "+fmt(2*P-c.l)+"، S1 "+fmt(2*P-c.h)+"، R2 "+fmt(P+r)+"، S2 "+fmt(P-r)+". قیمت "+(l>P?"بالای":"زیر")+" پیوته، پس گرایش کوتاه‌مدت "+(l>P?"صعودیه":"نزولیه")+".","Pivot points (prev. candle): P "+fmt(P)+", R1 "+fmt(2*P-c.l)+", S1 "+fmt(2*P-c.h)+", R2 "+fmt(P+r)+", S2 "+fmt(P-r)+". Price is "+(l>P?"above":"below")+" the pivot, so short-term bias is "+(l>P?"up":"down")+".")}
 /* v1.2.2 — خوانش ابزارهای تازه. */
 if(id==="ema"){const cl=cs.map(x=>x.c),e20=emaSeriesLocal(cl,20),e50=emaSeriesLocal(cl,50),e200=emaSeriesLocal(cl,200);
  const v20=e20[e20.length-1],v50=e50[e50.length-1],v200=e200.length?e200[e200.length-1]:null;
  return T("میانگین نمایی: EMA20 "+fmt(v20)+"، EMA50 "+fmt(v50)+(v200!=null?"، EMA200 "+fmt(v200):"")+". قیمت "+(l>v20?"بالای":"زیر")+" EMA20 است و EMA20 "+(v20>v50?"بالای":"زیر")+" EMA50 — یعنی روند کوتاه‌مدت "+(v20>v50?"صعودی":"نزولی")+".",
   "EMA: EMA20 "+fmt(v20)+", EMA50 "+fmt(v50)+(v200!=null?", EMA200 "+fmt(v200):"")+". Price is "+(l>v20?"above":"below")+" EMA20 and EMA20 is "+(v20>v50?"above":"below")+" EMA50, so the short-term trend is "+(v20>v50?"up":"down")+".")}
 if(id==="vwap"){const vw=vwapSeries(cs);if(!vw)return T("برای این بازار حجم متمرکز نیست؛ VWAP حساب نمی‌شود.","No centralised volume for this market; VWAP cannot be computed.");
  const v=vw[vw.length-1];
  return T("وی‌واپ: "+fmt(v)+". قیمت "+(l>v?"بالای":"زیر")+" VWAP است"+(l>v?" (فشار خرید بیشتر بوده).":" (فشار فروش بیشتر بوده)."),
   "VWAP: "+fmt(v)+". Price is "+(l>v?"above":"below")+" VWAP"+(l>v?" (buying pressure dominated).":" (selling pressure dominated)."));}
 if(id==="donch"){const dn=donchianSeries(cs,20),u=dn.u[dn.u.length-1],lw=dn.l[dn.l.length-1],pos=(u>lw)?((l-lw)/(u-lw)*100):null;
  return T("دونچیان (۲۰): سقف کانال "+fmt(u)+"، کف کانال "+fmt(lw)+"؛ قیمت در "+(pos==null?"—":pos.toFixed(0)+"٪")+" کانال است"+(pos!=null&&pos>80?" (نزدیک سقف).":pos!=null&&pos<20?" (نزدیک کف).":"."),
   "Donchian (20): channel high "+fmt(u)+", low "+fmt(lw)+"; price is at "+(pos==null?"—":pos.toFixed(0)+"%")+" of the channel"+(pos!=null&&pos>80?" (near the top).":pos!=null&&pos<20?" (near the bottom).":"."));}
 if(id==="kelt"){const kl=keltnerSeries(cs,20,1.5);if(!kl)return"";
  const u=kl.u[kl.u.length-1],lw=kl.l[kl.l.length-1];
  return T("کلتنر (EMA20 ± ۱٫۵×ATR): باند بالا "+fmt(u)+"، باند پایین "+fmt(lw)+"؛ قیمت "+(l>u?"بالای باند بالا (کشیدگی صعودی)":l<lw?"زیر باند پایین (کشیدگی نزولی)":"داخل باند")+".",
   "Keltner (EMA20 ± 1.5×ATR): upper "+fmt(u)+", lower "+fmt(lw)+"; price is "+(l>u?"above the upper band (stretched up)":l<lw?"below the lower band (stretched down)":"inside the bands")+".");}
 if(id==="super"){const st=supertrendSeries(cs,10,3);if(!st)return"";
  const v=st[st.length-1];
  return T("سوپرترند (۱۰، ۳): خط "+fmt(v.v)+" — روند "+(v.dir>0?"صعودی":"نزولی")+" است؛ تا وقتی قیمت "+(v.dir>0?"بالای":"زیر")+" خط بماند، روند همین است.",
   "Supertrend (10, 3): line at "+fmt(v.v)+" — trend is "+(v.dir>0?"up":"down")+"; while price stays "+(v.dir>0?"above":"below")+" the line, the trend holds.");}
 if(id==="sar"){const sr=sarSeries(cs);if(!sr)return"";
  const v=sr[sr.length-1],above=l>v;
  return T("پارابولیک SAR: نقطهٔ آخر "+fmt(v)+" — قیمت "+(above?"بالای نقطه‌هاست (روند صعودی)":"زیر نقطه‌هاست (روند نزولی)")+".","Parabolic SAR: last dot "+fmt(v)+" — price is "+(above?"above the dots (uptrend)":"below the dots (downtrend)")+".");}
 /* v1.9.0 — خوانش ایچیموکو و روبان. */
 if(id==="ichi"){const im=ichimokuSeries(cs);if(!im)return"";
  const tk=im.tenkan[im.tenkan.length-1],kj=im.kijun[im.kijun.length-1],sa=im.senA[im.senA.length-1],sb=im.senB[im.senB.length-1];
  if(tk==null||kj==null)return"";
  const cloudUp=sa!=null&&sb!=null&&sa>sb;
  return T("ایچیموکو: تنکان "+fmt(tk)+"، کیجون "+fmt(kj)+"؛ قیمت "+(l>tk?"بالای":"زیر")+" تنکان است و تنکان "+(tk>kj?"بالای":"زیر")+" کیجون — "+(tk>kj?"گرایش کوتاه‌مدت صعودی":"گرایش کوتاه‌مدت نزولی")+(sa!=null&&sb!=null?("؛ ابر جلو "+(cloudUp?"صعودی":"نزولی")+" است ("+fmt(Math.max(sa,sb))+" تا "+fmt(Math.min(sa,sb))+")."):"؛ ابر هنوز کامل نیست."),
   "Ichimoku: Tenkan "+fmt(tk)+", Kijun "+fmt(kj)+"; price is "+(l>tk?"above":"below")+" Tenkan and Tenkan is "+(tk>kj?"above":"below")+" Kijun — short-term bias is "+(tk>kj?"up":"down")+(sa!=null&&sb!=null?("; the cloud ahead is "+(cloudUp?"bullish":"bearish")+" ("+fmt(Math.max(sa,sb))+" to "+fmt(Math.min(sa,sb))+")."):"; the cloud is not complete yet."));}
 if(id==="ribbon"){const rb=ribbonSeries(cs.map(x=>x.c));if(!rb)return"";
  const vals=rb.map(function(arr){return arr[arr.length-1];});
  if(vals.some(function(v){return v==null;}))return"";
  const ordered=vals[0]>vals[1]&&vals[1]>vals[2]&&vals[2]>vals[3]&&vals[3]>vals[4];
  const orderedDn=vals[0]<vals[1]&&vals[1]<vals[2]&&vals[2]<vals[3]&&vals[3]<vals[4];
  return T("روبان EMA (۹/۲۱/۵۵/۱۰۰/۲۰۰): "+vals.map(fmt).join("، ")+" — "+(ordered?"میانگین‌ها مرتب صعودی‌اند (روند صعودی منظم).":orderedDn?"میانگین‌ها مرتب نزولی‌اند (روند نزولی منظم).":"میانگین‌ها درهم‌اند (روند مشخص نیست)."),
   "EMA ribbon (9/21/55/100/200): "+vals.map(fmt).join(", ")+" — "+(ordered?"the averages are stacked bullishly (clean uptrend).":orderedDn?"the averages are stacked bearishly (clean downtrend).":"the averages are tangled (no clear trend)."));}
 return""}
