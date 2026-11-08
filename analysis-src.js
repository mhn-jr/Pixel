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

function analyze(candles, market) {
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
  return {
    market, last, e20, e50, e200, macd: m, rsi: r, bb,
    atrPct: (a !== null && last.c) ? (a / last.c) * 100 : null,
    hi20, lo20, pos, volAvg, volLast, volRatio, rangePct,
    trend,
    longTrend: (e200 === null) ? null : (last.c > e200 ? 'up' : (last.c < e200 ? 'down' : 'neutral'))
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

window.OnellaAnalysis = { sma, ema, emaSeries, rsi, macd, atr, stdev, bollinger, changeBack, analyze, formatAnalysis, marketOf, MARKET_INDICATORS };

})();
