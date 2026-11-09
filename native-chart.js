/* js/01-09-native-chart.js — چارت بومی: head، draw (پایه)، loadNative، setMode، انتخاب‌گر جفت‌ارز  [مرحله ۳ ریفکتور: خطوط 372–414 از 01-inline.js قبلی؛ بدنه بایت‌به‌بایت همان است] */
/* Mini App: در اپ، cs/cur/pair/tf سراسری‌اند؛ در مینی‌اپ روی window هستند —
   این نگاشت، همان نام‌ها را به window وصل می‌کند تا بقیهٔ فایل دست‌نخورده بماند. */
/* Mini App: $ و T و پرچم‌های اپ در app.js تعریف شده‌اند؛ اگر هنوز نبودند، shim می‌سازد. */
if (typeof window.$ !== 'function') window.$ = function (id) { return document.getElementById(id); };
var $ = window.$;
if (typeof window.T !== 'function') window.T = function (fa, en) { return fa; };
var T = window.T;
if (typeof window.nInit === 'undefined') window.nInit = false;
var nInit = window.nInit;
if (typeof window.demo === 'undefined') window.demo = false;
var demo = window.demo;
if (typeof window.tvOn === 'undefined') window.tvOn = false;
var tvOn = window.tvOn;
if (typeof window.tvInit === 'undefined') window.tvInit = false;
var tvInit = window.tvInit;
/* Mini App: varهای top-level در مرورگر property روی window می‌شوند؛ پس نمی‌توان
   همان نام را دوباره با defineProperty تعریف کرد (setter خودش را صدا می‌زند).
   به‌جای آن، مقدار در متغیر داخلی _cs/_cur/_pair/_tf می‌ماند و window.* به آن وصل است.
   بقیهٔ فایل به همان نام‌های cs/cur/pair/tf دسترسی دارد — ولی آن‌ها varهای محلی‌اند،
   پس باید به _cs/_cur/_pair/_tf نگاشت شوند: این کار را با varهای هم‌نام انجام می‌دهیم
   که به متغیر داخلی ارجاع می‌دهند — نه، ساده‌تر: خود varها همان داخلی‌ها هستند و
   window.* فقط getter/setter به آن‌هاست — ولی var top-level = window property است،
   پس defineProperty روی همان نام، var را هم redefine می‌کند. راه‌حل نهایی: اصلاً
   defineProperty نکن؛ app.js مستقیم به varهای سراسری (cs/cur/pair/tf) دسترسی دارد،
   چون اسکریپت‌ها در یک global scope اجرا می‌شوند. فقط مقدار اولیه را از window بخوان. */
var cs = window.cs || [], cur = (typeof window.cur === 'number' ? window.cur : -1),
    pair = window.pair || { sym: 'BTCUSDT', base: 'BTC', kind: 'crypto' },
    tf = window.tf || '1h';
/* مرحله ۱۴: برچسب وضعیت داده‌ی چارت. offline (کش مرورگر) ← «ذخیره‌شده»؛ stale از درگاه ← «کهنه + سن داده»؛ تازه ← هیچ.
   داده‌ی کهنه هرگز «زنده» نشان داده نمی‌شود. */
function dataStateBadge(x){
  x=x||window.__onellaDataState; if(!x) return "";
  /* ۵۸-ب: نماد سبک Yahoo با نماینده‌ی ETF پاسخ داده شده؛ قیمت/مقیاس با خود شاخص یکی نیست */
  var pxy=(x.proxy===true&&x.proxyFor)?" <span title='"+T("قیمت نماینده‌ی ETF است، نه خود شاخص/قرارداد","Priced via an ETF proxy, not the index/contract itself")+"' style='color:#7cc4ff'>· "+T("نماینده","proxy")+" "+String(x.proxyFor).replace(/[^A-Za-z0-9.\-]/g,"")+"</span>":"";
  if(x.offline) return pxy+" <span style='color:#ffb347'>· ذخیره‌شده</span>";
  if(pxy&&!(x.stale===true||x.dataFreshness==="stale")) return pxy;
  if(x.offline) return " <span style='color:#ffb347'>· ذخیره‌شده</span>";
  if(x.stale===true||x.dataFreshness==="stale"){
    var t=Date.parse(x.fetchedAt||""),m=isFinite(t)?Math.max(0,Math.round((Date.now()-t)/60000)):null;
    return pxy+" <span style='color:#ffb347'>· "+T("کهنه","stale")+(m!==null&&m>=1?" "+(m<120?m+T(" دقیقه"," min"):Math.round(m/60)+T(" ساعت"," h")):"")+"</span>";
  }
  return "";
}
/* v1.6.0 — نمایش قیمت چارت با ضریب ارز: در حالت تومان، قیمت‌های نمایشی چارت
   (سربرگ، محور، برچسب قیمت آخر، جعبهٔ OHLC) همان کندل‌های دلاری × نرخ تومان‌اند؛
   حجم و درصد تغییر دست‌نخورده می‌مانند. ضریب را app.js می‌گذارد (window.__dispMul). */
function pfmt(p){var m=window.__dispMul; m=(typeof m==='number'&&isFinite(m)&&m>0)?m:1; return fmt(p*m);}
window.__pfmt=pfmt;
function head(){if(!cs.length)return;const W=$("cc").clientWidth,stH=((window.__ov||{}).st||7),sourceEnd=(window.onellaReplay&&window.onellaReplay.active)?Math.max(1,Math.min(window.onellaReplay.end,cs.length)):cs.length,source=cs.slice(0,sourceEnd),n=Math.min(source.length,Math.floor((W-((window.__geo&&window.__geo.pw)||46))/stH)),i=cur>=0&&cur<n?source.length-n+cur:source.length-1,c=source[i],p=source[i-1]||c,ch=(c.c-p.c)/p.c*100;
 $("px").innerHTML=marketPairName()+"<b>"+pfmt(c.c)+"</b><span style='color:"+(window.OnellaChartStyle&&OnellaChartStyle.pc?OnellaChartStyle.pc(ch>=0?"#2ecc8f":"#ff5d6c"):(ch>=0?"#2ecc8f":"#ff5d6c"))+"'>"+(ch>=0?"+":"")+ch.toFixed(2)+"%</span>"+dataStateBadge();
 /* v1.3.0 — جعبهٔ OHLC کراس‌هیر (مرحله ۱): فقط وقتی کراس‌هیر فعال است (cur>=0)؛
    وگرنه پنهان. MA20 همان میانگین ۲۰ خط MA روی چارت است؛ Vol فقط وقتی عدد دارد. */
 try{var xb=$("xhBox");if(xb){
   if(cur>=0&&cur<n&&window.__xhIdx!==i){
     window.__xhIdx=i;
     var ma20=null;if(i>=19){var s20=0;for(var j=i-19;j<=i;j++)s20+=source[j].c;ma20=s20/20}
     xb.innerHTML='<span>O <b>'+pfmt(c.o)+'</b></span> <span>H <b>'+pfmt(c.h)+'</b></span> <span>L <b>'+pfmt(c.l)+'</b></span> <span>C <b>'+pfmt(c.c)+'</b></span> <span style="color:'+(ch>=0?'#2ecc8f':'#ff5d6c')+'">'+(ch>=0?'+':'')+ch.toFixed(2)+'%</span>'+(typeof c.v==='number'?' <span>Vol <b>'+fmt(c.v)+'</b></span>':'')+(ma20!=null?' <span>MA20 <b>'+pfmt(ma20)+'</b></span>':'');
     xb.style.display='';
     /* v1.9.1 — جعبه سمتِ مخالفِ نشانگر می‌نشیند (زیر انگشت نمی‌ماند)؛ اگر نوار
        ابزار باز است، از جلوی آن کنار می‌رود. */
     var vx=cur*stH+stH/2, stEl=$('toolsStrip'), stripOpen=!!(stEl&&stEl.classList&&stEl.classList.contains&&stEl.classList.contains('open'));
     if(vx>W/2){xb.style.left=stripOpen?'60px':'10px';xb.style.right='auto';}else{xb.style.right='8px';xb.style.left='auto';}
   }else if(!(cur>=0&&cur<n)){window.__xhIdx=-1;xb.style.display='none';}
 }}catch(e){}}
function draw(){const cv=$("cc");if(!cv.clientWidth||!cv.clientHeight)return;const D=Math.min(devicePixelRatio||1,2),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*D;cv.height=H*D;const g=cv.getContext("2d");g.setTransform(D,0,0,D,0,0);
 if(!cs.length)return;
 const CS=window.OnellaChartStyle,pw=CS.pw(g,cs),cw=W-pw,st=((window.__ov||{}).st||7),sourceEnd=Math.max(1,((window.onellaReplay&&window.onellaReplay.active)?Math.max(1,Math.min(window.onellaReplay.end,cs.length)):cs.length)-Math.round((window.__ov||{}).pan||0)),source=cs.slice(0,sourceEnd),n=Math.min(source.length,Math.floor(cw/st)),v=source.slice(-n),off=sourceEnd-n;
 let hi=-1e99,lo=1e99,vm=1e-9;v.forEach(c=>{hi=Math.max(hi,c.h);lo=Math.min(lo,c.l);vm=Math.max(vm,c.v)});
 /* v1.169: مقیاس مقاوم — محور از صدک ۲/۹۸ سایه‌ها و کل بدنه‌ها ساخته می‌شود و سایهٔ بیرون‌زده فقط در نمایش به همان حد کوتاه می‌شود (داده‌ی cs دست‌نخورده) */
 if(CS.get().rob&&v.length>=12){const hs=v.map(c=>c.h).sort((x,y)=>x-y),ls=v.map(c=>c.l).sort((x,y)=>x-y),q=a=>Math.min(v.length-1,Math.max(0,Math.round(a*(v.length-1)))),bt=Math.max.apply(null,v.map(c=>Math.max(c.o,c.c))),bb=Math.min.apply(null,v.map(c=>Math.min(c.o,c.c))),H=Math.max(hs[q(.98)],bt),L=Math.min(ls[q(.02)],bb);if(H<hi||L>lo){hi=H;lo=L;v.forEach((c,i)=>{if(c.h>H||c.l<L)v[i]=Object.assign({},c,{h:Math.min(c.h,H),l:Math.max(c.l,L)})})}}
 /* v1.169: بازار بسته/آرام (غیرکریپتو) — محور قیمت حداقل ۰٫۰۱۵٪ قیمت باز می‌ماند تا نویز چند سنتی تمام چارت را پر نکند */
 if(pair.kind!=='crypto'&&hi>lo){const mid=(hi+lo)/2,ms=mid*0.00015;if(hi-lo<ms){hi=mid+ms/2;lo=mid-ms/2}}
 const _cs0=CS.get(),LGon=!!_cs0.log&&lo>0,pd=LGon?(Math.log(hi/lo)*.06||.01):((hi-lo)*.06||1);if(LGon){hi*=Math.exp(pd);lo/=Math.exp(pd)}else{hi+=pd;lo-=pd}{const _o=window.__ov||{},_m=_o.pm;if(_m&&_m.hi>_m.lo){if(!_cs0.lock&&(_m.lo>hi||_m.hi<lo))_o.pm=null;else{hi=_m.hi;lo=_m.lo}}}const LG=LGon&&lo>0,lgH=LG?Math.log(hi):0,lgL=LG?Math.log(lo):0,ph=H-16,vh=ph*.16,Y=LG?(p=>(lgH-Math.log(Math.max(p,1e-12)))/(lgH-lgL)*(ph-vh)):(p=>(hi-p)/(hi-lo)*(ph-vh)),inv=LG?(y=>Math.exp(lgH-y/(ph-vh)*(lgH-lgL))):(y=>hi-y/(ph-vh)*(hi-lo)),X=i=>i*st+st/2;window.__geo={hi:hi,lo:lo,ph:ph,vh:vh,st:st,off:off,pw:pw,W:W,H:H,Y:Y,inv:inv,log:LG,sel:cur};const lastC=cs[(((window.onellaReplay&&window.onellaReplay.active)?Math.max(1,Math.min(window.onellaReplay.end,cs.length)):cs.length))-1],K={log:LG,inv:inv,v:v,off:off,n:n,X:X,Y:Y,st:st,cw:cw,pw:pw,W:W,H:H,ph:ph,vh:vh,vm:vm,hi:hi,lo:lo,cs:cs,last:lastC,ref:v[0].c};
 CS.axisBack(g,K);


 g.save();g.beginPath();g.rect(0,0,cw,ph);g.clip();
 CS.paint(g,K);
 if(CS.get().ma){g.strokeStyle="#ffb347";g.lineWidth=1.2;g.beginPath();let s=false;
 for(let i=0;i<n;i++){const k=off+i;if(k<19)continue;let a=0;for(let j=k-19;j<=k;j++)a+=cs[j].c;a/=20;s?g.lineTo(X(i),Y(a)):g.moveTo(X(i),Y(a));s=true}g.stroke();}
 g.restore();CS.axisFront(g,K);
 drawTools(g,{v,off,n,X,Y,cw});
 /* v1.4.0 — رسم‌های کاربر (chart-draw.js): با همان پنجرهٔ دیده‌شده؛ بر اساس زمان کندل، نه ایندکس */
 try{if(window.OnellaDraw)window.OnellaDraw.draw(g,{v:v,off:off,n:n,X:X,Y:Y,cw:cw,ph:ph,W:W});}catch(e){}
 if(cur>=0&&cur<n){g.strokeStyle="rgba(200,215,240,.4)";g.lineWidth=1;g.beginPath();g.moveTo(X(cur),0);g.lineTo(X(cur),ph);g.stroke();
  /* v1.3.0 — خط افقی کراس‌هیر روی قیمتِ زیر نشانگر (خط‌چین؛ خط قیمت آخرِ
     axisFront سر جایش می‌ماند و برچسب محور را #lastPxTag نشان می‌دهد).
     v1.9.1 — قیمت از window.__xhPrice می‌آید (آهنربای نرم/آزاد)؛ اگر نیست، بستهٔ کندل. */
  g.save();g.setLineDash([4,4]);g.strokeStyle="rgba(200,215,240,.35)";g.beginPath();var _xp=(typeof window.__xhPrice==='number'&&isFinite(window.__xhPrice))?window.__xhPrice:v[cur].c;g.moveTo(0,Math.round(Y(_xp))+.5);g.lineTo(cw,Math.round(Y(_xp))+.5);g.stroke();g.restore();}
 /* v1.3.0 — پنل‌های RSI/MACD (chart-panes.js) با همان پنجرهٔ دیده‌شده رسم می‌شوند */
 try{if(window.drawPanes)window.drawPanes()}catch(e){}}
let __onellaLoadSeq=0;
async function loadNative(){const __seq=++__onellaLoadSeq;const __requestedSym=pair.sym,__requestedTF=tf;nInit=true;cs=[];try{window.__ov.pm=null;window.__ov.pan=0}catch(_){}try{if(window.OnellaDraw)window.OnellaDraw.resetSession();}catch(_){}draw();$("px").textContent="...";const x=await candlesFor();if(__seq!==__onellaLoadSeq||pair.sym!==__requestedSym||tf!==__requestedTF)return;cs=x.d||[];demo=false;window.__onellaDataState=x;cur=-1;
 if(window.OnellaLiveSeconds&&window.OnellaLiveSeconds.isSub(tf)){try{window.__onellaLastSub={tf:tf,sym:pair.sym,x:x}}catch(_){}}
 if(!cs.length&&window.OnellaLiveSeconds&&window.OnellaLiveSeconds.isSub(tf)){$("px").textContent=window.OnellaLiveSeconds.emptyMsg(x)}
  else if(!cs.length){$("px").textContent=T("داده زنده در دسترس نیست؛ برای تحلیل چارت به اینترنت وصل شو.","Live chart data is unavailable; connect to the internet to load the chart.")+(x&&x.error?" ["+String(x.error).replace(/\s+/g," ").slice(0,140)+"]":"")+(x&&x.detail?" — "+String(x.detail).replace(/\s+/g," ").slice(0,260):"");}
 else {head();if(x.offline){$("px").innerHTML=marketPairName()+" <b>"+pfmt(cs.at(-1).c)+"</b><span style=\"color:#ffb347\"> · آخرین داده ذخیره‌شده</span>"}}
 draw()}
/* Mini App: loadChart (TradingView) حذف شد — فقط چارت بومی */
/* Mini App: setMode و سیم‌کشی دکمه‌های اپ (#seg/#tfs/#tvt) حذف شد — تایم‌فریم از تب چارت می‌آید */
/* Mini App: rl() (انتخاب‌گر جفت‌ارز اپ) حذف شد — نماد از کاتولوگ مینی‌اپ می‌آید */
