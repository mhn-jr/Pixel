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
 return""}
