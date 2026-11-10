/* js/01-08c-chart-style.js — موتور نمایش چارت (مرحله‌ی ۱ ارتقای چارت؛ قبل از 01-09 بارگذاری می‌شود)
   OnellaChartStyle: انواع چارت (کندل/توخالی/بار/هیکین‌آشی/خطی/ناحیه‌ای)، شبکه‌ی «اعداد گرد»، برچسب‌های زمان هوشمند،
   خط و برچسب قیمت زنده، مقیاس درصدی، عرض پویای محور قیمت، و پنل تنظیمات نمایش (دکمه‌ی روی چارت).
   هندسه (window.__geo) و تمام لایه‌های روی چارت بدون تغییرند؛ فقط draw() پایه از این ماژول رسم می‌کند. */
(function(){
  var KEY='onella_chart_style_v1',D={type:'candle',vol:1,ma:1,grid:1,last:1,pct:0,log:0,lock:0,rob:0,cd:1,pal:'def'},S={};
  for(var k in D)S[k]=D[k];
  try{var r=JSON.parse(localStorage.getItem(KEY)||'null');if(r)for(var k2 in D)if(r[k2]!==undefined)S[k2]=r[k2]}catch(_){}
  var TYPES=[['candle','🕯','کندل','Candles'],['hollow','▯','توخالی','Hollow'],['bars','⊢','بار OHLC','OHLC'],['ha','HA','هیکین‌آشی','Heikin Ashi'],['line','〰','خطی','Line'],['area','◢','ناحیه‌ای','Area']];
  var UP='#2ecc8f',DN='#ff5d6c',LN='#5aa9ff';
  /* v1.68: پالت رنگ کندل‌ها [صعودی، نزولی] */
  var PALS={def:['#2ecc8f','#ff5d6c','پیش‌فرض','Default'],tv:['#26a69a','#ef5350','فیروزه‌ای/قرمز','Teal/Red'],cb:['#3b82f6','#f59e0b','کم‌بینایی رنگ','Colorblind'],rv:['#ef5350','#3b82f6','معکوس (آسیایی)','Reversed'],mono:['#e6e9ef','#6b7280','تک‌رنگ','Mono']};
  function applyPal(){var q=PALS[S.pal]||PALS.def;UP=q[0];DN=q[1]}
  applyPal();
  /* v1.69: نگاشت رنگ‌های سبز/قرمز ثابتِ بقیه‌ی لایه‌ها به پالت انتخاب‌شده؛ پالت پیش‌فرض ⇒ همان رنگ ورودی */
  var PG=['#2ecc8f','#3ddc97','#1fbf75'],PR=['#ff5d6c','#e5484d'];
  function pc(c){if(!S.pal||S.pal==='def'||typeof c!=='string')return c;var l=c.toLowerCase();return PG.indexOf(l)>=0?UP:PR.indexOf(l)>=0?DN:c}
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function tt(a,b){try{return typeof T==='function'?T(a,b):a}catch(_){return a}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(_){}}
  function redraw(){try{if(typeof window.draw==='function')window.draw()}catch(_){}}

  /* ---- هیکین‌آشی (کش بر اساس آخرین کندل) ---- */
  var hc={key:'',a:[]};
  function ha(cs){var n=cs.length,l=cs[n-1]||{},key=n+'|'+(cs[0]&&cs[0].t)+'|'+l.o+'|'+l.h+'|'+l.l+'|'+l.c;
    if(hc.key===key)return hc.a;
    var a=new Array(n),po=0,pc=0,i,c,cl,op;
    for(i=0;i<n;i++){c=cs[i];cl=(c.o+c.h+c.l+c.c)/4;op=i?(po+pc)/2:(c.o+c.c)/2;
      a[i]={o:op,c:cl,h:Math.max(c.h,op,cl),l:Math.min(c.l,op,cl),v:c.v,t:c.t};po=op;pc=cl}
    hc.key=key;hc.a=a;return a}

  /* ---- شبکه‌ی قیمت با گام «گرد» ---- */
  function niceStep(span,maxN){var raw=span/maxN,mag=Math.pow(10,Math.floor(Math.log10(raw))),q=raw/mag;
    return (q<=1?1:q<=2?2:q<=5?5:10)*mag}
  function fmtTick(p,step){var d=step>=1?0:Math.min(8,Math.max(0,-Math.floor(Math.log10(step)+1e-9)));
    return p.toLocaleString('en',{minimumFractionDigits:d,maximumFractionDigits:d})}
  function lastFmt(p){try{return typeof fmt==='function'?fmt(p):String(p)}catch(_){return String(p)}}
  /* v1.6.0 — ضریب نمایش ارز (window.__dispMul؛ ۱ = دلار، نرخ تومان در حالت تومان):
     برچسب‌های محور قیمت و برچسب قیمت زنده با همین ضریب نشان داده می‌شوند؛
     حالت درصدی (pct) واحد ندارد و دست‌نخورده می‌ماند. */
  function dmul(){var m=window.__dispMul;return (typeof m==='number'&&isFinite(m)&&m>0)?m:1}
  function dTick(p,step){var m=dmul();return fmtTick(p*m,step*m)}
  function dLast(p){return lastFmt(p*dmul())}

  /* ---- عرض پویای محور قیمت (حداقل ۴۶؛ لایه‌ها همه G.pw می‌خوانند) ---- */
  function pw(g,cs){var l=cs&&cs.length?cs[cs.length-1].c:0;g.font='10px sans-serif';
    var w=Math.max(g.measureText(dLast(l*1.0001)).width,g.measureText(dLast(l)+'0').width);
    return Math.max(46,Math.min(120,Math.ceil(w)+14))}

  /* ---- برچسب‌های محور زمان ---- */
  /* ===== v1.68: OnellaDate — تاریخ/ساعت بر پایه‌ی تنظیمات سیستم (زبان، منطقه‌ی زمانی، تقویم، ۱۲/۲۴ ساعته)؛ انتخاب دستی: میلادی/شمسی/قمری ===== */
  /* v1.14.7 — منطقهٔ زمانیِ انتخاب‌شده (پیش‌فرض UTC، قانون این خط؛ نه System):
     همهٔ نمایش‌های زمان (محور چارت، ساعت، خبر، هشدار) از همین زون می‌آیند —
     epoch همیشه UTC می‌ماند و فقط نمایش با Intl و timeZone تبدیل می‌شود. */
  var DK='onella_date_v1',DP={cal:'auto',tz:'UTC'},DCAL={gregory:'gregory',persian:'persian',islamic:'islamic-umalqura'},dcache={},fcache={};
  function validTZ(z){if(z==='UTC')return true;if(typeof z!=='string'||!z)return false;try{Intl.DateTimeFormat('en',{timeZone:z});return true}catch(_){return false}}
  try{var dr=JSON.parse(localStorage.getItem(DK)||'null');if(dr&&(dr.cal==='auto'||DCAL[dr.cal]))DP.cal=dr.cal;if(dr&&validTZ(dr.tz))DP.tz=dr.tz}catch(_){}
  function effTZ(){return validTZ(DP.tz)?DP.tz:'UTC'}
  /* افست زون نسبت به UTC در یک لحظه، به میلی‌ثانیه (با DST همان لحظه). */
  function tzOffMs(ms){if(effTZ()==='UTC')return 0;
    try{var f=new Intl.DateTimeFormat('en-US',{timeZone:effTZ(),hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}),o={};
      f.formatToParts(new Date(ms)).forEach(function(x){o[x.type]=x.value});
      return Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute,+o.second)-ms}catch(_){return 0}}
  function tzWall(ms){return ms+tzOffMs(ms)}
  function sysLoc(){try{var s=String((navigator.languages&&navigator.languages[0])||navigator.language||'en').split('-u-')[0].split('@')[0].split('.')[0].replace(/_/g,'-');Intl.getCanonicalLocales(s);return s||'en'}catch(_){return 'en'}}
  function sysCal(){try{return new Intl.DateTimeFormat(sysLoc()).resolvedOptions().calendar||'gregory'}catch(_){return 'gregory'}}
  function sysTZ(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(_){return ''}}
  function effCal(){return DP.cal==='auto'?sysCal():DCAL[DP.cal]}
  function dispLoc(){var b=sysLoc(),l=b.slice(0,2).toLowerCase();
    if(DP.cal==='auto')return b;
    if(DP.cal==='gregory')return b+'-u-ca-gregory';
    if(DP.cal==='persian')return (l==='fa'?b:'fa-IR')+'-u-ca-persian';
    return (l==='ar'||l==='fa'?b:'en')+'-u-ca-islamic-umalqura'}
  var FO={m:{month:'short'},md:{month:'short',day:'numeric'},y:{year:'numeric'},hm:{hour:'2-digit',minute:'2-digit',hourCycle:'h23'},hms:{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'},
    cd:{year:'numeric',month:'short',day:'numeric'},ct:{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'},
    full:{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}};
  function dfmt(ms,kind){try{var L=dispLoc(),tz=effTZ(),key=kind+'|'+L+'|'+tz,f=fcache[key]||(fcache[key]=new Intl.DateTimeFormat(L,Object.assign({},FO[kind],{timeZone:tz})));return f.format(ms)}catch(_){return new Date(ms).toLocaleString()}}
  function dparts(ms){var k=Math.floor(tzWall(ms)/864e5),r=dcache[k];if(r)return r;
    try{var c=effCal(),tz=effTZ(),f=fcache['p|'+c+'|'+tz]||(fcache['p|'+c+'|'+tz]=new Intl.DateTimeFormat('en-u-ca-'+c+'-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:tz})),o={};
      f.formatToParts(ms).forEach(function(x){o[x.type]=parseInt(x.value,10)});r={y:o.year||0,m:o.month||1,d:o.day||1}}
    catch(_){var d=new Date(tzWall(ms));r={y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}}
    r.k=r.y*10000+r.m*100+r.d;if(Object.keys(dcache).length>6000)dcache={};dcache[k]=r;return r}
  function dsetCal(c){if(c!=='auto'&&!DCAL[c])return;DP.cal=c;dcache={};fcache={};try{localStorage.setItem(DK,JSON.stringify(DP))}catch(_){}
    try{if(typeof renderDateRow==='function')renderDateRow()}catch(_){}redraw()}
  function dsetTZ(z){if(!validTZ(z))return false;DP.tz=z;dcache={};fcache={};try{localStorage.setItem(DK,JSON.stringify(DP))}catch(_){}redraw();return true}
  /* برچسب کامل (ردیف OHLC): همیشه در زون انتخاب‌شده. */
  function dfull(ms){return dfmt(ms,'full')}
  /* v1.70: تاریخ در پیام‌ها/هدرها. حالت «سیستم» = دقیقاً رفتار قبلی (فارسی/انگلیسیِ زبان برنامه)؛ دستی = تقویم انتخاب‌شده */
  var APO={md:[{month:'short',day:'numeric'},1],long:[{weekday:'long',month:'long',day:'numeric'},1],longy:[{weekday:'long',year:'numeric',month:'long',day:'numeric'},1],
    med:[{dateStyle:'medium',timeStyle:'short'},0],ts:[{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'},0],d:[{year:'numeric',month:'numeric',day:'numeric'},1]};
  function dapp(ms,kind,fa){var q=APO[kind]||APO.d,o=q[0],dt=new Date(ms);
    try{var L=DP.cal==='auto'?(fa?'fa-IR':'en-US'):dispLoc(),tz=effTZ(),key='a|'+kind+'|'+L+'|'+tz,f=fcache[key]||(fcache[key]=new Intl.DateTimeFormat(L,Object.assign({},o,{timeZone:tz})));return f.format(dt)}catch(_){return ''}}
  window.OnellaDate={app:dapp,get:function(){return {cal:DP.cal,effective:effCal(),locale:dispLoc(),timeZone:effTZ(),sysTimeZone:sysTZ()}},set:dsetCal,setTZ:dsetTZ,fmt:dfmt,parts:dparts,full:dfull,cross:function(ms,daily){return dfmt(ms,daily?'cd':'ct')}};
  /* ردیف تنظیمات داخل پنل ⚙ برنامه */
  var DLAB=[['auto','سیستم','System'],['gregory','میلادی','Gregorian'],['persian','شمسی','Solar Hijri'],['islamic','قمری','Lunar Hijri']];
  function renderDateRow(){var P=document.getElementById('settingsPanel');if(!P)return;var row=document.getElementById('odRow'); // Mini App: پنل تنظیمات نیست؛ تابع فقط برای سازگاری مانده
    if(!row){row=document.createElement('div');row.id='odRow';row.className='setting-row od-row';P.appendChild(row);
      row.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('button[data-cal]');if(b)dsetCal(b.dataset.cal)})}
    row.innerHTML='<div class="setting-copy"><b>'+tt('تاریخ و ساعت','Date & time')+'</b><small>'+tt('پیش‌فرض: تنظیمات سیستم شما','Default: your system settings')+(sysTZ()?' ('+sysTZ()+')':'')+'</small></div>'+
      '<div class="od-seg">'+DLAB.map(function(x){return '<button type="button" data-cal="'+x[0]+'" class="'+(DP.cal===x[0]?'on':'')+'">'+tt(x[1],x[2])+'</button>'}).join('')+'</div>'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){try{renderDateRow()}catch(_){}});else try{renderDateRow()}catch(_){}
  setTimeout(function(){try{renderDateRow()}catch(_){}},800);
  function intr0(dt){return dt<864e5-1}
  function timeAxis(g,k){var v=k.v,n=v.length,X=k.X;if(n<2)return;
    var dt=Math.abs(v[1].t-v[0].t)||864e5,intr=dt<864e5-1,st=k.st,minPx=(intr0(dt)||dt<6e4)?72:46,marks=[],i,c,pr,lt,lp,p,pp;
    function loc(t){return tzWall(t)}
    if(intr&&dt<6e4){   /* v1.176: تایم‌فریم ثانیه‌ای/زیرثانیه‌ای — برچسب ساعت با ثانیه (قبلاً فقط سر هر دقیقه؛ در 1s هیچ برچسبی نبود) */
      var cs2=[1,2,5,10,15,30,60,120,300,600,900,1800,3600],iv2=3600,j2;
      for(j2=0;j2<cs2.length;j2++){if(cs2[j2]*1000/dt*st>=minPx){iv2=cs2[j2];break}}
      for(i=0;i<n;i++){c=v[i];pr=i?v[i-1]:null;
        if(pr){p=dparts(c.t);pp=dparts(pr.t);
          if(p.k!==pp.k){marks.push([i,p.d===1?dfmt(c.t,'m'):dfmt(c.t,'md'),1]);continue}
          if(Math.floor(loc(c.t)/(iv2*1000))!==Math.floor(loc(pr.t)/(iv2*1000))){marks.push([i,dfmt(c.t,iv2<60?'hms':'hm'),0])}}}
    }else if(intr){
      var cand=[1,2,5,10,15,30,60,120,240,360,720,1440],iv=1440,j;
      for(j=0;j<cand.length;j++){if(cand[j]*6e4/dt*st>=minPx){iv=cand[j];break}}
      for(i=0;i<n;i++){c=v[i];lt=loc(c.t);pr=i?v[i-1]:null;
        if(pr){lp=loc(pr.t);p=dparts(c.t);pp=dparts(pr.t);
          if(p.k!==pp.k){marks.push([i,p.d===1?dfmt(c.t,'m'):dfmt(c.t,'md'),1]);continue}
          if(Math.floor(lt/(iv*6e4))!==Math.floor(lp/(iv*6e4))&&iv<1440){marks.push([i,dfmt(c.t,'hm'),0])}}}
    }else{
      var units=[['w',7*864e5],['m',30.4*864e5],['q',91*864e5],['y',365*864e5]],u='y';
      for(j=0;j<units.length;j++){if(units[j][1]<dt*1.5)continue;if(units[j][1]/dt*st>=minPx){u=units[j][0];break}}
      for(i=1;i<n;i++){p=dparts(v[i].t);pp=dparts(v[i-1].t);var ch=false,lab='',mj=0;
        if(u==='y'){ch=p.y!==pp.y;lab=dfmt(v[i].t,'y');mj=1}
        else if(u==='q'){ch=Math.floor((p.m-1)/3)!==Math.floor((pp.m-1)/3)||p.y!==pp.y;lab=p.m===1?dfmt(v[i].t,'y'):dfmt(v[i].t,'m');mj=p.m===1}
        else if(u==='m'){ch=p.m!==pp.m||p.y!==pp.y;lab=p.m===1?dfmt(v[i].t,'y'):dfmt(v[i].t,'m');mj=p.m===1}
        else{ch=Math.floor((loc(v[i].t)/864e5+3)/7)!==Math.floor((loc(v[i-1].t)/864e5+3)/7);lab=dfmt(v[i].t,'md');mj=p.d<=7}
        if(ch)marks.push([i,lab,mj?1:0])}
    }
    var lastX=-1e9,y=k.H-3,cw=k.cw;g.textAlign='center';
    marks.forEach(function(m){var x=X(m[0]);if(x<14||x>cw-14||x-lastX<54)return;lastX=x;
      if(S.grid){g.strokeStyle='rgba(120,140,170,.09)';g.lineWidth=1;g.beginPath();g.moveTo(Math.round(x)+.5,0);g.lineTo(Math.round(x)+.5,k.ph);g.stroke()}
      g.fillStyle=m[2]?'#b4c0d4':'#7c8aa0';g.font=(m[2]?'bold ':'')+'10px sans-serif';g.fillText(m[1],x,y)});
    g.textAlign='start';g.font='10px sans-serif'}

  /* ---- شبکه‌ی لگاریتمی: ۱-۲-۵ × توان ۱۰ (در صورت کمبود، ریزتر) ---- */
  function logTicks(g,k,maxN,ref){var hi=k.hi,lo=k.lo,pb=k.ph-k.vh,cw=k.cw,Y=k.Y,sets=[[1,2,5],[1,1.5,2,3,4,5,6,8],[1,1.2,1.5,2,2.5,3,3.5,4,4.5,5,6,7,8,9]],a=Math.floor(Math.log10(lo))-1,b=Math.ceil(Math.log10(hi))+1,list=[],si,e,m,p;
    for(si=0;si<sets.length;si++){list=[];for(e=a;e<=b;e++)for(m=0;m<sets[si].length;m++){p=sets[si][m]*Math.pow(10,e);if(p>=lo&&p<=hi)list.push(p)}if(list.length>=3)break}
    if(list.length>maxN){var q=Math.ceil(list.length/maxN);list=list.filter(function(_,j){return j%q===0})}
    list.forEach(function(p){var y=Math.round(Y(p))+.5;if(y<4||y>pb)return;
      if(S.grid){g.strokeStyle='rgba(120,140,170,.13)';g.beginPath();g.moveTo(0,y);g.lineTo(cw,y);g.stroke()}
      g.fillStyle='#7c8aa0';
      g.fillText(S.pct&&ref?(((p/ref-1)*100).toFixed(2)+'%'):dTick(p,Math.pow(10,Math.floor(Math.log10(p))-1)),cw+5,y+3.5)})}

  /* ---- محور و شبکه (قبل از کندل‌ها) ---- */
  function axisBack(g,k){var hi=k.hi,lo=k.lo,ph=k.ph,vh=k.vh,pb=ph-vh,cw=k.cw,Y=k.Y;
    g.font='10px sans-serif';g.fillStyle='#7c8aa0';g.lineWidth=1;
    var maxN=Math.max(3,Math.min(10,Math.floor(pb/38))),step=niceStep(hi-lo,maxN),p0=Math.ceil(lo/step),i,p,y;
    var ref=k.ref||1;
    if(k.log&&lo>0){logTicks(g,k,maxN,ref);timeAxis(g,k);return}
    for(i=0;;i++){p=(p0+i)*step;if(p>hi)break;y=Math.round(Y(p))+.5;if(y<4||y>pb)continue;
      if(S.grid){g.strokeStyle='rgba(120,140,170,.13)';g.beginPath();g.moveTo(0,y);g.lineTo(cw,y);g.stroke()}
      g.fillStyle='#7c8aa0';
      g.fillText(S.pct&&ref?(((p/ref-1)*100).toFixed(2)+'%'):dTick(p,step),cw+5,y+3.5)}
    timeAxis(g,k)}

  /* ---- کندل‌ها / بار / خط / ناحیه + حجم ---- */
  function paint(g,k){var v=k.v,X=k.X,Y=k.Y,st=k.st,t=S.type,ph=k.ph,vh=k.vh,vm=k.vm,i,c,d,x,L,a,b,bw=Math.max(1,Math.round(st*.62));
    if(bw>1&&bw%2===0)bw++;
    if(S.vol){g.globalAlpha=.22;for(i=0;i<v.length;i++){c=v[i];g.fillStyle=c.c>=c.o?UP:DN;var h=c.v/vm*vh;g.fillRect(Math.floor(X(i))-(bw-1)/2,ph-h,bw,h)}g.globalAlpha=1}
    if(t==='line'||t==='area'){
      g.beginPath();for(i=0;i<v.length;i++){x=X(i);i?g.lineTo(x,Y(v[i].c)):g.moveTo(x,Y(v[i].c))}
      if(t==='area'&&v.length){var gr=g.createLinearGradient(0,0,0,ph-vh);gr.addColorStop(0,'rgba(90,169,255,.34)');gr.addColorStop(1,'rgba(90,169,255,0)');
        g.save();g.lineTo(X(v.length-1),ph-vh);g.lineTo(X(0),ph-vh);g.closePath();g.fillStyle=gr;g.fill();g.restore();
        g.beginPath();for(i=0;i<v.length;i++){x=X(i);i?g.lineTo(x,Y(v[i].c)):g.moveTo(x,Y(v[i].c))}}
      g.strokeStyle=LN;g.lineWidth=1.8;g.lineJoin='round';g.stroke();g.lineJoin='miter';return}
    d=v;if(t==='ha'){var H=ha(k.cs);d=v.map(function(q,j){return H[k.off+j]||q})}
    g.lineWidth=1;
    for(i=0;i<d.length;i++){c=d[i];var up=c.c>=c.o,col=up?UP:DN;x=Math.floor(X(i))+.5;g.strokeStyle=col;g.fillStyle=col;
      if(t==='bars'){var tk=Math.max(2,Math.round(st*.4));g.lineWidth=st>10?1.6:1;
        g.beginPath();g.moveTo(x,Y(c.h));g.lineTo(x,Y(c.l));g.moveTo(x-tk,Y(c.o));g.lineTo(x,Y(c.o));g.moveTo(x,Y(c.c));g.lineTo(x+tk,Y(c.c));g.stroke();continue}
      g.beginPath();g.moveTo(x,Y(c.h));g.lineTo(x,Y(c.l));g.stroke();
      a=Y(Math.max(c.o,c.c));b=Y(Math.min(c.o,c.c));var hh=Math.max(1,b-a);L=Math.floor(X(i))-(bw-1)/2;
      if(t==='hollow'&&up&&bw>2&&hh>2){g.strokeRect(L+.5,a+.5,bw-1,hh-1)}else g.fillRect(L,a,bw,hh)}}

  /* ---- خط و برچسب قیمت زنده (روی محور) ---- */
  function axisFront(g,k){cdOn=false;if(!k.last){cdLast=null;return}
    var c=k.last,pb=k.ph-k.vh,y=k.Y(c.c),cw=k.cw,W=k.W,col=c.c>=c.o?UP:DN;cdLast=c;
    /* v1.179: شمارش معکوس مستقل از «خط قیمت زنده» است؛ قبلاً با خاموش بودن خط قیمت اصلاً نمایش داده نمی‌شد */
    var showLast=!!S.last,rm=S.cd?cdLeft(c):-1;
    if(!showLast&&rm<0)return;
    y=Math.max(9,Math.min(pb-9,y));y=Math.round(y)+.5;
    if(showLast){
    g.save();g.strokeStyle=col;g.globalAlpha=.75;g.lineWidth=1;g.setLineDash([3,3]);g.beginPath();g.moveTo(0,y);g.lineTo(cw,y);g.stroke();g.restore();
    var txt=S.pct&&k.ref?(((c.c/k.ref-1)*100).toFixed(2)+'%'):dLast(c.c);
    g.fillStyle=col;g.beginPath();if(g.roundRect)g.roundRect(cw+1,y-8,W-cw-2,16,3);else g.rect(cw+1,y-8,W-cw-2,16);g.fill();
    g.fillStyle='#0a0f1a';g.font='bold 10px sans-serif';g.fillText(txt,cw+5,y+3.5);g.font='10px sans-serif'}
    /* v1.68: شمارش معکوس بسته‌شدن کندل زیر برچسب قیمت */
    if(rm>=0){cdOn=true;var ty=showLast?y+9:y-8;if(ty+16>pb)ty=showLast?y-25:pb-16;if(ty<0)ty=0;
      g.globalAlpha=.55;g.fillStyle=col;g.beginPath();if(g.roundRect)g.roundRect(cw+1,ty,W-cw-2,16,3);else g.rect(cw+1,ty,W-cw-2,16);g.fill();g.globalAlpha=1;
      g.fillStyle=col;g.fillRect(cw+1,ty,2,16);g.fillStyle='#fff';g.font='bold 10px sans-serif';g.fillText(cdFmt(rm),cw+5,ty+11.5);g.font='10px sans-serif'}}
  var cdOn=false,cdLast=null;
  function tfMs(f,t){var q=/^(\d+)(ms|s)$/.exec(String(f||''));if(q)return +q[1]*(q[2]==='s'?1000:1);var m=/^(\d+)(mo|m|h|d|w)$/.exec(String(f||''));if(!m)return 0;var n=+m[1],u=m[2];
    if(u==='mo'){var d=new Date(t);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1)-Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)}
    return n*({m:60,h:3600,d:86400,w:604800})[u]*1000}
  /* v1.179: مرز کندل بعدی همیشه از شبکهٔ تایم‌فریم حساب می‌شود.
     باگ قبلی: لحظهٔ بسته‌شدن کندل (و تا رسیدن دادهٔ کندل جدید) برای فارکس/سهام مقدار -1 برمی‌گشت، cdOn خاموش می‌شد و تایمر دیگر redraw نمی‌زد
     ⇒ شمارش ناپدید می‌شد (و با تأخیر پولینگ دیر برمی‌گشت). حالا بعد از بسته‌شدن، شمارش کندل بعدی بلافاصله ادامه می‌یابد؛
     فقط اگر کندل آخر خیلی کهنه باشد (بازار بسته، غیرکریپتو) یا حالت بازپخش (Replay) باشد مخفی می‌شود. */
  function cdLeft(c){try{if(!c||!c.t||typeof tf==='undefined')return -1;
    try{if(window.onellaReplay&&window.onellaReplay.active)return -1}catch(_){}
    var ms=tfMs(tf,c.t);if(!ms||ms<1000)return -1;var now=Date.now(),cr=false;try{cr=pair.kind==='crypto'}catch(_){}
    if(now<c.t)now=c.t;                       /* ساعت دستگاه کمی عقب‌تر از صرافی */
    var end=c.t+ms;
    if(end<=now){
      if(!cr&&now-end>Math.max(45000,Math.min(ms,300000)))return -1;   /* غیرکریپتو: کندل آخر خیلی کهنه = بازار بسته؛ تا آن موقع کندل بعدی را می‌شماریم */
      if(/^\d+mo$/.test(String(tf))){var g=0;while(end<=now&&g++<60)end+=tfMs(tf,end)}else end=c.t+ms*(Math.floor((now-c.t)/ms)+1)}
    var r=end-now;return r>0?r:-1}catch(_){return -1}}
  function cdFmt(ms){var s=Math.ceil(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60,z=function(v){return v<10?'0'+v:''+v};
    return d?d+'d '+z(h)+':'+z(m):h?h+':'+z(m)+':'+z(x):z(m)+':'+z(x)}
  /* تایمر: هر ثانیه هم‌تراز با مرز ثانیه؛ مستقل از cdOn (وگرنه بعد از یک بار پنهان‌شدن برای همیشه متوقف می‌ماند) */
  function cdTick(){try{if(S.cd&&!document.hidden&&(cdOn||(cdLast&&cdLeft(cdLast)>=0)))redraw()}catch(_){}
    setTimeout(cdTick,1000-(Date.now()%1000)+20)}
  setTimeout(cdTick,1000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&S.cd)redraw()});

  /* Mini App: پنل تنظیمات روی چارت حذف شده (فقط نوع چارت از تب چارت انتخاب می‌شود) */
  window.OnellaChartStyle={get:function(){return S},set:function(o){for(var q in o)if(q in D)S[q]=o[q];if('lock' in o)applyLock();if('pal' in o)applyPal();save();redraw(); /* Mini App: render() پنل تنظیمات حذف شده */},
    types:TYPES.map(function(x){return x[0]}),pc:pc,
    /* v1.70: فیبوناچی لگاریتمی — فقط وقتی مقیاس لگاریتمی واقعاً فعال است (__geo.log)؛ وگرنه همان فرمول خطی */
    lerp:function(a,b,r){var G=window.__geo;return G&&G.log&&a>0&&b>0?Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*r):a+(b-a)*r},
    ext:function(pa,pb,pc,r){var G=window.__geo;return G&&G.log&&pa>0&&pb>0&&pc>0?pc*Math.pow(pb/pa,r):pc+(pb-pa)*r},
    rat:function(a,b,p){var G=window.__geo;return G&&G.log&&a>0&&b>0&&p>0&&a!==b?(Math.log(p)-Math.log(a))/(Math.log(b)-Math.log(a)):(b===a?0:(p-a)/(b-a))},colors:function(){return{up:UP,dn:DN}},pw:pw,axisBack:axisBack,paint:paint,axisFront:axisFront,ha:ha,niceStep:niceStep,fmtTick:fmtTick};
})();
