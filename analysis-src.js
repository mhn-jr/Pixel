'use strict';
(function () {
/* Onella Telegram Bot — موتور تحلیل تکنیکال محلی (v1.8.0).
   صفر وابستگی، محاسباتی، بدون مدل زبانی: عددها را همین توابع از روی کندل‌ها
   حساب می‌کنند؛ مدل زبانی هیچ عددی نمی‌سازد (قانون جداسازی ۲۰۲۶-۱۰-۲۰).
   روش تحلیل هر بازار با بازار دیگر فرق می‌کند (دستور مالک ۲۰۲۶-۱۱-۰۸) —
   روش هر بازار در METHODS است و سرِ پیام تحلیل نوشته می‌شود، تا معلوم باشد
   یک قالب برای همه استفاده نشده است. تحلیل توصیفی است: روند، مومنتوم، نوسان
   و سطوح — نه سیگنال، نه پیش‌بینی، نه هدف، نه توصیهٔ معامله. */

function sma(values, n) {
  if (!Array.isArray(values) || values.length < n) return null;
  let s = 0;
  for (let i = values.length - n; i < values.length; i++) s += values[i];
  return s / n;
}

function ema(values, n) {
  if (!Array.isArray(values) || values.length < n) return null;
  const k = 2 / (n + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function emaSeries(values, n) {
  if (!Array.isArray(values) || values.length < n) return null;
  const k = 2 / (n + 1);
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k));
  return out;
}

// RSI وایلدر (۱۴) — هموارسازی کلاسیک روی کل سری، نه فقط پنجرهٔ آخر.
function rsi(closes, n) {
  n = n || 14;
  if (!Array.isArray(closes) || closes.length < n + 1) return null;
  let avgG = 0, avgL = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgG += d; else avgL -= d;
  }
  avgG /= n; avgL /= n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0, l = d < 0 ? -d : 0;
    avgG = (avgG * (n - 1) + g) / n;
    avgL = (avgL * (n - 1) + l) / n;
  }
  if (avgL === 0) return avgG === 0 ? 50 : 100;
  return 100 - 100 / (1 + avgG / avgL);
}

function macd(closes) {
  if (!Array.isArray(closes) || closes.length < 35) return null;
  const e12 = emaSeries(closes, 12), e26 = emaSeries(closes, 26);
  if (!e12 || !e26) return null;
  const line = e12.map((v, i) => v - e26[i]);
  const sigSeries = emaSeries(line, 9);
  if (!sigSeries) return null;
  const sig = sigSeries[sigSeries.length - 1];
  const last = line[line.length - 1];
  const prev = line[line.length - 2];
  return { line: last, signal: sig, hist: last - sig, rising: last > prev };
}

function stdev(values, n) {
  if (!Array.isArray(values) || values.length < n) return null;
  const w = values.slice(-n);
  const m = w.reduce((a, v) => a + v, 0) / n;
  return Math.sqrt(w.reduce((a, v) => a + (v - m) * (v - m), 0) / n);
}

function bollinger(closes, n, k) {
  n = n || 20; k = k || 2;
  const mid = sma(closes, n);
  const sd = stdev(closes, n);
  if (mid === null || sd === null) return null;
  const last = closes[closes.length - 1];
  return {
    mid, upper: mid + k * sd, lower: mid - k * sd,
    widthPct: (mid > 0) ? ((2 * k * sd) / mid) * 100 : null,
    pos: (mid + k * sd > mid - k * sd) ? ((last - (mid - k * sd)) / (2 * k * sd)) * 100 : null
  };
}

function atr(candles, n) {
  n = n || 14;
  if (!Array.isArray(candles) || candles.length < n + 1) return null;
  let s = 0;
  for (let i = candles.length - n; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    s += Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
  }
  return s / n;
}

/* v1.2.2 — شاخص‌های بیشتر برای تحلیل قوی‌تر: همه از روی همان کندل‌ها حساب
   می‌شوند؛ عدد جدیدی ساخته نمی‌شود. توصیفی‌اند — نه سیگنال، نه پیش‌بینی. */

// ADX وایلدر (۱۴) + DI+ و DI- — قدرت روند و جهتش.
function adx(candles, n) {
  n = n || 14;
  if (!Array.isArray(candles) || candles.length < n * 2 + 1) return null;
  var tr = [], pdm = [], mdm = [];
  for (var i = 1; i < candles.length; i++) {
    var c = candles[i], p = candles[i - 1];
    tr.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
    var up = c.h - p.h, dn = p.l - c.l;
    pdm.push(up > 0 && up > dn ? up : 0);
    mdm.push(dn > 0 && dn > up ? dn : 0);
  }
  function wilder(arr) {
    var out = [], s = 0, i;
    for (i = 0; i < n; i++) s += arr[i];
    out[n - 1] = s;
    for (i = n; i < arr.length; i++) out[i] = out[i - 1] - out[i - 1] / n + arr[i];
    return out;
  }
  var atrS = wilder(tr), pS = wilder(pdm), mS = wilder(mdm);
  var dx = [], k;
  for (k = n - 1; k < tr.length; k++) {
    var dip = atrS[k] > 0 ? 100 * pS[k] / atrS[k] : 0;
    var dim = atrS[k] > 0 ? 100 * mS[k] / atrS[k] : 0;
    dx[k] = (dip + dim) > 0 ? 100 * Math.abs(dip - dim) / (dip + dim) : 0;
  }
  var first = 2 * n - 2;
  if (dx.length <= first) return null;
  var s2 = 0, q;
  for (q = n - 1; q < n - 1 + n; q++) s2 += dx[q];
  var adxV = s2 / n;
  for (q = n - 1 + n; q < dx.length; q++) adxV = (adxV * (n - 1) + dx[q]) / n;
  var last = tr.length - 1;
  return {
    adx: adxV,
    diPlus: atrS[last] > 0 ? 100 * pS[last] / atrS[last] : 0,
    diMinus: atrS[last] > 0 ? 100 * mS[last] / atrS[last] : 0
  };
}

// استوکاستیک (۱۴، ۳) — %K و %D.
function stoch(candles, n, smooth) {
  n = n || 14; smooth = smooth || 3;
  if (!Array.isArray(candles) || candles.length < n + smooth) return null;
  var ks = [];
  for (var i = n - 1; i < candles.length; i++) {
    var w = candles.slice(i - n + 1, i + 1);
    var hi = Math.max.apply(null, w.map(function (c) { return c.h; }));
    var lo = Math.min.apply(null, w.map(function (c) { return c.l; }));
    ks.push(hi > lo ? 100 * (candles[i].c - lo) / (hi - lo) : 50);
  }
  return { k: ks[ks.length - 1], d: sma(ks, smooth) };
}

// آخرین کراس EMA9/EMA21 — طلایی (صعودی) یا مرگ (نزولی) + چند کندل پیش.
function emaCross(closes) {
  var e9 = emaSeries(closes, 9), e21 = emaSeries(closes, 21);
  if (!e9 || !e21) return null;
  var last = e9.length - 1, prev = null;
  for (var i = 1; i < e9.length; i++) {
    var d0 = e9[i - 1] - e21[i - 1], d1 = e9[i] - e21[i];
    if (d0 <= 0 && d1 > 0) prev = { type: 'golden', barsAgo: last - i };
    else if (d0 >= 0 && d1 < 0) prev = { type: 'death', barsAgo: last - i };
  }
  return prev;
}

// جهت OBV (حجم تجمعی) — بدون حجم معتبر null.
function obvDir(candles) {
  var vols = candles.map(function (c) { return c.v; });
  if (!vols.length) return null;
  for (var i = 0; i < vols.length; i++) if (typeof vols[i] !== 'number' || vols[i] <= 0) return null;
  var obv = [vols[0]];
  for (var j = 1; j < candles.length; j++) {
    var d = candles[j].c - candles[j - 1].c;
    obv.push(obv[j - 1] + (d > 0 ? vols[j] : d < 0 ? -vols[j] : 0));
  }
  if (obv.length < 21) return null;
  var diff = obv[obv.length - 1] - obv[obv.length - 21];
  return diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
}

// روند حجم: میانگین ۵ کندل در برابر میانگین ۲۰ کندل.
function volTrend(candles) {
  var vols = candles.map(function (c) { return c.v; }).filter(function (v) { return typeof v === 'number' && v > 0; });
  if (vols.length < 20) return null;
  var s5 = sma(vols.slice(-5), 5), s20 = sma(vols.slice(-20), 20);
  if (s5 == null || s20 == null || s20 === 0) return null;
  return s5 > s20 * 1.05 ? 'up' : s5 < s20 * 0.95 ? 'down' : 'flat';
}

// خوانش کندل آخر: بدنه، فیتیله‌ها، شکل (دوجی/چکش/شهاب/ماروبوزو/معمولی).
function candleRead(c) {
  if (!c) return null;
  var range = c.h - c.l;
  if (!(range > 0)) return { bodyPct: 0, upperWickPct: 0, lowerWickPct: 0, shape: 'flat', dir: 'flat' };
  var body = Math.abs(c.c - c.o);
  var upper = c.h - Math.max(c.o, c.c), lower = Math.min(c.o, c.c) - c.l;
  var bodyPct = body / range * 100, upPct = upper / range * 100, loPct = lower / range * 100;
  var dir = c.c > c.o ? 'up' : c.c < c.o ? 'down' : 'flat';
  var shape = 'normal';
  if (bodyPct < 10) shape = 'doji';
  else if (loPct > bodyPct * 2 && upPct < bodyPct * 0.5) shape = 'hammer';
  else if (upPct > bodyPct * 2 && loPct < bodyPct * 0.5) shape = 'shooting';
  else if (bodyPct > 80) shape = 'marubozu';
  return { bodyPct: bodyPct, upperWickPct: upPct, lowerWickPct: loPct, shape: shape, dir: dir };
}

// ساختار سقف/کف‌های پیوت: HH/HL = صعودی، LH/LL = نزولی، بقیه مختلط.
function structure(candles) {
  var pp = pivotPoints(candles);
  if (!pp || pp.highs.length < 2 || pp.lows.length < 2) return null;
  var h1 = pp.highs[pp.highs.length - 1].price, h0 = pp.highs[pp.highs.length - 2].price;
  var l1 = pp.lows[pp.lows.length - 1].price, l0 = pp.lows[pp.lows.length - 2].price;
  var ht = h1 > h0 ? 'HH' : h1 < h0 ? 'LH' : 'EQ';
  var lt = l1 > l0 ? 'HL' : l1 < l0 ? 'LL' : 'EQ';
  return (ht === 'HH' && lt === 'HL') ? 'bull' : (ht === 'LH' && lt === 'LL') ? 'bear' : 'mixed';
}

// v1.18.0 — تحلیل پیشرفته (دستور مالک ۲۰۲۶-۱۱-۱۴: «همه‌ش رو بساز»):
// ۱) سطوح حمایت/مقاومت از پیوت‌ها + فیبوناچی؛ ۲) واگرایی RSI/MACD + الگوهای
// چندکندلی؛ ۳) هم‌جهتی چند تایم‌فریم (آرگومان اختیاری analyze)؛ ۴) VWAP +
// CCI + Williams %R + MFI. همه از روی همان کندل‌ها حساب می‌شوند؛ عدد جدیدی
// ساخته نمی‌شود. توصیفی‌اند — نه سیگنال، نه پیش‌بینی، نه هدف، نه توصیه.
// رأی‌های ۱۱تایی analyze() دست‌نخورده‌اند — سیگنال‌های تازه رأی نمی‌دهند،
// فقط به‌عنوان سیگنال اضافه نمایش داده می‌شوند.
/* v1.18.0 — پیوت‌ها با شمارهٔ کندل (پایهٔ سطوح و واگرایی). همان شرط structure():
   سقف پیوت h[i] >= h[i-1] و h[i] >= h[i+1]؛ کف پیوت l[i] <= l[i-1] و l[i] <= l[i+1]. */
function pivotPoints(candles) {
  if (!Array.isArray(candles) || candles.length < 10) return null;
  var highs = [], lows = [];
  for (var i = 1; i < candles.length - 1; i++) {
    if (candles[i].h >= candles[i - 1].h && candles[i].h >= candles[i + 1].h) highs.push({ price: candles[i].h, bar: i });
    if (candles[i].l <= candles[i - 1].l && candles[i].l <= candles[i + 1].l) lows.push({ price: candles[i].l, bar: i });
  }
  return { highs: highs, lows: lows };
}

// سطوح حمایت/مقاومت: پیوت‌های هم‌قیمت (در ۰٫۵٪ هم) یک سطح‌اند؛ قدرت = تعداد
// پیوت‌های آن سطح (چند بار تست شده). بالای آخرین قیمت = مقاومت، پایین = حمایت.
// نزدیک‌ترین ۳ سطح هر طرف، مرتب از نزدیک به دور.
function supportResistance(candles) {
  if (!Array.isArray(candles) || candles.length < 10) return null;
  var pp = pivotPoints(candles);
  if (!pp) return null;
  var last = candles[candles.length - 1].c;
  function cluster(points, isHigh) {
    var pts = points.slice().sort(function (a, b) { return a.price - b.price; });
    var out = [];
    pts.forEach(function (p) {
      var cl = out[out.length - 1];
      if (cl && Math.abs(p.price - cl.price) / cl.price <= 0.005) {
        cl.price = isHigh ? Math.max(cl.price, p.price) : Math.min(cl.price, p.price);
        cl.strength++;
        cl.bars.push(p.bar);
      } else {
        out.push({ price: p.price, strength: 1, bars: [p.bar] });
      }
    });
    return out;
  }
  var res = cluster(pp.highs, true).filter(function (l) { return l.price > last; })
    .sort(function (a, b) { return a.price - b.price; }).slice(0, 3);
  var sup = cluster(pp.lows, false).filter(function (l) { return l.price < last; })
    .sort(function (a, b) { return b.price - a.price; }).slice(0, 3);
  return { resistance: res, support: sup };
}

// فیبوناچی اصلاحی روی کل بازهٔ کندل‌های داده‌شده: سقف = بیشترین high،
// کف = کمترین low. سطوح ۰ / ۲۳٫۶ / ۳۸٫۲ / ۵۰ / ۶۱٫۸ / ۷۸٫۶ / ۱۰۰٪.
function fibonacci(candles) {
  if (!Array.isArray(candles) || candles.length < 2) return null;
  var hi = -Infinity, lo = Infinity, hiBar = -1, loBar = -1;
  for (var i = 0; i < candles.length; i++) {
    if (candles[i].h > hi) { hi = candles[i].h; hiBar = i; }
    if (candles[i].l < lo) { lo = candles[i].l; loBar = i; }
  }
  if (!(hi > lo)) return null;
  var ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  return {
    high: hi, low: lo, highBar: hiBar, lowBar: loBar,
    levels: ratios.map(function (r) { return { ratio: r, price: hi - r * (hi - lo) }; })
  };
}

// سری RSI وایلدر (۱۴) — دقیقاً همان فرمول rsi()، ولی برای هر کندل (null تا
// کندل n). آخرین مقدارش با rsi(closes, n) برابر است (تست قفلش می‌کند).
function rsiSeries(closes, n) {
  n = n || 14;
  if (!Array.isArray(closes) || closes.length < n + 1) return null;
  var avgG = 0, avgL = 0, i;
  for (i = 1; i <= n; i++) { var d0 = closes[i] - closes[i - 1]; if (d0 > 0) avgG += d0; else avgL -= d0; }
  avgG /= n; avgL /= n;
  function val(g, l) { if (l === 0) return g === 0 ? 50 : 100; return 100 - 100 / (1 + g / l); }
  var out = [];
  for (i = 0; i < n; i++) out.push(null);
  out.push(val(avgG, avgL));
  for (i = n + 1; i < closes.length; i++) {
    var dd = closes[i] - closes[i - 1];
    var g = dd > 0 ? dd : 0, l = dd < 0 ? -dd : 0;
    avgG = (avgG * (n - 1) + g) / n;
    avgL = (avgL * (n - 1) + l) / n;
    out.push(val(avgG, avgL));
  }
  return out;
}

// سری هیستوگرام MACD — همان فرمول macd() برای هر کندل. قبل از کندل ۳۴
// (۲۶+۹−۱) مقدارها گرم‌کردن EMA هستند و برای واگرایی استفاده نمی‌شوند.
function macdHistSeries(closes) {
  if (!Array.isArray(closes) || closes.length < 35) return null;
  var e12 = emaSeries(closes, 12), e26 = emaSeries(closes, 26);
  if (!e12 || !e26) return null;
  var line = e12.map(function (v, i) { return v - e26[i]; });
  var sig = emaSeries(line, 9);
  if (!sig) return null;
  return line.map(function (v, i) { return v - sig[i]; });
}

// واگرایی معمولی (regular) — فقط جدیدترین جفت سقف/کف:
// صعودی: قیمت کف پایین‌تر + اندیکاتور کف بالاتر (روی کف‌ها)؛
// نزولی: قیمت سقف بالاتر + اندیکاتور سقف پایین‌تر (روی سقف‌ها).
// RSI دست‌کم ۱ واحد اختلاف می‌خواهد؛ MACD هر بهبودِ صریح. سقف/کفِ دوم باید
// در ۲۵ کندل اخیر باشد و مقدار اندیکاتور در هر دو سقف گرم‌شده باشد
// (RSI از کندل ۱۴، MACD از کندل ۳۴). سقف‌های هم‌قیمتِ پی‌درپی یک لمس‌اند.
function findDivergence(candles) {
  if (!Array.isArray(candles) || candles.length < 15) return [];
  var closes = candles.map(function (c) { return c.c; });
  var rs = rsiSeries(closes, 14);
  var mh = candles.length >= 35 ? macdHistSeries(closes) : null;
  if (!rs && !mh) return [];
  var out = [];
  function swings(kind) {
    var raw = [];
    for (var i = 1; i < candles.length - 1; i++) {
      if (kind === 'low' && candles[i].l <= candles[i - 1].l && candles[i].l <= candles[i + 1].l) raw.push({ bar: i, price: candles[i].l });
      if (kind === 'high' && candles[i].h >= candles[i - 1].h && candles[i].h >= candles[i + 1].h) raw.push({ bar: i, price: candles[i].h });
    }
    var ded = [];
    raw.forEach(function (s) {
      var last = ded[ded.length - 1];
      if (last && last.price === s.price) last.bar = s.bar;
      else ded.push({ bar: s.bar, price: s.price });
    });
    return ded;
  }
  function check(sw, series, minBar, indicator, minDiff, want) {
    if (sw.length < 2) return;
    var s1 = sw[sw.length - 2], s2 = sw[sw.length - 1];
    if (s1.bar < minBar || s2.bar < minBar) return;
    if (s2.bar < candles.length - 25) return;
    var v1 = series[s1.bar], v2 = series[s2.bar];
    if (v1 == null || v2 == null) return;
    if (want === 'bullish' && s2.price < s1.price && v2 > v1 + minDiff)
      out.push({ type: 'bullish', indicator: indicator, bars: [s1.bar, s2.bar], price1: s1.price, price2: s2.price, ind1: v1, ind2: v2 });
    if (want === 'bearish' && s2.price > s1.price && v2 < v1 - minDiff)
      out.push({ type: 'bearish', indicator: indicator, bars: [s1.bar, s2.bar], price1: s1.price, price2: s2.price, ind1: v1, ind2: v2 });
  }
  var lows = swings('low'), highs = swings('high');
  if (rs) { check(lows, rs, 14, 'RSI', 1, 'bullish'); check(highs, rs, 14, 'RSI', 1, 'bearish'); }
  if (mh) { check(lows, mh, 34, 'MACD', 0, 'bullish'); check(highs, mh, 34, 'MACD', 0, 'bearish'); }
  return out;
}

// الگوهای چندکندلی — جدیدترین وقوع هر الگو (با شمارهٔ کندل و چند کندل پیش).
// انگالفینگ (۲ کندل)، ستارهٔ صبح/عصر (۳ کندل: بدنهٔ بلند، بدنهٔ کوچک، بدنهٔ
// بلندِ برگشتی که بالای/پایینِ میانهٔ بدنهٔ اول بسته شود)، سه سرباز سفید /
// سه کلاغ سیاه (۳ کندل هم‌جهت با بدنهٔ بالای ۶۰٪ بازه). شکل‌های تک‌کندلی
// (دوجی/چکش/شهاب/ماروبوزو) در candleRead مانده‌اند.
function detectPatterns(candles) {
  if (!Array.isArray(candles) || candles.length < 2) return [];
  function body(c) { return Math.abs(c.c - c.o); }
  function range(c) { return c.h - c.l; }
  function isUp(c) { return c.c > c.o; }
  function isDown(c) { return c.c < c.o; }
  var last = {};
  function put(name, dir, bar) { last[name] = { name: name, dir: dir, bar: bar, barsAgo: candles.length - 1 - bar }; }
  var n = candles.length, i;
  for (i = 1; i < n; i++) {
    var p = candles[i - 1], c = candles[i];
    if (isDown(p) && isUp(c) && c.c >= p.o && c.o <= p.c) put('bullish-engulfing', 'bull', i);
    if (isUp(p) && isDown(c) && c.o >= p.c && c.c <= p.o) put('bearish-engulfing', 'bear', i);
  }
  for (i = 2; i < n; i++) {
    var a = candles[i - 2], b = candles[i - 1], c2 = candles[i];
    if (isDown(a) && body(a) > 0.6 * range(a) && body(b) < 0.3 * range(b) && isUp(c2) && body(c2) > 0.6 * range(c2) && c2.c > (a.o + a.c) / 2)
      put('morning-star', 'bull', i);
    if (isUp(a) && body(a) > 0.6 * range(a) && body(b) < 0.3 * range(b) && isDown(c2) && body(c2) > 0.6 * range(c2) && c2.c < (a.o + a.c) / 2)
      put('evening-star', 'bear', i);
    var t = [a, b, c2];
    var soldiers = t.every(isUp) && t.every(function (x) { return body(x) > 0.6 * range(x); })
      && t[1].c > t[0].c && t[2].c > t[1].c
      && t[1].o >= t[0].o && t[1].o <= t[0].c && t[2].o >= t[1].o && t[2].o <= t[1].c;
    var crows = t.every(isDown) && t.every(function (x) { return body(x) > 0.6 * range(x); })
      && t[1].c < t[0].c && t[2].c < t[1].c
      && t[1].o <= t[0].o && t[1].o >= t[0].c && t[2].o <= t[1].o && t[2].o >= t[1].c;
    if (soldiers) put('three-white-soldiers', 'bull', i);
    if (crows) put('three-black-crows', 'bear', i);
  }
  return Object.keys(last).map(function (k) { return last[k]; });
}

// VWAP — میانگین قیمت تیپیک وزنی با حجم، از اولین کندل داده‌شده (لنگر جلسه).
// کندلِ بدون حجم معتبر نادیده گرفته می‌شود؛ اگر هیچ حجمی نباشد null
// (فارکس/شاخص حجم ندارند — آنجا VWAP معنا ندارد).
function vwap(candles) {
  if (!Array.isArray(candles) || !candles.length) return null;
  var num = 0, den = 0;
  for (var i = 0; i < candles.length; i++) {
    var c = candles[i];
    if (typeof c.v !== 'number' || !(c.v > 0)) continue;
    num += ((c.h + c.l + c.c) / 3) * c.v;
    den += c.v;
  }
  return den > 0 ? num / den : null;
}

// CCI(20) — (تیپیک − SMA20 تیپیک) / (۰٫۰۱۵ × میانگین انحراف). انحراف صفر → null.
function cci(candles, n) {
  n = n || 20;
  if (!Array.isArray(candles) || candles.length < n) return null;
  var tp = candles.slice(-n).map(function (c) { return (c.h + c.l + c.c) / 3; });
  var sma = tp.reduce(function (a, v) { return a + v; }, 0) / n;
  var md = tp.reduce(function (a, v) { return a + Math.abs(v - sma); }, 0) / n;
  if (md === 0) return null;
  return (tp[n - 1] - sma) / (0.015 * md);
}

// Williams %R(14) — ‎−۱۰۰ تا ۰. بالای ۲۰٪- = اشباع خرید، زیر ۸۰٪- = اشباع فروش.
function williams(candles, n) {
  n = n || 14;
  if (!Array.isArray(candles) || candles.length < n) return null;
  var w = candles.slice(-n);
  var hh = Math.max.apply(null, w.map(function (c) { return c.h; }));
  var ll = Math.min.apply(null, w.map(function (c) { return c.l; }));
  if (hh === ll) return null;
  return (hh - candles[candles.length - 1].c) / (hh - ll) * -100;
}

// MFI(14) — جریان پول مثبت/منفی روی قیمت تیپیک × حجم. همه مثبت → ۱۰۰،
// همه منفی → ۰، بدون حرکت → null. حجم نامعتبر در بازه → null.
function mfi(candles, n) {
  n = n || 14;
  if (!Array.isArray(candles) || candles.length < n + 1) return null;
  var pos = 0, neg = 0;
  for (var i = candles.length - n; i < candles.length; i++) {
    var c = candles[i], p = candles[i - 1];
    if (typeof c.v !== 'number' || !(c.v > 0)) return null;
    var t = (c.h + c.l + c.c) / 3, pt = (p.h + p.l + p.c) / 3;
    var f = t * c.v;
    if (t > pt) pos += f;
    else if (t < pt) neg += f;
  }
  if (pos === 0 && neg === 0) return null;
  if (neg === 0) return 100;
  if (pos === 0) return 0;
  return 100 - 100 / (1 + pos / neg);
}

// سری ATR وایلدر (۱۴) — برای رژیم نوسان (ATR فعلی در برابر میانگین ۲۰تایی‌اش).
function atrSeries(candles, n) {
  n = n || 14;
  if (!Array.isArray(candles) || candles.length < n + 1) return null;
  var tr = [];
  for (var i = 1; i < candles.length; i++) {
    var c = candles[i], p = candles[i - 1];
    tr.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
  }
  var out = [], s = 0, i;
  for (i = 0; i < n; i++) s += tr[i];
  out[n - 1] = s / n;
  for (i = n; i < tr.length; i++) out[i] = (out[i - 1] * (n - 1) + tr[i]) / n;
  return out; // اندیس i یعنی کندل i+1
}

/* Mini App: display.js ربات به‌صورت inline در app.js است (window.__miniDisplay) */
const { esc, code, section } = window.__miniDisplay;

function fmt(n, digits) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: (digits === undefined ? 2 : digits) });
}

function fmtPct(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return (n >= 0 ? '+' : '') + (Math.round(n * 100) / 100) + '%';
}

// بازار از روی provider و نماد — روش تحلیل از همین‌جا انتخاب می‌شود.
function marketOf(quote) {
  if (!quote) return null;
  if (quote.provider === 'binance') return 'crypto';
  if (quote.provider === 'iran-rate') return 'iran-rate';
  if (quote.provider === 'iran-stock') return 'iran-stock';
  if (quote.provider === 'yahoo') {
    const s = quote.symbol || '';
    if (s.slice(-2) === '=X') return 'forex';
    if (s.slice(-2) === '=F') return 'commodity';
    if (s[0] === '^') return 'index';
    return 'stock';
  }
  return null;
}

// شاخص‌های هر بازار فرق می‌کند (دستور مالک ۲۰۲۶-۱۱-۰۸) — اما نوع روش در پیام
// ذکر نمی‌شود (دستور مالک ۲۰۲۶-۱۱-۰۸): تفاوت فقط در محتواست، نه در برچسب.
// فارکس حجم متمرکز ندارد (بازار غیرمتمرکز)؛ سهام خط بازهٔ ۵۲ هفته می‌گیرد.
const MARKET_INDICATORS = {
  crypto: { volume: true, atr: true, macd: true, w52: false },
  stock: { volume: true, atr: true, macd: true, w52: true },
  forex: { volume: false, atr: true, macd: true, w52: false },
  commodity: { volume: true, atr: true, macd: true, w52: false },
  index: { volume: false, atr: true, macd: true, w52: false }
};

// هم‌جهتی چند تایم‌فریم — tfMap: { برچسب تایم‌فریم: کندل‌ها }، مثلاً
// { '15m': [...], '1h': [...], '4h': [...] }. جهت هر تایم‌فریم از رأی‌های
// همان analyze() می‌آید (verdictFromVotes). ورودیِ برابرِ (===) کندل‌های
// پایه نتیجهٔ پایه را دوباره استفاده می‌کند (محاسبهٔ دوباره نیست). تایم‌فریمی
// با کمتر از ۲۰ کندل 'na' می‌گیرد و شمرده نمی‌شود. agreeDir: 'bull' وقتی
// همهٔ غیر-na صعودی‌اند، 'bear' وقتی همه نزولی‌اند، 'flat' وقتی همه خنثی‌اند،
// و 'mixed' در غیر این صورت.
function multiTfConfluence(candles, market, baseVotes, tfMap) {
  if (!tfMap || typeof tfMap !== 'object') return null;
  var perTf = {}, bull = 0, bear = 0, flat = 0, total = 0;
  Object.keys(tfMap).forEach(function (label) {
    var arr = tfMap[label];
    if (!Array.isArray(arr) || arr.length < 20) { perTf[label] = { dir: 'na', bull: 0, bear: 0, net: 0 }; return; }
    var v = (arr === candles) ? baseVotes : analyze(arr, market).votes;
    var d = verdictFromVotes(v);
    perTf[label] = { dir: d.dir, bull: d.bull, bear: d.bear, net: d.net };
    total++;
    if (d.dir === 'bull') bull++;
    else if (d.dir === 'bear') bear++;
    else flat++;
  });
  if (!total) return null;
  var agreeDir = (bear === 0 && bull > 0) ? 'bull' : (bull === 0 && bear > 0) ? 'bear' : (bull === 0 && bear === 0) ? 'flat' : 'mixed';
  return { perTf: perTf, bull: bull, bear: bear, flat: flat, total: total, agreeDir: agreeDir, agreeCount: Math.max(bull, bear) };
}

function analyze(candles, market, tfMap) {
  // tfMap اختیاری است: { برچسب تایم‌فریم: کندل‌ها } برای هم‌جهتی چند
  // تایم‌فریم. بدون آن multiTf برابر null است و بقیه دقیقاً مثل قبل‌اند.
  const closes = candles.map(c => c.c);
  const last = candles[candles.length - 1];
  const e20 = ema(closes, 20), e50 = ema(closes, 50);
  const m = macd(closes);
  const r = rsi(closes, 14);
  const a = atr(candles, 14);
  const win = candles.slice(-20);
  const hi20 = Math.max.apply(null, win.map(c => c.h));
  const lo20 = Math.min.apply(null, win.map(c => c.l));
  const vols = candles.map(c => c.v).filter(v => typeof v === 'number' && v > 0);
  const volAvg = vols.length >= 20 ? sma(vols.slice(-21, -1), 20) : null;
  const volLast = vols.length ? vols[vols.length - 1] : null;
  let trend = 'neutral';
  if (e20 !== null && e50 !== null && m) {
    if (last.c > e20 && e20 > e50 && m.hist > 0) trend = 'up';
    else if (last.c < e20 && e20 < e50 && m.hist < 0) trend = 'down';
  }
  const pos = (hi20 > lo20) ? ((last.c - lo20) / (hi20 - lo20)) * 100 : null;
  const e200 = ema(closes, 200);
  const bb = bollinger(closes, 20, 2);
  const rangePct = last.c ? ((hi20 - lo20) / last.c) * 100 : null;
  const volRatio = (volAvg !== null && volAvg > 0 && volLast !== null) ? volLast / volAvg : null;
  // v1.2.2 — شاخص‌های بیشتر (همه از همان کندل‌ها):
  const adxV = adx(candles, 14);
  const st = stoch(candles, 14, 3);
  const e9 = ema(closes, 9), e21 = ema(closes, 21);
  const cross = emaCross(closes);
  const obvD = obvDir(candles);
  const volT = volTrend(candles);
  const cndl = candleRead(last);
  const struct = structure(candles);
  // رژیم نوسان: ATR٪ فعلی در برابر میانگین ۲۰تایی‌اش.
  var atrRegime = null;
  var atrS = atrSeries(candles, 14);
  if (atrS) {
    var ap = [];
    for (var ai = 13; ai < atrS.length; ai++) { var cc = candles[ai + 1]; if (cc && cc.c) ap.push(atrS[ai] / cc.c * 100); }
    if (ap.length >= 20) {
      var apAvg = sma(ap.slice(-20), 20), apNow = ap[ap.length - 1], apPrev = ap[ap.length - 6];
      if (apAvg !== null && apAvg > 0) atrRegime = { level: apNow > apAvg * 1.25 ? 'high' : apNow < apAvg * 0.8 ? 'low' : 'normal', rising: apPrev != null ? apNow > apPrev : null };
    }
  }
  // فشردگی بولینگر: پهنای فعلی در برابر میانگین ۲۰تایی‌اش.
  var bbSq = null;
  if (bb && bb.widthPct !== null) {
    var wps = [];
    for (var bi = Math.max(19, closes.length - 20); bi < closes.length; bi++) {
      var bbi = bollinger(closes.slice(0, bi + 1), 20, 2);
      if (bbi && bbi.widthPct !== null) wps.push(bbi.widthPct);
    }
    if (wps.length >= 10) {
      var wAvg = sma(wps, wps.length);
      if (wAvg !== null && wAvg > 0) bbSq = bb.widthPct < wAvg * 0.7 ? 'squeeze' : bb.widthPct > wAvg * 1.4 ? 'wide' : 'normal';
    }
  }
  // MACD: هیستوگرام در برابر هیستوگرام قبلی.
  var macdHistRising = null, macdAboveZero = null;
  if (m) {
    macdAboveZero = m.line > 0;
    var e12s = emaSeries(closes, 12), e26s = emaSeries(closes, 26);
    if (e12s && e26s && e12s.length >= 2) {
      var lineS = e12s.map(function (v, i) { return v - e26s[i]; });
      var sigS = emaSeries(lineS, 9);
      if (sigS && sigS.length >= 2) {
        var hNow = lineS[lineS.length - 1] - sigS[sigS.length - 1];
        var hPrev = lineS[lineS.length - 2] - sigS[sigS.length - 2];
        macdHistRising = hNow > hPrev;
      }
    }
  }
  // آرای موافق/مخالف — برای کارت خلاصه: هر شاخص یک رأی می‌دهد.
  var votes = { bull: 0, bear: 0, items: [] };
  function vote(v, label) {
    if (v > 0) { votes.bull++; votes.items.push({ label: label, v: 1 }); }
    else if (v < 0) { votes.bear++; votes.items.push({ label: label, v: -1 }); }
    else votes.items.push({ label: label, v: 0 });
  }
  vote(last.c > e20 ? 1 : last.c < e20 ? -1 : 0, 'EMA20');
  vote(e20 !== null && e50 !== null ? (e20 > e50 ? 1 : -1) : 0, 'EMA20/50');
  vote(e200 !== null ? (last.c > e200 ? 1 : -1) : 0, 'EMA200');
  vote(m ? (m.hist > 0 ? 1 : -1) : 0, 'MACD');
  vote(r !== null ? (r > 55 ? 1 : r < 45 ? -1 : 0) : 0, 'RSI');
  vote(st ? (st.k > 50 ? 1 : st.k < 50 ? -1 : 0) : 0, 'Stoch');
  vote(adxV ? (adxV.diPlus > adxV.diMinus ? 1 : -1) : 0, 'ADX/DI');
  vote(struct === 'bull' ? 1 : struct === 'bear' ? -1 : 0, 'Structure');
  vote(volRatio !== null && volRatio > 1.2 ? (last.c > closes[closes.length - 2] ? 1 : -1) : 0, 'Volume');
  vote(bb && bb.mid !== null ? (last.c > bb.mid ? 1 : -1) : 0, 'BB-mid');
  vote(cndl ? (cndl.dir === 'up' ? 1 : cndl.dir === 'down' ? -1 : 0) : 0, 'Candle');
  // v1.18.0 — سیگنال‌های اضافه (رأی نمی‌دهند؛ رأی‌های ۱۱تایی بالا دست‌نخورده‌اند).
  var lvls = supportResistance(candles);
  var fib = fibonacci(candles);
  var divs = findDivergence(candles);
  var pats = detectPatterns(candles);
  var vw = vwap(candles);
  var cc = cci(candles, 20);
  var wr = williams(candles, 14);
  var mf = mfi(candles, 14);
  var multiTf = null;
  if (tfMap && typeof tfMap === 'object') multiTf = multiTfConfluence(candles, market, votes, tfMap);
  return {
    market, last, e20, e50, e200, macd: m, rsi: r, bb,
    atrPct: (a !== null && last.c) ? (a / last.c) * 100 : null,
    hi20, lo20, pos, volAvg, volLast, volRatio, rangePct,
    trend,
    longTrend: (e200 === null) ? null : (last.c > e200 ? 'up' : (last.c < e200 ? 'down' : 'neutral')),
    adx: adxV, stoch: st, e9: e9, e21: e21, emaCross: cross,
    obvDir: obvD, volTrend: volT, candle: cndl, structure: struct,
    atrRegime: atrRegime, bbSqueeze: bbSq,
    macdHistRising: macdHistRising, macdAboveZero: macdAboveZero,
    votes: votes,
    levels: lvls, fib: fib, divergence: divs, patterns: pats,
    vwap: vw, cci: cc, williamsR: wr, mfi: mf, multiTf: multiTf
  };
}

// تغییر قیمت نسبت به N کندل قبل (٪) — برای تایم‌فریم ۱ ساعته: ۲۴ = یک روز، ۱۶۸ = یک هفته.
function changeBack(closes, n) {
  if (!Array.isArray(closes) || closes.length <= n) return null;
  const now = closes[closes.length - 1], then = closes[closes.length - 1 - n];
  if (!then || then === 0) return null;
  return ((now - then) / then) * 100;
}

function trendWord(a, lang) {
  const fa = lang === 'fa';
  if (a.trend === 'up') return fa ? 'صعودی' : 'Uptrend';
  if (a.trend === 'down') return fa ? 'نزولی' : 'Downtrend';
  return fa ? 'خنثی' : 'Neutral';
}

function rsiWord(r, lang) {
  const fa = lang === 'fa';
  if (r === null) return fa ? '—' : '—';
  if (r >= 70) return fa ? 'اشباع خرید (بالای ۷۰)' : 'overbought (above 70)';
  if (r <= 30) return fa ? 'اشباع فروش (زیر ۳۰)' : 'oversold (below 30)';
  if (r >= 55) return fa ? 'متمایل به مثبت' : 'leaning positive';
  if (r <= 45) return fa ? 'متمایل به منفی' : 'leaning negative';
  return fa ? 'خنثی' : 'neutral';
}

function patternLabel(name, lang) {
  const fa = lang === 'fa';
  const map = {
    'bullish-engulfing': fa ? 'انگالفینگ صعودی' : 'Bullish engulfing',
    'bearish-engulfing': fa ? 'انگالفینگ نزولی' : 'Bearish engulfing',
    'morning-star': fa ? 'ستارهٔ صبح' : 'Morning star',
    'evening-star': fa ? 'ستارهٔ عصر' : 'Evening star',
    'three-white-soldiers': fa ? 'سه سرباز سفید' : 'Three white soldiers',
    'three-black-crows': fa ? 'سه کلاغ سیاه' : 'Three black crows'
  };
  return map[name] || name;
}

// متن پیام تحلیل — توصیفی؛ بدون سیگنال/هدف/توصیه.
// نوع روش در پیام ذکر نمی‌شود؛ تفاوت بازارها فقط در محتواست (پیکربندی بالا).
// quoteRes اختیاری است (پاسخ Yahoo quote) — برای خط بازهٔ ۵۲ هفتهٔ سهام.
function formatAnalysis(quote, candles, tf, lang, quoteRes) {
  const fa = lang === 'fa';
  const market = marketOf(quote);
  const ind = MARKET_INDICATORS[market] || { volume: true, atr: true, macd: true, w52: false };
  const a = analyze(candles, market);
  const disp = quote.display || quote.symbol;
  const tfLabel = tf || '1h';
  const L = [];
  const closes = candles.map(c => c.c);
  // تغییر دوره‌ای — بر حسب تایم‌فریم.
  const back = { '15m': [96, 672], '1h': [24, 168], '4h': [6, 42], '1d': [1, 7] }[tfLabel] || [24, 168];
  const chgShort = changeBack(closes, back[0]);
  const chgLong = changeBack(closes, back[1]);
  const shortLabel = { '15m': (fa ? '۲۴ ساعت' : '24h'), '1h': (fa ? '۲۴ ساعت' : '24h'), '4h': (fa ? '۲۴ ساعت' : '24h'), '1d': (fa ? '۱ روز' : '1d') }[tfLabel] || '24h';
  const longLabel = { '15m': (fa ? '۷ روز' : '7d'), '1h': (fa ? '۷ روز' : '7d'), '4h': (fa ? '۷ روز' : '7d'), '1d': (fa ? '۷ روز' : '7d') }[tfLabel] || '7d';
  if (chgShort !== null) L.push('📊 ' + (fa ? 'تغییر در ' : 'Change in ') + shortLabel + ': <b>' + esc(fmtPct(chgShort)) + '</b>');
  if (chgLong !== null) L.push('📊 ' + (fa ? 'تغییر در ' : 'Change in ') + longLabel + ': <b>' + esc(fmtPct(chgLong)) + '</b>');
  const trendWhy = [];
  if (a.e20 !== null && a.e50 !== null) {
    trendWhy.push(esc(fmt(a.last.c)) + (fa ? '، EMA20‏ ' : ', EMA20 ') + esc(fmt(a.e20)) + (fa ? '، EMA50‏ ' : ', EMA50 ') + esc(fmt(a.e50)));
  }
  if (a.e200 !== null) {
    trendWhy.push((fa ? 'روند بلندمدت (EMA200): ' : 'Long-term trend (EMA200): ') + (a.longTrend === 'up' ? (fa ? 'صعودی' : 'up') : a.longTrend === 'down' ? (fa ? 'نزولی' : 'down') : (fa ? 'خنثی' : 'neutral')) + ' (' + esc(fmt(a.e200)) + ')');
  }
  if (a.macd && ind.macd) trendWhy.push('MACD ' + (a.macd.hist >= 0 ? '+' : '') + esc(fmt(a.macd.hist, 4)) + (a.macd.rising ? (fa ? ' (در حال بالا رفتن)' : ' (rising)') : (fa ? ' (در حال پایین آمدن)' : ' (falling)')));
  L.push('📈 ' + (fa ? 'روند: ' : 'Trend: ') + '<b>' + esc(trendWord(a, lang)) + '</b>' + (trendWhy.length ? ' — ' + trendWhy.join('؛ ') : ''));
  if (a.rsi !== null) L.push('RSI (14): <b>' + esc(fmt(a.rsi, 1)) + '</b> — ' + esc(rsiWord(a.rsi, lang)));
  if (a.bb) {
    L.push('📏 ' + (fa ? 'بولینگر (۲۰، ۲σ): سقف ' : 'Bollinger (20, 2σ): upper ') + code(fmt(a.bb.upper)) + (fa ? ' • میانی ' : ' • middle ') + code(fmt(a.bb.mid)) + (fa ? ' • کف ' : ' • lower ') + code(fmt(a.bb.lower)) + (a.bb.pos !== null ? (fa ? ' — قیمت در ' : ' — price at ') + esc(fmt(a.bb.pos, 0)) + (fa ? '٪ باند است' : '% of the band') : ''));
    if (a.bb.widthPct !== null) L.push('📏 ' + (fa ? 'پهنای باند: ' : 'Band width: ') + code(fmt(a.bb.widthPct, 2) + '%'));
  }
  L.push('🛡️ ' + (fa ? 'حمایت: ' : 'Support: ') + code(fmt(a.lo20)) + (fa ? ' (کف ۲۰ کندل اخیر)' : ' (low of last 20 candles)'));
  L.push('🚧 ' + (fa ? 'مقاومت: ' : 'Resistance: ') + code(fmt(a.hi20)) + (fa ? ' (سقف ۲۰ کندل اخیر)' : ' (high of last 20 candles)'));
  if (a.pos !== null) L.push((fa ? 'جای قیمت در بازهٔ ۲۰ کندل اخیر: ' : 'Price position in last-20 range: ') + code(fmt(a.pos, 0) + '%'));
  if (a.rangePct !== null) L.push((fa ? 'دامنهٔ نوسان ۲۰ کندل اخیر: ' : 'Last-20 range: ') + code(fmt(a.rangePct, 2) + '%'));
  // v1.18.0 — سطوح پیوت + فیبوناچی.
  if (a.levels && (a.levels.resistance.length || a.levels.support.length)) {
    var lvlTxt = [];
    a.levels.resistance.forEach(function (l) {
      lvlTxt.push((fa ? 'مقاومت ' : 'R ') + code(fmt(l.price)) + (l.strength > 1 ? ' (' + l.strength + (fa ? ' بار' : '×') + ')' : ''));
    });
    a.levels.support.forEach(function (l) {
      lvlTxt.push((fa ? 'حمایت ' : 'S ') + code(fmt(l.price)) + (l.strength > 1 ? ' (' + l.strength + (fa ? ' بار' : '×') + ')' : ''));
    });
    L.push('🎯 ' + (fa ? 'سطوح پیوت: ' : 'Pivot levels: ') + lvlTxt.join(' · '));
  }
  if (a.fib) {
    var fibTxt = a.fib.levels.filter(function (lv) { return lv.ratio > 0 && lv.ratio < 1; })
      .map(function (lv) { return (Math.round(lv.ratio * 1000) / 10) + '% ' + code(fmt(lv.price)); });
    L.push('📐 ' + (fa ? 'فیبوناچی (' : 'Fibonacci (') + (fa ? 'سقف ' : 'high ') + code(fmt(a.fib.high)) + (fa ? ' ← کف ' : ' → low ') + code(fmt(a.fib.low)) + '): ' + fibTxt.join(' · '));
  }
  // v1.18.0 — واگرایی + الگوها.
  (a.divergence || []).forEach(function (d) {
    var indVal = d.indicator === 'RSI'
      ? 'RSI ' + fmt(d.ind1, 1) + ' → ' + fmt(d.ind2, 1)
      : 'MACD ' + fmt(d.ind1, 4) + ' → ' + fmt(d.ind2, 4);
    L.push('⚠️ ' + (d.type === 'bullish' ? (fa ? 'واگرایی صعودی ' : 'Bullish divergence ') : (fa ? 'واگرایی نزولی ' : 'Bearish divergence '))
      + d.indicator + ' (' + (fa ? 'کندل ' : 'bars ') + d.bars[0] + '→' + d.bars[1] + '): ' + indVal);
  });
  (a.patterns || []).forEach(function (p) {
    L.push('🕯️ ' + (fa ? 'الگو: ' : 'Pattern: ') + esc(patternLabel(p.name, lang))
      + (p.barsAgo === 0 ? (fa ? ' (کندل آخر)' : ' (last candle)') : ' (' + p.barsAgo + (fa ? ' کندل پیش' : ' bars ago') + ')'));
  });
  // v1.18.0 — VWAP + مومنتوم اضافه.
  if (a.vwap !== null && a.vwap !== undefined) {
    L.push('VWAP: ' + code(fmt(a.vwap)) + ' — ' + (a.last.c > a.vwap ? (fa ? 'قیمت بالای VWAP' : 'price above VWAP') : a.last.c < a.vwap ? (fa ? 'قیمت زیر VWAP' : 'price below VWAP') : (fa ? 'روی VWAP' : 'at VWAP')));
  }
  if (a.cci !== null && a.cci !== undefined) {
    L.push('CCI (20): <b>' + esc(fmt(a.cci, 1)) + '</b>' + (a.cci > 100 ? (fa ? ' — قوی (بالای ۱۰۰)' : ' — strong (above 100)') : a.cci < -100 ? (fa ? ' — ضعیف (زیر −۱۰۰)' : ' — weak (below −100)') : ''));
  }
  if (a.williamsR !== null && a.williamsR !== undefined) {
    L.push('Williams %R (14): <b>' + esc(fmt(a.williamsR, 1)) + '</b>' + (a.williamsR > -20 ? (fa ? ' — اشباع خرید' : ' — overbought') : a.williamsR < -80 ? (fa ? ' — اشباع فروش' : ' — oversold') : ''));
  }
  if (a.mfi !== null && a.mfi !== undefined) {
    L.push('MFI (14): <b>' + esc(fmt(a.mfi, 1)) + '</b>' + (a.mfi >= 80 ? (fa ? ' — اشباع خرید' : ' — overbought') : a.mfi <= 20 ? (fa ? ' — اشباع فروش' : ' — oversold') : ''));
  }
  // v1.18.0 — هم‌جهتی چند تایم‌فریم (فقط وقتی analyze با tfMap صدا شده باشد).
  if (a.multiTf) {
    var mt = a.multiTf;
    var perTxt = Object.keys(mt.perTf).map(function (k) {
      var d = mt.perTf[k];
      return k + ': ' + (d.dir === 'bull' ? (fa ? 'صعودی' : 'bull') : d.dir === 'bear' ? (fa ? 'نزولی' : 'bear') : d.dir === 'flat' ? (fa ? 'خنثی' : 'flat') : '—');
    }).join(' · ');
    L.push('⏱️ ' + (fa ? 'هم‌جهتی تایم‌فریم‌ها: ' : 'Multi-timeframe: ') + perTxt
      + ' — ' + mt.agreeCount + '/' + mt.total + ' ' + (mt.agreeDir === 'bull' ? (fa ? 'صعودی' : 'bullish') : mt.agreeDir === 'bear' ? (fa ? 'نزولی' : 'bearish') : mt.agreeDir === 'flat' ? (fa ? 'خنثی' : 'flat') : (fa ? 'مختلط' : 'mixed')));
  }
  if (ind.w52 && quoteRes && typeof quoteRes.week52High === 'number' && typeof quoteRes.week52Low === 'number' && quoteRes.week52High > quoteRes.week52Low) {
    const pos52 = ((quoteRes.price - quoteRes.week52Low) / (quoteRes.week52High - quoteRes.week52Low)) * 100;
    L.push('📅 ' + (fa ? 'بازهٔ ۵۲ هفته: ' : '52-week range: ') + code(fmt(quoteRes.week52Low) + ' — ' + fmt(quoteRes.week52High)) + (fa ? ' — قیمت در ' : ' — price at ') + code(fmt(pos52, 0) + '%'));
  }
  if (a.atrPct !== null && ind.atr) L.push('ATR (14): ' + code(fmt(a.atrPct, 2) + '%') + (fa ? ' از قیمت' : ' of price'));
  if (ind.volume && a.volRatio !== null) {
    L.push('📊 ' + (fa ? 'حجم آخرین کندل: ' : 'Last candle volume: ') + code((Math.round(a.volRatio * 100) / 100) + '×') + (fa ? ' میانگین ۲۰ کندل' : ' the 20-candle average'));
  }
  return section(lang, '📈 ' + (fa ? 'تحلیل — ' : 'Analysis — ') + disp + ' (' + tfLabel + ')', L,
    fa ? '⚠️ فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.' : '⚠️ Analysis only — not a signal, not a prediction, not trading advice.');
}

/* v1.7.0 — تحلیل پیشرفته: جهت کوتاه‌مدت (تایم‌فریم انتخابی) و بلندمدت
   (EMA200 + ساختار + تغییر ۵۰ کندل)، با دلیل‌ها و شرط تغییر جهت.
   توصیفی است — نه سیگنال، نه پیش‌بینی، نه هدف، نه توصیهٔ معامله.
   کوتاه‌مدت از همان کندل‌های تایم‌فریم انتخابی حساب می‌شود، پس با عوض کردن
   تایم‌فریم، تحلیل هم عوض می‌شود. */
function verdictFromVotes(votes) {
  var net = votes.bull - votes.bear, tot = votes.bull + votes.bear;
  var dir = net >= 3 ? 'bull' : net <= -3 ? 'bear' : 'flat';
  return { dir: dir, bull: votes.bull, bear: votes.bear, total: tot, net: net };
}
function longVerdict(candles) {
  var closes = candles.map(function (c) { return c.c; });
  var last = closes[closes.length - 1];
  var e200 = ema(closes, 200), e50 = ema(closes, 50), e20 = ema(closes, 20);
  var struct = structure(candles);
  var chg = null;
  if (closes.length > 50 && closes[closes.length - 51]) {
    var then = closes[closes.length - 51];
    if (then > 0) chg = (last - then) / then * 100;
  }
  var bull = 0, bear = 0, reasons = [];
  if (e200 != null) {
    if (last > e200) { bull++; reasons.push('بالای EMA200'); }
    else { bear++; reasons.push('زیر EMA200'); }
  }
  if (e50 != null && e20 != null) {
    if (e20 > e50) { bull++; reasons.push('EMA20 بالای EMA50'); }
    else { bear++; reasons.push('EMA20 زیر EMA50'); }
  }
  if (struct === 'bull') { bull++; reasons.push('سقف‌ها و کف‌های بالاتر'); }
  else if (struct === 'bear') { bear++; reasons.push('سقف‌ها و کف‌های پایین‌تر'); }
  if (chg != null) {
    if (chg > 2) { bull++; reasons.push('رشد ' + Math.abs(chg).toFixed(1) + '٪ در ۵۰ کندل اخیر'); }
    else if (chg < -2) { bear++; reasons.push('افت ' + Math.abs(chg).toFixed(1) + '٪ در ۵۰ کندل اخیر'); }
  }
  var net = bull - bear;
  return {
    dir: net >= 2 ? 'bull' : net <= -2 ? 'bear' : 'flat',
    bull: bull, bear: bear, net: net, reasons: reasons,
    ema200: e200, change50: chg, structure: struct,
    candles: candles.length
  };
}
function analyzeAdvanced(candles, tf, tfMap) {
  // tfMap اختیاری است (مثل analyze): { برچسب تایم‌فریم: کندل‌ها }.
  var a = analyze(candles, null, tfMap);
  var short = verdictFromVotes(a.votes);
  var forShort = a.votes.items.filter(function (it) { return short.dir === 'bull' ? it.v > 0 : short.dir === 'bear' ? it.v < 0 : it.v === 0; }).map(function (it) { return it.label; });
  var againstShort = a.votes.items.filter(function (it) { return short.dir === 'bull' ? it.v < 0 : short.dir === 'bear' ? it.v > 0 : it.v !== 0; }).map(function (it) { return it.label; });
  var long = longVerdict(candles);
  // شرط تغییر جهت کوتاه‌مدت: نزدیک‌ترین سطحی که با عبور از آن، رأی EMA20 برمی‌گردد.
  var flip = null;
  if (short.dir === 'bull') flip = { level: a.e20 != null ? a.e20 : a.lo20, label: a.e20 != null ? 'EMA20' : 'حمایت', side: 'below' };
  else if (short.dir === 'bear') flip = { level: a.e20 != null ? a.e20 : a.hi20, label: a.e20 != null ? 'EMA20' : 'مقاومت', side: 'above' };
  else flip = { level: a.e20, label: 'EMA20', side: 'either' };
  return {
    tf: tf || '1h', candles: candles.length,
    short: short, shortFor: forShort, shortAgainst: againstShort,
    long: long, flip: flip, base: a, multiTf: a.multiTf
  };
}

window.OnellaAnalysis = { sma, ema, emaSeries, rsi, macd, atr, stdev, bollinger, changeBack, analyze, formatAnalysis, marketOf, MARKET_INDICATORS, adx, stoch, emaCross, obvDir, volTrend, candleRead, structure, atrSeries, analyzeAdvanced, verdictFromVotes, longVerdict, pivotPoints, supportResistance, fibonacci, rsiSeries, macdHistSeries, findDivergence, detectPatterns, vwap, cci, williams, mfi, multiTfConfluence };

})();
