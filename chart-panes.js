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
  var on = { rsi: true, macd: true };
  try { var r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r) { if (typeof r.rsi === 'boolean') on.rsi = r.rsi; if (typeof r.macd === 'boolean') on.macd = r.macd; } } catch (_) {}
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
  function fmtNum(v) { try { return typeof fmt === 'function' ? fmt(v) : String(v); } catch (_) { return String(v); } }
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

  function drawRsi(cs, off, n, st, cw) {
    var c = paneCtx('rsiCv'), valEl = document.getElementById('rsiVal');
    var s = rsiSeries(closesOf(cs), 14);
    if (!c || !s) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    var last = s[s.length - 1];
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
  }

  function drawMacd(cs, off, n, st, cw) {
    var c = paneCtx('macdCv'), valEl = document.getElementById('macdVal');
    var m = macdSeries(closesOf(cs));
    if (!c || !m) { if (valEl) valEl.textContent = 'در دسترس نیست'; return; }
    var last = m.hist[m.hist.length - 1];
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
  }

  function drawPanes() {
    var G = window.__geo, cs = window.cs;
    if (!G || G.off == null || !Array.isArray(cs) || !cs.length) return;
    var st = G.st || 7, cw = (G.W || 0) - (G.pw || 46);
    var n = Math.min(cs.length - G.off, Math.floor(cw / st));
    if (n < 2) return;
    if (on.rsi) { try { drawRsi(cs, G.off, n, st, cw); } catch (_) {} }
    if (on.macd) { try { drawMacd(cs, G.off, n, st, cw); } catch (_) {} }
  }

  function applyVis() {
    var r1 = document.getElementById('rsiRow'), r2 = document.getElementById('macdRow');
    if (r1) r1.style.display = on.rsi ? '' : 'none';
    if (r2) r2.style.display = on.macd ? '' : 'none';
    var b1 = document.getElementById('rsiBtn'), b2 = document.getElementById('macdBtn');
    if (b1) b1.classList.toggle('on', !!on.rsi);
    if (b2) b2.classList.toggle('on', !!on.macd);
  }

  window.drawPanes = drawPanes;
  window.rsiSeries = rsiSeries;
  window.macdSeries = macdSeries;
  window.OnellaPanes = {
    get on() { return on; },
    toggle: function (id) { if (id === 'rsi' || id === 'macd') { on[id] = !on[id]; save(); applyVis(); try { drawPanes(); } catch (_) {} } },
    applyVis: applyVis
  };
})();
