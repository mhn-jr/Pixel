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
  var COLORS = { trend: '#ffb347', hline: '#7aa2d6', rect: '#5fb8a6', fib: '#ffb347', text: '#e6e9ef', ray: '#5fb8a6', vline: '#8fa3b8', sel: '#f06a15' };
  var store = {};
  var activeTool = null, pending = null, preview = null, selectedId = null, moveStart = null;
  var idSeq = 0;

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
    return { t: cs[idx].t, idx: idx, p: G.inv(yy), x: x, y: y };
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
  function clearCurrent() { store[sym()] = []; selectedId = null; pending = null; preview = null; save(); syncUI(); }
  function select(id) { selectedId = id || null; syncUI(); }
  function reload() { load(); }

  /* ---- فیبوناچی: سطوح از همان lerp چارت (خطی/لگاریتمی مثل فیبوی محاسبه‌شده) ---- */
  function fibLevels(p1, p2) {
    return FIB_RATIOS.map(function (r) { return { r: r, p: lerp(p1, p2, r) }; });
  }

  /* ---- ابزار فعال + ضربه ---- */
  function setTool(t) {
    if (activeTool === t) { activeTool = null; }
    else { activeTool = t; selectedId = null; }
    pending = null; preview = null;
    syncUI();
    return activeTool;
  }
  function setPreview(pt) { preview = pt || null; }
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
    if (activeTool === 'trend' || activeTool === 'rect' || activeTool === 'fib') {
      if (!pending) { pending = { t: pt.t, p: pt.p }; return 'pending'; }
      add({ type: activeTool, t1: pending.t, p1: pending.p, t2: pt.t, p2: pt.p });
      pending = null; preview = null;
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
    if (activeTool === 'hline') { add({ type: 'hline', p: b.p }); syncUI(); return 'placed'; }
    if (activeTool === 'ray') { add({ type: 'ray', t: a.t, p: a.p }); syncUI(); return 'placed'; }
    if (activeTool === 'vline') { add({ type: 'vline', t: a.t }); syncUI(); return 'placed'; }
    if (activeTool === 'text') return null;
    add({ type: activeTool, t1: a.t, p1: a.p, t2: b.t, p2: b.p });
    pending = null; preview = null;
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
    else if (d.type === 'text') { d.t = shiftT(s.t); d.p = s.p + dP; }
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
  function hitTest(x, y, o) {
    var g = geom(o);
    if (!g) return null;
    var arr = list();
    for (var k = arr.length - 1; k >= 0; k--) {
      var d = arr[k];
      if (d.type === 'trend') {
        if (distSeg(x, y, pxOf(d.t1, g), g.Y(d.p1), pxOf(d.t2, g), g.Y(d.p2)) < 12) return d;
      } else if (d.type === 'fib') {
        if (distSeg(x, y, pxOf(d.t1, g), g.Y(d.p1), pxOf(d.t2, g), g.Y(d.p2)) < 12) return d;
        var x1 = pxOf(d.t1, g), x2 = pxOf(d.t2, g), xa = Math.min(x1, x2), xb = Math.max(x1, x2);
        if (x >= xa - 6 && x <= xb + 6) {
          var lv = fibLevels(d.p1, d.p2), j;
          for (j = 0; j < lv.length; j++) if (Math.abs(y - g.Y(lv[j].p)) < 8) return d;
        }
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
      }
    });
    /* نقطهٔ اولِ در انتظار + خط راهنما تا پیش‌نمایش (کشیدن) */
    if (pending) {
      var ppx = pxOf(pending.t, gg), ppy = gg.Y(pending.p);
      g.fillStyle = activeTool === 'hline' ? COLORS.hline : COLORS.trend;
      g.beginPath(); g.arc(ppx, ppy, 3.5, 0, 7); g.fill();
      if (preview) line(ppx, ppy, preview.x, preview.y, 'rgba(230,233,239,.5)', 1, [4, 4]);
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
        if (b.classList && b.classList.toggle) b.classList.toggle('on', !!activeTool && b.dataset && b.dataset.draw === activeTool);
      }
      var del = document.getElementById ? document.getElementById('delDrawBtn') : null;
      if (del) del.disabled = !selectedId;
    } catch (_) {}
  }
  function resetSession() { pending = null; preview = null; selectedId = null; moveStart = null; syncUI(); }

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
    setTool: setTool,
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
