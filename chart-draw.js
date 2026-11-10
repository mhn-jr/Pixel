/* Mini App v1.4.0 — موتور رسم تعاملی (مرحلهٔ ۳ چارت حرفه‌ای): خط روند، خط افقی،
   مستطیل، فیبوناچی اصلاحی، متن.
   - رسم‌ها بر اساس «زمان کندل + قیمت» ذخیره می‌شوند، نه ایندکس — پس با pan/zoom
     و آمدن کندل‌های زنده سر جایشان می‌مانند (ایندکس با هر کندل تازه جابه‌جا می‌شود).
   - ذخیرهٔ هر نماد در localStorage (کلید onella_drawings_v1، سقف ۵۰ رسم برای هر نماد).
   - تعامل (سیم‌کشی در app.js): انتخاب ابزار از پنل → ضربه‌ضربه یا کشیدن-رها کردن
     برای دو نقطه؛ خط افقی با یک ضربه؛ متن با ضربه + prompt. ضربه روی رسم آن را
     انتخاب می‌کند؛ کشیدنِ رسمِ انتخاب‌شده آن را جابه‌جا می‌کند.
   - هیچ عددی ساخته نمی‌شود: همهٔ نقطه‌ها از همان کندل‌های روی چارت می‌آیند. */
(function () {
  var KEY = 'onella_drawings_v1';
  var MAX_PER_SYM = 50;
  var FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  /* v1.14.8 — ابزارهای تازه (به سبک تریدینگ‌ویو): سطوح اکستنشن و بادبزن. */
  var EXT_RATIOS = [0, 0.382, 0.5, 0.618, 1, 1.272, 1.618, 2, 2.618];
  var FAN_RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786, 1];
  var COLORS = { trend: '#ffb347', hline: '#7aa2d6', rect: '#5fb8a6', fib: '#ffb347', text: '#e6e9ef', ray: '#5fb8a6', vline: '#8fa3b8', sel: '#f06a15',
    arrow: '#ffb347', circle: '#5fb8a6', ellipse: '#7aa2d6', triangle: '#d6a55f', channel: '#a58fd6', fibext: '#ffb347', fibfan: '#ffb347', pitchfork: '#8fa3b8', pricelabel: '#e6e9ef', polyline: '#e6e9ef', highlighter: '#ffd54a' };
  var store = {};
  var activeTool = null, pending = null, pending2 = null, preview = null, selectedId = null, moveStart = null;
  var idSeq = 0;
  /* v1.14.7 — آهنربا (چسبیدن نقطهٔ رسم به نزدیک‌ترین O/H/L/C کندل زیر نشانگر)
     + قلم آزاد (freehand): نقاطِ stroke حین کشیدن جمع می‌شوند. */
  var MAG_KEY = 'onella_draw_magnet_v1';
  var magnetOn = false;
  try { magnetOn = localStorage.getItem(MAG_KEY) === '1'; } catch (_) {}
  function saveMagnet() { try { localStorage.setItem(MAG_KEY, magnetOn ? '1' : '0'); } catch (_) {} }
  function setMagnet(on) { magnetOn = !!on; saveMagnet(); syncUI(); return magnetOn; }
  var liveBrush = null;

  function load() {
    try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); store = (r && typeof r === 'object') ? r : {}; }
    catch (_) { store = {}; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} }
  load();
  function sym() { try { return (window.pair && window.pair.sym) || 'UNKNOWN'; } catch (_) { return 'UNKNOWN'; } }
  function list(s) { s = s || sym(); return store[s] || (store[s] = []); }
  function mkId() { idSeq++; return 'd' + Date.now().toString(36) + '_' + idSeq + '_' + Math.floor(Math.random() * 1e6).toString(36); }
  function fmtNum(v) { try { var m = window.__dispMul; m = (typeof m === 'number' && isFinite(m) && m > 0) ? m : 1; return typeof fmt === 'function' ? fmt(v * m) : String(v); } catch (_) { return String(v); } }
  function tt(fa, en) { try { return typeof T === 'function' ? T(fa, en) : fa; } catch (_) { return fa; } }
  function lerp(a, b, r) {
    try { var S = window.OnellaChartStyle; if (S && typeof S.lerp === 'function') return S.lerp(a, b, r); } catch (_) {}
    return a + (b - a) * r;
  }

  /* ---- هندسه: زمان کندل → ایندکس دیده‌شده، و نقطهٔ (x,y) روی چارت → {t, p} ---- */
  function csArr() { try { return Array.isArray(window.cs) ? window.cs : []; } catch (_) { return []; } }
  function timeToIndex(t) {
    var cs = csArr();
    if (!cs.length) return -1;
    if (t <= cs[0].t) return 0;
    if (t >= cs[cs.length - 1].t) return cs.length - 1;
    var lo = 0, hi = cs.length - 1;
    while (lo < hi - 1) { var mid = (lo + hi) >> 1; if (cs[mid].t <= t) lo = mid; else hi = mid; }
    return (t - cs[lo].t <= cs[hi].t - t) ? lo : hi;
  }
  function geom(o) {
    if (o && o.X && o.Y) return o;
    var G = null;
    try { G = window.__geo; } catch (_) {}
    if (!G || typeof G.Y !== 'function' || G.off == null) return null;
    var cs = csArr();
    var st = G.st || 7, cw = (G.W || 0) - (G.pw || 46);
    var n = Math.min(cs.length - G.off, Math.floor(cw / st));
    return { v: cs.slice(G.off, G.off + n), off: G.off, n: n, X: function (i) { return i * st + st / 2; }, Y: G.Y, cw: cw, ph: G.ph, W: G.W, st: st };
  }
  function pointFromXY(x, y) {
    var G = null;
    try { G = window.__geo; } catch (_) {}
    var cs = csArr();
    if (!G || typeof G.inv !== 'function' || !cs.length) return null;
    var st = G.st || 7, off = G.off || 0;
    var idx = off + Math.floor(x / st);
    if (idx < 0) idx = 0;
    if (idx > cs.length - 1) idx = cs.length - 1;
    var yy = Math.max(0, Math.min(G.ph || 0, y));
    var pt = { t: cs[idx].t, idx: idx, p: G.inv(yy), x: x, y: y };
    /* v1.14.7 — آهنربا: قیمت نقطه به نزدیک‌ترین O/H/L/C کندلِ همان ستون می‌چسبد. */
    if (magnetOn) {
      var c = cs[idx], best = pt.p, bd = Infinity, k, v;
      if (c) {
        ['o', 'h', 'l', 'c'].forEach(function (kk) { var vv = c[kk]; if (typeof vv === 'number' && isFinite(vv)) { var dd = Math.abs(vv - pt.p); if (dd < bd) { bd = dd; best = vv; } } });
        pt.p = best;
      }
    }
    return pt;
  }
  function visIdx(t, g) { return timeToIndex(t) - (g.off || 0); }
  function pxOf(t, g) { return g.X(visIdx(t, g)); }

  /* ---- CRUD + ذخیره ---- */
  function add(d) {
    if (!d || !d.type) return null;
    d.id = d.id || mkId();
    var arr = list();
    arr.push(d);
    if (arr.length > MAX_PER_SYM) arr.splice(0, arr.length - MAX_PER_SYM);
    save();
    return d;
  }
  function remove(id) {
    var arr = list(), i;
    for (i = 0; i < arr.length; i++) if (arr[i].id === id) { arr.splice(i, 1); break; }
    if (selectedId === id) selectedId = null;
    save();
    syncUI();
  }
  function removeSelected() { if (selectedId) remove(selectedId); }
  function clearCurrent() { store[sym()] = []; selectedId = null; pending = null; pending2 = null; preview = null; save(); syncUI(); }
  function select(id) { selectedId = id || null; syncUI(); }
  function reload() { load(); }

  /* ---- فیبوناچی: سطوح از همان lerp چارت (خطی/لگاریتمی مثل فیبوی محاسبه‌شده) ---- */
  function fibLevels(p1, p2) {
    return FIB_RATIOS.map(function (r) { return { r: r, p: lerp(p1, p2, r) }; });
  }
  /* v1.14.8 — اکستنشن فیبوناچی: سطوحِ فراتر از نقطهٔ دوم (در راستای p1→p2)،
     با همان ext لگاریتمیِ چارت وقتی مقیاس لگاریتمی فعال است. */
  function extLevels(p1, p2) {
    return EXT_RATIOS.map(function (r) {
      var p = p2 + (p2 - p1) * r;
      try { var S = window.OnellaChartStyle; if (S && typeof S.ext === 'function') p = S.ext(p1, p2, p2, r); } catch (_) {}
      return { r: r, p: p };
    });
  }

  /* ---- ابزار فعال + ضربه ---- */
  function setTool(t) {
    /* v1.14.7 — نشانگر: ابزارِ انتخاب (بدون ابزار رسم)؛ آهنربا: کلید چسبندگی، نه ابزار رسم. */
    if (t === 'cursor') { activeTool = null; pending = null; pending2 = null; preview = null; liveBrush = null; syncUI(); return null; }
    if (t === 'magnet') { setMagnet(!magnetOn); return magnetOn ? 'magnet' : null; }
    if (activeTool === t) { activeTool = null; }
    else { activeTool = t; selectedId = null; }
    pending = null; pending2 = null; preview = null; liveBrush = null;
    syncUI();
    return activeTool;
  }
  function setPreview(pt) {
    /* v1.14.7 — قلم آزاد: هر نقطهٔ حرکت به stroke زنده اضافه می‌شود (با فاصلهٔ حداقلی).
       v1.14.8 — همان مکانیزم برای خط شکسته و هایلایتر (فاصلهٔ حداقلیِ بیشتر برای خط شکسته). */
    if ((activeTool === 'brush' || activeTool === 'polyline' || activeTool === 'highlighter') && pt) {
      if (!liveBrush) liveBrush = { type: activeTool, pts: [] };
      var minD = activeTool === 'polyline' ? 12 : 4;
      var last = liveBrush.pts[liveBrush.pts.length - 1];
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > minD) liveBrush.pts.push({ t: pt.t, p: pt.p, x: pt.x, y: pt.y });
      preview = liveBrush;
      return;
    }
    preview = pt || null;
  }
  function askText(anchor) {
    if (typeof prompt !== 'function') return null;
    var v = null;
    try { v = prompt(tt('متن روی چارت', 'Text on chart'), ''); } catch (_) { return null; }
    if (v == null) return null;
    v = String(v).trim().slice(0, 30);
    return v ? v : null;
  }
  function tap(pt) {
    if (!pt) return null;
    /* v1.14.7 — پاک‌کن: ضربه روی رسم آن را همان‌جا حذف می‌کند. */
    if (activeTool === 'eraser') {
      var hitE = hitTestXY(pt.x, pt.y);
      if (hitE) { remove(hitE.id); return 'erased'; }
      return null;
    }
    /* v1.14.7 — قلم آزاد با یک ضربه: یک نقطه (نقطه‌چین) می‌گذارد.
       v1.14.8 — خط شکسته و هایلایتر هم با یک ضربه یک نقطه می‌گذارند. */
    if (activeTool === 'brush' || activeTool === 'polyline' || activeTool === 'highlighter') {
      add({ type: activeTool, pts: [{ t: pt.t, p: pt.p }] });
      syncUI();
      return 'placed';
    }
    if (activeTool === 'hline') {
      add({ type: 'hline', p: pt.p });
      syncUI();
      return 'placed';
    }
    if (activeTool === 'ray') {
      add({ type: 'ray', t: pt.t, p: pt.p });
      syncUI();
      return 'placed';
    }
    if (activeTool === 'vline') {
      add({ type: 'vline', t: pt.t });
      syncUI();
      return 'placed';
    }
    if (activeTool === 'text') {
      var tx = askText(pt);
      if (tx == null) return 'noprompt';
      add({ type: 'text', t: pt.t, p: pt.p, text: tx });
      syncUI();
      return 'placed';
    }
    /* v1.14.8 — برچسب قیمت: یک ضربه؛ قیمت همان نقطه به‌صورت خودکار روی چارت می‌نشیند (بدون prompt). */
    if (activeTool === 'pricelabel') {
      add({ type: 'pricelabel', t: pt.t, p: pt.p });
      syncUI();
      return 'placed';
    }
    if (activeTool === 'trend' || activeTool === 'rect' || activeTool === 'fib' || activeTool === 'measure'
      || activeTool === 'arrow' || activeTool === 'circle' || activeTool === 'ellipse' || activeTool === 'triangle'
      || activeTool === 'fibext' || activeTool === 'fibfan') {
      if (!pending) { pending = { t: pt.t, p: pt.p }; return 'pending'; }
      add({ type: activeTool, t1: pending.t, p1: pending.p, t2: pt.t, p2: pt.p });
      pending = null; preview = null;
      syncUI();
      return 'placed';
    }
    /* v1.14.8 — کانال موازی و چنگال: سه ضربه (دو نقطهٔ خط اصلی + نقطهٔ سوم برای خط موازی/میانه). */
    if (activeTool === 'channel' || activeTool === 'pitchfork') {
      if (!pending) { pending = { t: pt.t, p: pt.p }; return 'pending'; }
      if (!pending2) { pending2 = { t: pt.t, p: pt.p }; return 'pending'; }
      add({ type: activeTool, t1: pending.t, p1: pending.p, t2: pending2.t, p2: pending2.p, t3: pt.t, p3: pt.p });
      pending = null; pending2 = null; preview = null;
      syncUI();
      return 'placed';
    }
    var hit = hitTestXY(pt.x, pt.y);
    if (hit) { select(hit.id); return 'selected'; }
    if (selectedId) { select(null); return 'deselected'; }
    return null;
  }
  function completeDrag(a, b) {
    if (!a || !b || !activeTool) return null;
    /* v1.14.7 — پاک‌کن با کشیدن هم همان نقطهٔ رها را پاک می‌کند. */
    if (activeTool === 'eraser') {
      var hitE = hitTestXY(b.x, b.y);
      if (hitE) { remove(hitE.id); return 'erased'; }
      return null;
    }
    /* v1.14.7 — قلم آزاد: stroke زنده نهایی می‌شود (اگر نقطه‌ای جمع نشده بود، همان دو سر).
       v1.14.8 — خط شکسته و هایلایتر هم همین‌طور (نوع stroke زنده همان ابزار فعال است). */
    if (activeTool === 'brush' || activeTool === 'polyline' || activeTool === 'highlighter') {
      var pts = (liveBrush && liveBrush.pts.length) ? liveBrush.pts.slice() : [{ t: a.t, p: a.p }, { t: b.t, p: b.p }];
      if (pts.length === 1) pts.push({ t: b.t, p: b.p });
      add({ type: (liveBrush && liveBrush.type) || activeTool, pts: pts });
      liveBrush = null; preview = null; syncUI();
      return 'placed';
    }
    if (activeTool === 'hline') { add({ type: 'hline', p: b.p }); syncUI(); return 'placed'; }
    if (activeTool === 'ray') { add({ type: 'ray', t: a.t, p: a.p }); syncUI(); return 'placed'; }
    if (activeTool === 'vline') { add({ type: 'vline', t: a.t }); syncUI(); return 'placed'; }
    if (activeTool === 'text') return null;
    /* v1.14.8 — کانال موازی و چنگال با کشیدن: دو سر کشیدن دو نقطهٔ اول‌اند و
       نقطهٔ سوم، قرینهٔ نقطهٔ اول نسبت به دوم در قیمت است (شکل متقارن پیش‌فرض؛
       سه ضربه کنترل کامل می‌دهد). */
    if (activeTool === 'channel' || activeTool === 'pitchfork') {
      add({ type: activeTool, t1: a.t, p1: a.p, t2: b.t, p2: b.p, t3: b.t, p3: 2 * b.p - a.p });
      pending = null; pending2 = null; preview = null; syncUI();
      return 'placed';
    }
    add({ type: activeTool, t1: a.t, p1: a.p, t2: b.t, p2: b.p });
    pending = null; pending2 = null; preview = null;
    syncUI();
    return 'placed';
  }

  /* ---- جابه‌جایی رسم انتخاب‌شده (دلتا از snapshot شروع، نه افزایشی — بدون لغزش) ---- */
  function startMove(x, y) {
    if (!selectedId) return false;
    var d = null, arr = list(), i;
    for (i = 0; i < arr.length; i++) if (arr[i].id === selectedId) d = arr[i];
    if (!d) return false;
    moveStart = { x: x, y: y, snap: JSON.parse(JSON.stringify(d)) };
    return true;
  }
  function moveTo(x, y) {
    if (!moveStart || !selectedId) return false;
    var G = null;
    try { G = window.__geo; } catch (_) {}
    if (!G || typeof G.inv !== 'function') return false;
    var st = G.st || 7;
    var dIdx = Math.round((x - moveStart.x) / st);
    var dP = G.inv(Math.max(0, Math.min(G.ph || 0, y))) - G.inv(Math.max(0, Math.min(G.ph || 0, moveStart.y)));
    var s = moveStart.snap, cs = csArr();
    function shiftT(t) {
      var idx = timeToIndex(t) + dIdx;
      if (idx < 0) idx = 0;
      if (idx > cs.length - 1) idx = cs.length - 1;
      return cs[idx].t;
    }
    var d = null, arr = list(), i;
    for (i = 0; i < arr.length; i++) if (arr[i].id === selectedId) d = arr[i];
    if (!d) return false;
    if (d.type === 'hline') { d.p = s.p + dP; }
    else if (d.type === 'ray') { d.t = shiftT(s.t); d.p = s.p + dP; }
    else if (d.type === 'vline') { d.t = shiftT(s.t); }
    else if (d.type === 'text' || d.type === 'pricelabel') { d.t = shiftT(s.t); d.p = s.p + dP; }
    else if (d.type === 'brush' || d.type === 'polyline' || d.type === 'highlighter') {
      /* v1.14.7 — همهٔ نقطه‌های stroke با هم جابه‌جا می‌شوند (از snapshot، نه تجمعی). */
      (d.pts || []).forEach(function (q, qi) { if (s.pts && s.pts[qi]) { q.t = shiftT(s.pts[qi].t); q.p = s.pts[qi].p + dP; } });
    }
    else if (d.type === 'channel' || d.type === 'pitchfork') { d.t1 = shiftT(s.t1); d.p1 = s.p1 + dP; d.t2 = shiftT(s.t2); d.p2 = s.p2 + dP; d.t3 = shiftT(s.t3); d.p3 = s.p3 + dP; }
    else { d.t1 = shiftT(s.t1); d.p1 = s.p1 + dP; d.t2 = shiftT(s.t2); d.p2 = s.p2 + dP; }
    return true;
  }
  function endMove() { if (moveStart) { moveStart = null; save(); } }

  /* ---- hit-test (فاصلهٔ نقطه تا رسم، آستانهٔ لمس) ---- */
  function distSeg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy, t = 0;
    if (L2 > 0) { t = ((px - x1) * dx + (py - y1) * dy) / L2; if (t < 0) t = 0; if (t > 1) t = 1; }
    var cx = x1 + t * dx, cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  /* v1.14.8 — رئوس مثلث از مستطیل کشیدن: قاعده در قیمت پایین‌تر، راس در وسطِ بالا. */
  function triVerts(d, g) {
    var x1 = pxOf(d.t1, g), y1 = g.Y(d.p1), x2 = pxOf(d.t2, g), y2 = g.Y(d.p2);
    var by = Math.max(y1, y2), ay = Math.min(y1, y2), mx = (x1 + x2) / 2;
    return [[x1, by], [x2, by], [mx, ay]];
  }
  /* v1.14.8 — سه خط چنگال تا لبهٔ راست چارت: میانه (P1 تا وسط P2 و P3)
     + دو موازیِ گذرنده از P2 و P3 با همان جهت میانه. */
  function forkLines(d, g) {
    var p1x = pxOf(d.t1, g), p1y = g.Y(d.p1), p2x = pxOf(d.t2, g), p2y = g.Y(d.p2), p3x = pxOf(d.t3, g), p3y = g.Y(d.p3);
    var mx = (p2x + p3x) / 2, my = (p2y + p3y) / 2;
    var ex = g.cw || p1x;
    function ext(sx, sy, dx, dy) {
      if (Math.abs(dx) < 1e-9) return [sx, sy, sx, sy];
      var s = (ex - sx) / dx;
      if (s < 0) s = 0;
      return [sx, sy, sx + dx * s, sy + dy * s];
    }
    var mdx = mx - p1x, mdy = my - p1y;
    return [ext(p1x, p1y, mdx, mdy), ext(p2x, p2y, mdx, mdy), ext(p3x, p3y, mdx, mdy)];
  }
  function hitTest(x, y, o) {
    var g = geom(o);
    if (!g) return null;
    var arr = list();
    for (var k = arr.length - 1; k >= 0; k--) {
      var d = arr[k];
      if (d.type === 'trend' || d.type === 'measure' || d.type === 'arrow') {
        if (distSeg(x, y, pxOf(d.t1, g), g.Y(d.p1), pxOf(d.t2, g), g.Y(d.p2)) < 12) return d;
      } else if (d.type === 'brush' || d.type === 'polyline' || d.type === 'highlighter') {
        /* v1.14.7 — برخورد با هر قطعهٔ stroke. */
        var bp = d.pts || [], qi;
        for (qi = 0; qi + 1 < bp.length; qi++) {
          if (distSeg(x, y, pxOf(bp[qi].t, g), g.Y(bp[qi].p), pxOf(bp[qi + 1].t, g), g.Y(bp[qi + 1].p)) < 12) return d;
        }
        if (bp.length === 1 && Math.hypot(x - pxOf(bp[0].t, g), y - g.Y(bp[0].p)) < 12) return d;
      } else if (d.type === 'fib' || d.type === 'fibext') {
        if (distSeg(x, y, pxOf(d.t1, g), g.Y(d.p1), pxOf(d.t2, g), g.Y(d.p2)) < 12) return d;
        var x1 = pxOf(d.t1, g), x2 = pxOf(d.t2, g), xa = Math.min(x1, x2), xb = Math.max(x1, x2);
        if (x >= xa - 6 && x <= xb + 6) {
          var lv = d.type === 'fibext' ? extLevels(d.p1, d.p2) : fibLevels(d.p1, d.p2), j;
          for (j = 0; j < lv.length; j++) if (Math.abs(y - g.Y(lv[j].p)) < 8) return d;
        }
      } else if (d.type === 'circle') {
        /* v1.14.8 — برخورد با محیط دایره (شعاع از فاصلهٔ پیکسلیِ دو نقطه). */
        var ccx = pxOf(d.t1, g), ccy = g.Y(d.p1), cr = Math.hypot(pxOf(d.t2, g) - ccx, g.Y(d.p2) - ccy);
        if (cr > 4 && Math.abs(Math.hypot(x - ccx, y - ccy) - cr) < 10) return d;
      } else if (d.type === 'ellipse') {
        var ex1 = pxOf(d.t1, g), ey1 = g.Y(d.p1), erx = Math.abs(pxOf(d.t2, g) - ex1), ery = Math.abs(g.Y(d.p2) - ey1);
        if (erx > 4 && ery > 4) {
          var ev = Math.sqrt(Math.pow((x - ex1) / erx, 2) + Math.pow((y - ey1) / ery, 2));
          if (Math.abs(ev - 1) < 0.22) return d;
        }
      } else if (d.type === 'triangle') {
        var tv = triVerts(d, g);
        if (distSeg(x, y, tv[0][0], tv[0][1], tv[1][0], tv[1][1]) < 12 || distSeg(x, y, tv[1][0], tv[1][1], tv[2][0], tv[2][1]) < 12 || distSeg(x, y, tv[2][0], tv[2][1], tv[0][0], tv[0][1]) < 12) return d;
      } else if (d.type === 'channel') {
        /* v1.14.8 — برخورد با یکی از دو خط موازی (خط اصلی + خطِ گذرنده از نقطهٔ سوم). */
        var mx1 = pxOf(d.t1, g), my1 = g.Y(d.p1), mx2 = pxOf(d.t2, g), my2 = g.Y(d.p2);
        var ox = pxOf(d.t3, g) - mx1, oy = g.Y(d.p3) - my1;
        if (distSeg(x, y, mx1, my1, mx2, my2) < 12 || distSeg(x, y, mx1 + ox, my1 + oy, mx2 + ox, my2 + oy) < 12) return d;
      } else if (d.type === 'fibfan') {
        var fx1 = pxOf(d.t1, g), fy1 = g.Y(d.p1), fx2 = pxOf(d.t2, g), fex = g.cw || 0, fj;
        for (fj = 0; fj < FAN_RATIOS.length; fj++) {
          var fy2 = g.Y(lerp(d.p1, d.p2, FAN_RATIOS[fj]));
          var fdx = fx2 - fx1;
          if (Math.abs(fdx) < 1) continue;
          var fey = fy1 + (fy2 - fy1) / fdx * (fex - fx1);
          if (distSeg(x, y, fx1, fy1, fex, fey) < 12) return d;
        }
      } else if (d.type === 'pitchfork') {
        var pk = forkLines(d, g);
        if (distSeg(x, y, pk[0][0], pk[0][1], pk[0][2], pk[0][3]) < 12 || distSeg(x, y, pk[1][0], pk[1][1], pk[1][2], pk[1][3]) < 12 || distSeg(x, y, pk[2][0], pk[2][1], pk[2][2], pk[2][3]) < 12) return d;
      } else if (d.type === 'pricelabel') {
        var lx = pxOf(d.t, g), ly = g.Y(d.p);
        if (x >= lx - 4 && x <= lx + 84 && y >= ly - 14 && y <= ly + 8) return d;
      } else if (d.type === 'hline') {
        if (Math.abs(y - g.Y(d.p)) < 10) return d;
      } else if (d.type === 'ray') {
        var rx0 = pxOf(d.t, g);
        if (x >= rx0 - 6 && Math.abs(y - g.Y(d.p)) < 10) return d;
      } else if (d.type === 'vline') {
        if (Math.abs(x - pxOf(d.t, g)) < 10) return d;
      } else if (d.type === 'rect') {
        var rx1 = pxOf(d.t1, g), rx2 = pxOf(d.t2, g), ry1 = g.Y(d.p1), ry2 = g.Y(d.p2);
        if (x >= Math.min(rx1, rx2) - 6 && x <= Math.max(rx1, rx2) + 6 && y >= Math.min(ry1, ry2) - 6 && y <= Math.max(ry1, ry2) + 6) return d;
      } else if (d.type === 'text') {
        var tx = pxOf(d.t, g), ty = g.Y(d.p), w = 60;
        try { if (g && g.ctx) w = g.ctx.measureText(d.text || '').width; } catch (_) {}
        if (x >= tx - 4 && x <= tx + w + 8 && y >= ty - 14 && y <= ty + 6) return d;
      }
    }
    return null;
  }
  function hitTestXY(x, y) { return hitTest(x, y, null); }

  /* ---- رسم روی canvas چارت ---- */
  function draw(g, o) {
    var gg = geom(o);
    if (!gg || !g) return;
    var arr = list();
    if (!arr.length && !pending) return;
    var cw = gg.cw, ph = gg.ph, W = gg.W || cw;
    g.save();
    g.beginPath(); g.rect(0, 0, cw, ph); g.clip();
    g.font = '10px sans-serif'; g.textAlign = 'start';
    function line(x1, y1, x2, y2, col, wd, dash) {
      g.strokeStyle = col; g.lineWidth = wd || 1.4;
      g.setLineDash(dash || []);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.setLineDash([]);
    }
    function handles(pts, col) {
      g.fillStyle = col || COLORS.sel;
      pts.forEach(function (pt) { g.beginPath(); g.arc(pt[0], pt[1], 4, 0, 7); g.fill(); g.strokeStyle = '#0d1320'; g.lineWidth = 1; g.beginPath(); g.arc(pt[0], pt[1], 4, 0, 7); g.stroke(); });
    }
    arr.forEach(function (d) {
      var sel = d.id === selectedId;
      if (d.type === 'trend') {
        var x1 = pxOf(d.t1, gg), y1 = gg.Y(d.p1), x2 = pxOf(d.t2, gg), y2 = gg.Y(d.p2);
        line(x1, y1, x2, y2, sel ? COLORS.sel : COLORS.trend, sel ? 2 : 1.4);
        if (sel) handles([[x1, y1], [x2, y2]]);
      } else if (d.type === 'hline') {
        var yh = Math.round(gg.Y(d.p)) + .5;
        line(0, yh, cw, yh, sel ? COLORS.sel : COLORS.hline, sel ? 2 : 1.2, [5, 3]);
        if (sel) handles([[8, yh]]);
      } else if (d.type === 'ray') {
        var yr = Math.round(gg.Y(d.p)) + .5, xr = pxOf(d.t, gg);
        line(xr, yr, cw, yr, sel ? COLORS.sel : COLORS.ray, sel ? 2 : 1.2, [5, 3]);
        g.fillStyle = sel ? COLORS.sel : COLORS.ray;
        g.beginPath(); g.moveTo(xr, yr); g.lineTo(xr + 7, yr - 4); g.lineTo(xr + 7, yr + 4); g.closePath(); g.fill();
        if (sel) handles([[xr, yr]]);
      } else if (d.type === 'vline') {
        var xv = pxOf(d.t, gg);
        line(xv, 0, xv, ph, sel ? COLORS.sel : COLORS.vline, sel ? 2 : 1.2, [5, 3]);
        if (sel) handles([[xv, 8]]);
      } else if (d.type === 'rect') {
        var ax = pxOf(d.t1, gg), bx = pxOf(d.t2, gg), ay = gg.Y(d.p1), by = gg.Y(d.p2);
        var rx = Math.min(ax, bx), ry = Math.min(ay, by), rw = Math.abs(bx - ax), rh = Math.abs(by - ay);
        g.fillStyle = sel ? 'rgba(240,106,21,.14)' : 'rgba(95,184,166,.12)';
        g.fillRect(rx, ry, rw, rh);
        g.strokeStyle = sel ? COLORS.sel : COLORS.rect; g.lineWidth = sel ? 2 : 1.2;
        g.strokeRect(rx + .5, ry + .5, rw - 1, rh - 1);
        if (sel) handles([[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]);
      } else if (d.type === 'fib') {
        var fx1 = pxOf(d.t1, gg), fy1 = gg.Y(d.p1), fx2 = pxOf(d.t2, gg), fy2 = gg.Y(d.p2);
        line(fx1, fy1, fx2, fy2, 'rgba(255,179,71,.55)', 1);
        var xa = Math.min(fx1, fx2), xb = Math.max(fx1, fx2);
        fibLevels(d.p1, d.p2).forEach(function (lv) {
          var yy = Math.round(gg.Y(lv.p)) + .5, strong = Math.abs(lv.r - 0.618) < 1e-9;
          line(xa, yy, xb, yy, strong ? COLORS.fib : 'rgba(255,179,71,.55)', strong ? 1.4 : 1, strong ? [] : [4, 4]);
          var lab = (lv.r === 0 ? '0' : lv.r === 1 ? '1' : String(lv.r)) + '  ' + fmtNum(lv.p);
          g.fillStyle = strong ? COLORS.fib : '#7c8aa0';
          g.fillText(lab, Math.min(xb + 4, cw - 66), yy - 2);
        });
        if (sel) handles([[fx1, fy1], [fx2, fy2]]);
      } else if (d.type === 'text') {
        var txp = pxOf(d.t, gg), typ = gg.Y(d.p);
        g.fillStyle = COLORS.text;
        g.beginPath(); g.arc(txp, typ, 2.5, 0, 7); g.fill();
        g.font = '11px sans-serif';
        g.fillText(d.text || '', txp + 6, typ + 4);
        g.font = '10px sans-serif';
        if (sel) { g.strokeStyle = COLORS.sel; g.setLineDash([3, 3]); g.strokeRect(txp - 4.5, typ - 11.5, 12 + (d.text || '').length * 6.5, 18); g.setLineDash([]); }
      } else if (d.type === 'brush' || d.type === 'polyline' || d.type === 'highlighter') {
        /* v1.14.7 — قلم آزاد: خط شکسته از نقطه‌ها.
           v1.14.8 — خط شکسته: همان مسیر + نقطه در هر راس؛ هایلایتر: ضربهٔ پهنِ نیمه‌شفاف. */
        var bp = d.pts || [];
        if (bp.length === 1) {
          g.fillStyle = COLORS.text;
          g.beginPath(); g.arc(pxOf(bp[0].t, gg), gg.Y(bp[0].p), 2.5, 0, 7); g.fill();
        } else if (bp.length > 1) {
          if (d.type === 'highlighter') { g.globalAlpha = 0.35; g.strokeStyle = COLORS.highlighter; g.lineWidth = 10; }
          else { g.strokeStyle = sel ? COLORS.sel : COLORS.text; g.lineWidth = sel ? 2.4 : 2; }
          g.lineJoin = 'round'; g.lineCap = 'round';
          g.beginPath();
          bp.forEach(function (q, qi) { var xx = pxOf(q.t, gg), yy = gg.Y(q.p); if (qi === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); });
          g.stroke(); g.lineWidth = 1; g.globalAlpha = 1;
          if (d.type === 'polyline') {
            g.fillStyle = sel ? COLORS.sel : COLORS.text;
            bp.forEach(function (q) { g.beginPath(); g.arc(pxOf(q.t, gg), gg.Y(q.p), 2, 0, 7); g.fill(); });
          }
        }
        if (sel && bp.length) handles(bp.map(function (q) { return [pxOf(q.t, gg), gg.Y(q.p)]; }));
      } else if (d.type === 'measure') {
        /* v1.14.7 — خط‌کش: خط چین‌دار + برچسب Δقیمت (٪) · کندل‌ها · مدت. */
        var mx1 = pxOf(d.t1, gg), my1 = gg.Y(d.p1), mx2 = pxOf(d.t2, gg), my2 = gg.Y(d.p2);
        line(mx1, my1, mx2, my2, sel ? COLORS.sel : '#8fa3b8', sel ? 2 : 1.4, [5, 3]);
        if (sel) handles([[mx1, my1], [mx2, my2]]);
        var dp = d.p2 - d.p1, pct = (d.p1 && isFinite(d.p1) && d.p1 !== 0) ? dp / d.p1 * 100 : 0;
        var nb = Math.abs(timeToIndex(d.t2) - timeToIndex(d.t1));
        var durMs = Math.abs(d.t2 - d.t1), dur = durMs < 6e4 ? Math.max(1, Math.round(durMs / 1000)) + 's'
          : durMs < 36e5 ? Math.round(durMs / 6e4) + 'm'
          : durMs < 1728e5 ? (Math.floor(durMs / 36e5) + 'h ' + Math.round((durMs % 36e5) / 6e4) + 'm')
          : Math.round(durMs / 864e5) + 'd';
        var lab = (dp >= 0 ? '+' : '') + fmtNum(dp) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%) · ' + nb + ' bars · ' + dur;
        var lx = (mx1 + mx2) / 2, ly = (my1 + my2) / 2;
        g.font = '10px sans-serif';
        var lw = 0;
        try { lw = g.measureText(lab).width; } catch (_) { lw = lab.length * 6; }
        var bx = Math.max(2, Math.min(cw - lw - 12, lx - lw / 2)), by = Math.max(12, Math.min(ph - 14, ly - 20));
        g.fillStyle = 'rgba(5,7,12,.88)';
        if (g.roundRect) g.roundRect(bx - 5, by - 3, lw + 10, 15, 4); else g.rect(bx - 5, by - 3, lw + 10, 15);
        g.fill();
        g.fillStyle = '#e6e9ef';
        g.fillText(lab, bx, by + 8);
      } else if (d.type === 'arrow') {
        var ax1 = pxOf(d.t1, gg), ay1 = gg.Y(d.p1), ax2 = pxOf(d.t2, gg), ay2 = gg.Y(d.p2);
        var acol = sel ? COLORS.sel : COLORS.arrow;
        line(ax1, ay1, ax2, ay2, acol, sel ? 2 : 1.6);
        var ang = Math.atan2(ay2 - ay1, ax2 - ax1), ah = 11;
        g.fillStyle = acol;
        g.beginPath(); g.moveTo(ax2, ay2);
        g.lineTo(ax2 - ah * Math.cos(ang - 0.42), ay2 - ah * Math.sin(ang - 0.42));
        g.lineTo(ax2 - ah * Math.cos(ang + 0.42), ay2 - ah * Math.sin(ang + 0.42));
        g.closePath(); g.fill();
        if (sel) handles([[ax1, ay1], [ax2, ay2]]);
      } else if (d.type === 'circle') {
        var ccx = pxOf(d.t1, gg), ccy = gg.Y(d.p1);
        var cr = Math.max(1, Math.hypot(pxOf(d.t2, gg) - ccx, gg.Y(d.p2) - ccy));
        g.strokeStyle = sel ? COLORS.sel : COLORS.circle; g.lineWidth = sel ? 2 : 1.4;
        g.beginPath(); g.arc(ccx, ccy, cr, 0, 7); g.stroke();
        if (sel) handles([[ccx, ccy], [ccx + cr, ccy]]);
      } else if (d.type === 'ellipse') {
        var ex1 = pxOf(d.t1, gg), ey1 = gg.Y(d.p1), ex2 = pxOf(d.t2, gg), ey2 = gg.Y(d.p2);
        g.strokeStyle = sel ? COLORS.sel : COLORS.ellipse; g.lineWidth = sel ? 2 : 1.4;
        g.beginPath();
        if (g.ellipse) g.ellipse(ex1, ey1, Math.max(1, Math.abs(ex2 - ex1)), Math.max(1, Math.abs(ey2 - ey1)), 0, 0, 7);
        else g.arc(ex1, ey1, Math.max(1, Math.abs(ex2 - ex1)), 0, 7);
        g.stroke();
        if (sel) handles([[ex1, ey1], [ex2, ey2]]);
      } else if (d.type === 'triangle') {
        var tv = triVerts(d, gg);
        var tcol = sel ? COLORS.sel : COLORS.triangle;
        line(tv[0][0], tv[0][1], tv[1][0], tv[1][1], tcol, sel ? 2 : 1.4);
        line(tv[1][0], tv[1][1], tv[2][0], tv[2][1], tcol, sel ? 2 : 1.4);
        line(tv[2][0], tv[2][1], tv[0][0], tv[0][1], tcol, sel ? 2 : 1.4);
        if (sel) handles(tv);
      } else if (d.type === 'channel') {
        var mx1 = pxOf(d.t1, gg), my1 = gg.Y(d.p1), mx2 = pxOf(d.t2, gg), my2 = gg.Y(d.p2);
        var ox = pxOf(d.t3, gg) - mx1, oy = gg.Y(d.p3) - my1;
        var chcol = sel ? COLORS.sel : COLORS.channel;
        g.fillStyle = sel ? 'rgba(240,106,21,.10)' : 'rgba(165,143,214,.10)';
        g.beginPath(); g.moveTo(mx1, my1); g.lineTo(mx2, my2); g.lineTo(mx2 + ox, my2 + oy); g.lineTo(mx1 + ox, my1 + oy); g.closePath(); g.fill();
        line(mx1, my1, mx2, my2, chcol, sel ? 2 : 1.4);
        line(mx1 + ox, my1 + oy, mx2 + ox, my2 + oy, chcol, sel ? 2 : 1.4);
        if (sel) handles([[mx1, my1], [mx2, my2], [mx1 + ox, my1 + oy]]);
      } else if (d.type === 'fibext') {
        var fx1 = pxOf(d.t1, gg), fy1 = gg.Y(d.p1), fx2 = pxOf(d.t2, gg), fy2 = gg.Y(d.p2);
        line(fx1, fy1, fx2, fy2, 'rgba(255,179,71,.55)', 1);
        var xa = Math.min(fx1, fx2), xb = Math.max(fx1, fx2);
        extLevels(d.p1, d.p2).forEach(function (lv) {
          var yy = Math.round(gg.Y(lv.p)) + .5, strong = Math.abs(lv.r - 1.618) < 1e-9;
          line(xa, yy, xb, yy, strong ? COLORS.fibext : 'rgba(255,179,71,.55)', strong ? 1.4 : 1, strong ? [] : [4, 4]);
          var lab = String(lv.r) + '  ' + fmtNum(lv.p);
          g.fillStyle = strong ? COLORS.fibext : '#7c8aa0';
          g.fillText(lab, Math.min(xb + 4, cw - 66), yy - 2);
        });
        if (sel) handles([[fx1, fy1], [fx2, fy2]]);
      } else if (d.type === 'fibfan') {
        var fnx1 = pxOf(d.t1, gg), fny1 = gg.Y(d.p1), fnx2 = pxOf(d.t2, gg);
        var fncol = sel ? COLORS.sel : COLORS.fibfan;
        FAN_RATIOS.forEach(function (r) {
          var fy2 = gg.Y(lerp(d.p1, d.p2, r));
          var fdx = fnx2 - fnx1;
          if (Math.abs(fdx) < 1) return;
          var fey = fny1 + (fy2 - fny1) / fdx * (cw - fnx1);
          line(fnx1, fny1, cw, fey, fncol, r === 0.618 ? 1.4 : 1, r === 0.618 ? [] : [4, 4]);
          g.fillStyle = r === 0.618 ? fncol : '#7c8aa0';
          g.fillText(String(r), Math.min(fnx2 + 3, cw - 24), fny1 + (fy2 - fny1) / fdx * (fnx2 - fnx1) - 3);
        });
        if (sel) handles([[fnx1, fny1], [fnx2, gg.Y(d.p2)]]);
      } else if (d.type === 'pitchfork') {
        var pk = forkLines(d, gg);
        var pkcol = sel ? COLORS.sel : COLORS.pitchfork;
        line(pk[0][0], pk[0][1], pk[0][2], pk[0][3], pkcol, sel ? 2 : 1.4);
        line(pk[1][0], pk[1][1], pk[1][2], pk[1][3], pkcol, 1.2, [5, 3]);
        line(pk[2][0], pk[2][1], pk[2][2], pk[2][3], pkcol, 1.2, [5, 3]);
        if (sel) handles([[pxOf(d.t1, gg), gg.Y(d.p1)], [pxOf(d.t2, gg), gg.Y(d.p2)], [pxOf(d.t3, gg), gg.Y(d.p3)]]);
      } else if (d.type === 'pricelabel') {
        var lx = pxOf(d.t, gg), ly = gg.Y(d.p);
        var lab = fmtNum(d.p);
        g.font = 'bold 10px sans-serif';
        var lw = 0;
        try { lw = g.measureText(lab).width; } catch (_) { lw = lab.length * 6; }
        g.fillStyle = sel ? COLORS.sel : '#e6e9ef';
        g.beginPath();
        if (g.roundRect) g.roundRect(lx + 6, ly - 9, lw + 12, 16, 4); else g.rect(lx + 6, ly - 9, lw + 12, 16);
        g.fill();
        g.fillStyle = '#0a0f1a';
        g.fillText(lab, lx + 12, ly + 2.5);
        g.font = '10px sans-serif';
        g.fillStyle = sel ? COLORS.sel : COLORS.pricelabel;
        g.beginPath(); g.arc(lx, ly, 2.5, 0, 7); g.fill();
        if (sel) handles([[lx, ly]]);
      }
    });
    /* v1.14.7 — stroke زندهٔ قلم آزاد (هنوز نهایی نشده) با همان سبک brush رسم می‌شود.
       v1.14.8 — سبک زنده بر اساس نوع stroke (هایلایتر: پهن و نیمه‌شفاف). */
    if (liveBrush && liveBrush.pts && liveBrush.pts.length > 1) {
      var lt = liveBrush.type || 'brush';
      if (lt === 'highlighter') { g.globalAlpha = 0.35; g.strokeStyle = COLORS.highlighter; g.lineWidth = 10; }
      else { g.strokeStyle = COLORS.text; g.lineWidth = 2; }
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath();
      liveBrush.pts.forEach(function (q, qi) { var xx = pxOf(q.t, gg), yy = gg.Y(q.p); if (qi === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); });
      g.stroke(); g.lineWidth = 1; g.globalAlpha = 1;
    }
    /* نقطهٔ اولِ در انتظار + خط راهنما تا پیش‌نمایش (کشیدن) */
    if (pending) {
      var ppx = pxOf(pending.t, gg), ppy = gg.Y(pending.p);
      g.fillStyle = activeTool === 'hline' ? COLORS.hline : COLORS.trend;
      g.beginPath(); g.arc(ppx, ppy, 3.5, 0, 7); g.fill();
      if (pending2) {
        /* v1.14.8 — ابزار سه‌نقطه‌ای: خط اولِ قطعی + خط راهنما از نقطهٔ دوم تا پیش‌نمایش. */
        var qx = pxOf(pending2.t, gg), qy = gg.Y(pending2.p);
        line(ppx, ppy, qx, qy, 'rgba(230,233,239,.7)', 1.2);
        g.fillStyle = COLORS.trend;
        g.beginPath(); g.arc(qx, qy, 3.5, 0, 7); g.fill();
        if (preview) line(qx, qy, preview.x, preview.y, 'rgba(230,233,239,.5)', 1, [4, 4]);
      } else if (preview) line(ppx, ppy, preview.x, preview.y, 'rgba(230,233,239,.5)', 1, [4, 4]);
    }
    g.restore();
    /* برچسب قیمت خط‌های افقی روی محور قیمت (بیرون clip) */
    arr.forEach(function (d) {
      if (d.type !== 'hline' && d.type !== 'ray') return;
      var yy2 = Math.round(gg.Y(d.p)) + .5;
      if (yy2 < 9 || yy2 > ph - 9) return;
      var col = d.id === selectedId ? COLORS.sel : (d.type === 'ray' ? COLORS.ray : COLORS.hline);
      g.fillStyle = col;
      g.beginPath();
      if (g.roundRect) g.roundRect(cw + 1, yy2 - 8, W - cw - 2, 16, 3); else g.rect(cw + 1, yy2 - 8, W - cw - 2, 16);
      g.fill();
      g.fillStyle = '#0a0f1a'; g.font = 'bold 10px sans-serif';
      g.fillText(fmtNum(d.p), cw + 5, yy2 + 3.5);
      g.font = '10px sans-serif';
    });
  }

  /* ---- همگام‌سازی دکمه‌های پنل با حالت موتور ---- */
  function syncUI() {
    try {
      if (typeof document === 'undefined') return;
      var btns = document.querySelectorAll ? document.querySelectorAll('#drawTools .tbtn') : [];
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.classList && b.classList.toggle) {
          /* v1.14.7 — نشانگر وقتی روشن است که هیچ ابزار رسم فعال نیست؛ آهنربا حالت خودش را دارد. */
          var on = (b.dataset && b.dataset.draw === 'cursor') ? !activeTool
            : (b.dataset && b.dataset.draw === 'magnet') ? magnetOn
            : (!!activeTool && b.dataset && b.dataset.draw === activeTool);
          b.classList.toggle('on', on);
        }
      }
      var del = document.getElementById ? document.getElementById('delDrawBtn') : null;
      if (del) del.disabled = !selectedId;
    } catch (_) {}
  }
  function resetSession() { pending = null; pending2 = null; preview = null; selectedId = null; moveStart = null; liveBrush = null; syncUI(); }

  window.OnellaDraw = {
    list: function () { return list(); },
    sym: sym,
    add: add,
    remove: remove,
    removeSelected: removeSelected,
    clearCurrent: clearCurrent,
    select: select,
    selected: function () { return selectedId; },
    tool: function () { return activeTool; },
    setTool: setTool, magnet: function () { return magnetOn; }, setMagnet: setMagnet,
    pending: function () { return pending; },
    setPreview: setPreview,
    tap: tap,
    completeDrag: completeDrag,
    startMove: startMove,
    moveTo: moveTo,
    endMove: endMove,
    draw: draw,
    hitTest: hitTest,
    hitTestXY: hitTestXY,
    pointFromXY: pointFromXY,
    timeToIndex: timeToIndex,
    fibLevels: fibLevels,
    reload: reload,
    syncUI: syncUI,
    resetSession: resetSession
  };
})();
