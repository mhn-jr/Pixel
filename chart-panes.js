/* Mini App v1.3.0 — پنل اندیکاتور (مرحلهٔ ۲ چارت حرفه‌ای): RSI و MACD زیر چارت اصلی.
   سری‌ها از همان فرمول تحلیل موجود (analysis-src.js) می‌آیند، فقط به‌صورت سری:
   - rsiSeries: همان حلقهٔ وایلدرِ rsi() — مقدار آخرش دقیقاً برابر rsi(closes,14) است.
   - macdSeries: همان emaSeries(12/26/9) که macd() استفاده می‌کند — مقدار آخرش
     دقیقاً برابر macd(closes) است. هیچ فرمول دومی نیست.
   پنل‌ها همان پنجرهٔ دیده‌شدهٔ چارت اصلی را می‌کشند (off/st از window.__geo) و
   با هر draw() دوباره رسم می‌شوند (قلاب آخر draw در native-chart.js).
   بدون دادهٔ کافی، پنل «در دسترس نیست» می‌گیرد — هرگز عدد ساختگی نیست. */
(function () {
  var KEY = 'onella_panes_v1';
  var on = { rsi: true, macd: true, stoch: false, obv: false };
  try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r) { if (typeof r.rsi === 'boolean') on.rsi = r.rsi; if (typeof r.macd === 'boolean') on.macd = r.macd; if (typeof r.stoch === 'boolean') on.stoch = r.stoch; if (typeof r.obv === 'boolean') on.obv = r.obv; } } catch (_) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (_) {} }

  function closesOf(cs) { return cs.map(function (c) { return c.c; }); }

  /* RSI وایلدر (۱۴) به‌صورت سری — همان حلقهٔ rsi() در analysis-src.js. */
  function rsiSeries(closes, n) {
    n = n || 14;
    if (!Array.isArray(closes) || closes.length < n + 1) return null;
    var out = new Array(closes.length), i;
    for (i = 0; i <= n; i++) out[i] = null;
    var avgG = 0, avgL = 0;
    for (i = 1; i <= n; i++) { var d = closes[i] - closes[i - 1]; if (d > 0) avgG += d; else avgL -= d; }
    avgG /= n; avgL /= n;
    out[n] = avgL === 0 ? (avgG === 0 ? 50 : 100) : 100 - 100 / (1 + avgG / avgL);
    for (i = n + 1; i < closes.length; i++) {
      var dd = closes[i] - closes[i - 1], g = dd > 0 ? dd : 0, l = dd < 0 ? -dd : 0;
      avgG = (avgG * (n - 1) + g) / n; avgL = (avgL * (n - 1) + l) / n;
      out[i] = avgL === 0 ? (avgG === 0 ? 50 : 100) : 100 - 100 / (1 + avgG / avgL);
    }
    return out;
  }

  /* MACD (12/26/9) به‌صورت سری — همان emaSeries که mac() در analysis-src.js
     استفاده می‌کند؛ مقدار آخر خط/سیگنال/هیستوگرام دقیقاً برابر macd(closes) است. */
  function macdSeries(closes) {
    if (!Array.isArray(closes) || closes.length < 35) return null;
    var A = window.OnellaAnalysis;
    if (!A || typeof A.emaSeries !== 'function') return null;
    var e12 = A.emaSeries(closes, 12), e26 = A.emaSeries(closes, 26);
    if (!e12 || !e26) return null;
    var line = e12.map(function (v, i) { return v - e26[i]; });
    var sig = A.emaSeries(line, 9);
    if (!sig) return null;
    var hist = line.map(function (v, i) { return v - sig[i]; });
    return { line: line, signal: sig, hist: hist };
  }

  /* v1.9.0 — استوکاستیک (۱۴، ۳، ۳) به‌صورت سری؛ همان فرمول stoch() در
     analysis-src.js (بازهٔ ۱۴ کندل، %D = میانگین ۳تایی %K). */
  function stochSeries(cs, n, smooth) {
    n = n || 14; smooth = smooth || 3;
    if (!Array.isArray(cs) || cs.length < n + smooth) return null;
    var k = [], i, j;
    for (i = 0; i < cs.length; i++) {
      if (i < n - 1) { k.push(null); continue; }
      var hi = -Infinity, lo = Infinity;
      for (j = i - n + 1; j <= i; j++) { if (cs[j].h > hi) hi = cs[j].h; if (cs[j].l < lo) lo = cs[j].l; }
      k.push(hi > lo ? 100 * (cs[i].c - lo) / (hi - lo) : 50);
    }
    var d = [];
    for (i = 0; i < cs.length; i++) {
      if (i < n - 1 + smooth - 1) { d.push(null); continue; }
      var s = 0, cnt = 0;
      for (j = i - smooth + 1; j <= i; j++) if (k[j] != null) { s += k[j]; cnt++; }
      d.push(cnt ? s / cnt : null);
    }
    return { k: k, d: d };
  }
  /* v1.9.0 — OBV تجمعی؛ بدون حجم معتبر null (هرگز عدد ساختگی نیست). */
  function obvSeries(cs) {
    if (!Array.isArray(cs) || cs.length < 2) return null;
    var hasVol = false, i;
    for (i = 0; i < cs.length; i++) if (typeof cs[i].v === 'number' && cs[i].v > 0) { hasVol = true; break; }
    if (!hasVol) return null;
    var out = [0];
    for (i = 1; i < cs.length; i++) {
      var v = (typeof cs[i].v === 'number' && cs[i].v > 0) ? cs[i].v : 0;
      var dd = cs[i].c - cs[i - 1].c;
      out.push(out[i - 1] + (dd > 0 ? v : dd < 0 ? -v : 0));
    }
    return out;
  }
  function compactNum(v) {
    if (v == null || !isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return String(Math.round(v));
  }
  function paneCtx(id) {
    var cv = document.getElementById(id);
    if (!cv) return null;
    var W = cv.clientWidth || 0, H = cv.clientHeight || 0;
    if (!W || !H) return null;
    var D = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * D; cv.height = H * D;
    var g = cv.getContext('2d');
    if (!g) return null;
    g.setTransform(D, 0, 0, D, 0, 0);
    return { g: g, W: W, H: H };
  }
  function fmtNum(v) { try { var m = window.__dispMul; m = (typeof m === 'number' && isFinite(m) && m > 0) ? m : 1; return typeof fmt === 'function' ? fmt(v * m) : String(v); } catch (_) { return String(v); } }
  function drawLine(g, arr, off, n, X, Y, col, wd) {
    g.strokeStyle = col; g.lineWidth = wd || 1.4; g.beginPath();
    var started = false;
    for (var i = 0; i < n; i++) {
      var v = arr[off + i];
      if (v == null || !isFinite(v)) continue;
      if (!started) { g.moveTo(X(i), Y(v)); started = true; } else g.lineTo(X(i), Y(v));
    }
    g.stroke();
  }
  /* v1.9.1 — خط عمودی کراس‌هیر روی پنل‌ها هم ادامه می‌یابد (سبک تریدینگ‌ویو:
     نشانگر فقط روی چارت اصلی نیست؛ در همهٔ صفحه حرکت می‌کند). */
  function xhLineInPane(g, H, X, n) {
    var cur = window.cur;
    if (typeof cur !== 'number' || cur < 0 || cur >= n) return;
    try {
      g.strokeStyle = 'rgba(200,215,240,.4)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X(cur), 0); g.lineTo(X(cur), H); g.stroke();
    } catch (_) {}
  }

  function drawRsi(cs, off, n, st, cw) {
    var c = paneCtx('rsiCv'), valEl = document.getElementById('rsiVal');
    var s = rsiSeries(closesOf(cs), 14);
    if (!c || !s) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    /* v1.14.8 — با کراس‌هیر فعال، مقدار همان کندلِ زیر نشانگر نشان داده می‌شود؛ وگرنه آخرین مقدار. */
    var vi = (typeof window.cur === 'number' && window.cur >= 0 && window.cur < n) ? off + window.cur : s.length - 1;
    var last = s[vi];
    if (valEl) valEl.textContent = (last == null ? 'در دسترس نیست' : last.toFixed(1));
    var g = c.g, H = c.H;
    var Y = function (v) { return 4 + (100 - v) / 100 * (H - 8); };
    var X = function (i) { return i * st + st / 2; };
    g.font = '10px sans-serif'; g.textAlign = 'start';
    [70, 50, 30].forEach(function (lv) {
      var y = Math.round(Y(lv)) + .5;
      g.strokeStyle = lv === 50 ? 'rgba(120,140,170,.18)' : 'rgba(120,140,170,.30)';
      g.setLineDash(lv === 50 ? [2, 3] : [4, 4]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#7c8aa0'; g.fillText(String(lv), cw + 5, y + 3.5);
    });
    drawLine(g, s, off, n, X, Y, '#a58fd6', 1.4);
    var lv2 = s[off + n - 1];
    if (lv2 != null && isFinite(lv2)) { g.fillStyle = '#a58fd6'; g.beginPath(); g.arc(X(n - 1), Y(lv2), 2.5, 0, 7); g.fill(); }
    xhLineInPane(g, H, X, n);
  }

  function drawMacd(cs, off, n, st, cw) {
    var c = paneCtx('macdCv'), valEl = document.getElementById('macdVal');
    var m = macdSeries(closesOf(cs));
    if (!c || !m) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    /* v1.14.8 — با کراس‌هیر فعال، هیستوگرام همان کندلِ زیر نشانگر؛ وگرنه آخرین مقدار. */
    var vi = (typeof window.cur === 'number' && window.cur >= 0 && window.cur < n) ? off + window.cur : m.hist.length - 1;
    var last = m.hist[vi];
    if (valEl) valEl.textContent = (last == null ? 'در دسترس نیست' : (last >= 0 ? '+' : '') + fmtNum(last));
    var g = c.g, H = c.H;
    var mn = Infinity, mx = -Infinity, i, j;
    for (i = 0; i < n; i++) {
      j = off + i;
      [m.line[j], m.signal[j], m.hist[j]].forEach(function (v) { if (v == null || !isFinite(v)) return; if (v < mn) mn = v; if (v > mx) mx = v; });
    }
    if (!isFinite(mn) || !isFinite(mx)) return;
    if (mx - mn < 1e-12) { mx += 1; mn -= 1; }
    var pad = (mx - mn) * 0.08; mx += pad; mn -= pad;
    var Y = function (v) { return 4 + (mx - v) / (mx - mn) * (H - 8); };
    var X = function (k) { return k * st + st / 2; };
    var yz = Math.round(Y(0)) + .5;
    g.strokeStyle = 'rgba(120,140,170,.30)'; g.setLineDash([4, 4]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, yz); g.lineTo(cw, yz); g.stroke(); g.setLineDash([]);
    var bw = Math.max(1, Math.round(st * .62));
    for (i = 0; i < n; i++) {
      var h = m.hist[off + i];
      if (h == null || !isFinite(h)) continue;
      g.fillStyle = h >= 0 ? 'rgba(46,204,143,.55)' : 'rgba(255,93,108,.55)';
      var y0 = Y(0), y1 = Y(h);
      g.fillRect(Math.floor(X(i)) - (bw - 1) / 2, Math.min(y0, y1), bw, Math.max(1, Math.abs(y1 - y0)));
    }
    drawLine(g, m.line, off, n, X, Y, '#7aa2d6', 1.4);
    drawLine(g, m.signal, off, n, X, Y, '#d6a55f', 1.2);
    g.fillStyle = '#7c8aa0'; g.font = '10px sans-serif'; g.textAlign = 'start';
    g.fillText(fmtNum(mx), cw + 5, 12);
    g.fillText(fmtNum(mn), cw + 5, H - 4);
    xhLineInPane(g, H, X, n);
  }

  function drawStoch(cs, off, n, st, cw) {
    var c = paneCtx('stochCv'), valEl = document.getElementById('stochVal');
    var s = stochSeries(cs, 14, 3);
    if (!c || !s) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    /* v1.14.8 — با کراس‌هیر فعال، مقدار همان کندلِ زیر نشانگر؛ وگرنه آخرین مقدار. */
    var vi = (typeof window.cur === 'number' && window.cur >= 0 && window.cur < n) ? off + window.cur : s.k.length - 1;
    var last = s.k[vi];
    if (valEl) valEl.textContent = (last == null ? 'در دسترس نیست' : last.toFixed(1));
    var g = c.g, H = c.H;
    var Y = function (v) { return 4 + (100 - v) / 100 * (H - 8); };
    var X = function (i) { return i * st + st / 2; };
    g.font = '10px sans-serif'; g.textAlign = 'start';
    [80, 50, 20].forEach(function (lv) {
      var y = Math.round(Y(lv)) + .5;
      g.strokeStyle = lv === 50 ? 'rgba(120,140,170,.18)' : 'rgba(120,140,170,.30)';
      g.setLineDash(lv === 50 ? [2, 3] : [4, 4]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#7c8aa0'; g.fillText(String(lv), cw + 5, y + 3.5);
    });
    drawLine(g, s.k, off, n, X, Y, '#a58fd6', 1.4);
    drawLine(g, s.d, off, n, X, Y, '#d6a55f', 1.2);
    var lv2 = s.k[off + n - 1];
    if (lv2 != null && isFinite(lv2)) { g.fillStyle = '#a58fd6'; g.beginPath(); g.arc(X(n - 1), Y(lv2), 2.5, 0, 7); g.fill(); }
    xhLineInPane(g, H, X, n);
  }
  function drawObv(cs, off, n, st, cw) {
    var c = paneCtx('obvCv'), valEl = document.getElementById('obvVal');
    var s = obvSeries(cs);
    if (!c || !s) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    /* v1.14.8 — با کراس‌هیر فعال، مقدار همان کندلِ زیر نشانگر؛ وگرنه آخرین مقدار. */
    var vi = (typeof window.cur === 'number' && window.cur >= 0 && window.cur < n) ? off + window.cur : s.length - 1;
    var last = s[vi];
    if (valEl) valEl.textContent = compactNum(last);
    var g = c.g, H = c.H;
    var mn = Infinity, mx = -Infinity, i;
    for (i = 0; i < n; i++) { var v = s[off + i]; if (v == null || !isFinite(v)) continue; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (!isFinite(mn) || !isFinite(mx)) return;
    if (mx - mn < 1e-12) { mx += 1; mn -= 1; }
    var pad = (mx - mn) * 0.08; mx += pad; mn -= pad;
    var Y = function (v) { return 4 + (mx - v) / (mx - mn) * (H - 8); };
    var X = function (k) { return k * st + st / 2; };
    drawLine(g, s, off, n, X, Y, '#5fb8a6', 1.4);
    var lv2 = s[off + n - 1];
    if (lv2 != null && isFinite(lv2)) { g.fillStyle = '#5fb8a6'; g.beginPath(); g.arc(X(n - 1), Y(lv2), 2.5, 0, 7); g.fill(); }
    xhLineInPane(g, H, X, n);
  }

  function drawPanes() {
    var G = window.__geo, cs = window.cs;
    if (!G || G.off == null || !Array.isArray(cs) || !cs.length) return;
    var st = G.st || 7, cw = (G.W || 0) - (G.pw || 46);
    var n = Math.min(cs.length - G.off, Math.floor(cw / st));
    if (n < 2) return;
    if (on.rsi) { try { drawRsi(cs, G.off, n, st, cw); } catch (_) {} }
    if (on.macd) { try { drawMacd(cs, G.off, n, st, cw); } catch (_) {} }
    if (on.stoch) { try { drawStoch(cs, G.off, n, st, cw); } catch (_) {} }
    if (on.obv) { try { drawObv(cs, G.off, n, st, cw); } catch (_) {} }
  }

  function applyVis() {
    var r1 = document.getElementById('rsiRow'), r2 = document.getElementById('macdRow'), r3 = document.getElementById('stochRow'), r4 = document.getElementById('obvRow');
    if (r1) r1.style.display = on.rsi ? '' : 'none';
    if (r2) r2.style.display = on.macd ? '' : 'none';
    if (r3) r3.style.display = on.stoch ? '' : 'none';
    if (r4) r4.style.display = on.obv ? '' : 'none';
    /* v1.14.8 — سوییچ‌های پنل در تنظیمات چارت (جایگزین دکمه‌های نوار ابزار پایین). */
    var s1 = document.getElementById('setPaneRsi'), s2 = document.getElementById('setPaneMacd'), s3 = document.getElementById('setPaneStoch'), s4 = document.getElementById('setPaneObv');
    if (s1) s1.classList.toggle('on', !!on.rsi);
    if (s2) s2.classList.toggle('on', !!on.macd);
    if (s3) s3.classList.toggle('on', !!on.stoch);
    if (s4) s4.classList.toggle('on', !!on.obv);
  }

  /* v1.14.8 — ژست پنل‌های اندیکاتور: کشیدنِ افقی/ضربه کراس‌هیر را جابه‌جا می‌کند
     (مثل چارت اصلی)؛ کشیدنِ عمودی صفحه را اسکرول می‌کند (touch-action: pan-y
     در CSS + بدون setPointerCapture، تا مرورگر اسکرول عمودی را بگیرد). */
  function paneIndexFromX(cv, clientX) {
    var G = window.__geo, cs = window.cs;
    if (!G || !Array.isArray(cs) || !cs.length) return -1;
    var r = null;
    try { r = cv.getBoundingClientRect(); } catch (_) {}
    var x = r ? clientX - r.left : clientX;
    var st = G.st || 7;
    var cw = (G.W || 0) - (G.pw || 46);
    var n = Math.min(cs.length - G.off, Math.floor(cw / st));
    if (n < 2) return -1;
    var i = Math.floor(x / st);
    if (i < 0) i = 0;
    if (i > n - 1) i = n - 1;
    return i;
  }
  function paneScrub(cv, clientX) {
    var i = paneIndexFromX(cv, clientX);
    if (i < 0) return false;
    try {
      if (typeof window.__pinXh === 'function') { window.__pinXh(i); return true; }
    } catch (_) {}
    window.cur = i;
    window.__xhPrice = null;
    try { if (typeof window.head === 'function') window.head(); } catch (_) {}
    try { if (typeof window.draw === 'function') window.draw(); } catch (_) {}
    return true;
  }
  function attachPaneGestures() {
    ['rsiCv', 'macdCv', 'stochCv', 'obvCv'].forEach(function (id) {
      var cv = document.getElementById(id);
      if (!cv || cv.__paneGestures) return;
      cv.__paneGestures = true;
      var startX = null, startY = null;
      cv.addEventListener('pointerdown', function (e) {
        startX = e.clientX; startY = e.clientY;
        paneScrub(cv, e.clientX);
      });
      cv.addEventListener('pointermove', function (e) {
        if (startX == null) return;
        /* فقط حرکتِ عمدتاً افقی کراس‌هیر را می‌برد؛ حرکت عمودی را مرورگر اسکرول می‌کند. */
        if (Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) paneScrub(cv, e.clientX);
      });
      function end() { startX = null; startY = null; }
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
    });
  }

  window.drawPanes = drawPanes;
  window.rsiSeries = rsiSeries;
  window.macdSeries = macdSeries;
  window.stochSeries = stochSeries;
  window.obvSeries = obvSeries;
  window.OnellaPanes = {
    get on() { return on; },
    toggle: function (id) { if (id === 'rsi' || id === 'macd' || id === 'stoch' || id === 'obv') { on[id] = !on[id]; save(); applyVis(); try { drawPanes(); } catch (_) {} } },
    applyVis: applyVis,
    attachPaneGestures: attachPaneGestures
  };
})();
