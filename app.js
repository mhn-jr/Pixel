'use strict';
/* Onella Telegram Mini App v1.0.1 — منطق مینی‌اپ (صفحهٔ استاتیک؛ بدون سرور).
   چارت = چارت بومی خود اونلا (chart-style.js + native-chart.js — همان فایل‌های اپ،
   فقط UI اپ حذف شده). تحلیل = همان موتور محلی ربات (analysis-src.js).
   خبر = همان RSS ربات (news-src.js). داده:
     مستقیم (CORS دارد): Binance (کریپتو)، CoinGecko (بنیادی کریپتو)، Frankfurter (قیمت فارکس)
     با پروکسی (PROXY_URL — ورکر Cloudflare): Yahoo (سهام/فارکس/کالا/شاخص)، Google News، Nerkhsanj،
  و کریپتو (Binance/CoinGecko + صرافی ایرانی) وقتی گوشی/PC مستقیم نمی‌رسد
     بدون پروکسی، آن بازارها «در دسترس نیست» می‌گیرند — هرگز عدد ساختگی نمی‌آید.
   سهام ایران (TSETMC) حتی با پروکسی هم نمی‌آید (از IP خارجی بلاک است) — مسیرش ربات روی PC است. */
(function () {
  // آدرس ورکر پروکسی را اینجا بگذار (مثلاً https://onella-mini-proxy.<user>.workers.dev)؛
  // خالی = فقط دادهٔ مستقیم (کریپتو کامل + قیمت فارکس).
  var PROXY_URL = '';

  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  var lang = 'en';
  try {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code === 'fa') lang = 'fa';
    else if ((navigator.language || '').slice(0, 2) === 'fa') lang = 'fa';
  } catch (e) { /* en */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  var L = {
    en: { catalog: 'Catalog', back: '‹ Back', price: 'Price', change24: '24h change', high: 'High 24h', low: 'Low 24h', volume: 'Volume 24h',
      chart: 'Chart', analysis: 'Analysis', fundamentals: 'Fundamentals', news: 'News', impactNews: 'Important & impactful news',
      notAvailable: 'Not available right now.', needProxy: 'Needs the proxy — set PROXY_URL in app.js (see README).',
      iranStockNote: 'Iran stocks need the bot on your PC — they are blocked from foreign IPs.',
      loading: 'Loading…', noCandles: 'No candles for this symbol.', noNews: 'No news found.', noFund: 'No fundamentals for this symbol.',
      trend: 'Trend', rsi: 'RSI (14)', bollinger: 'Bollinger (20, 2σ)', support: 'Support', resistance: 'Resistance', atr: 'ATR (14)',
      change: 'Change', bandWidth: 'Band width', range20: '20-candle range', pos20: 'Position in 20-range', volumeRatio: 'Volume vs avg',
      onlyAnalysis: 'Analysis only — not a signal, not a prediction, not trading advice.',
      impactEst: 'Impact is a keyword estimate, not certain.', openInBot: 'Open in bot', chooseMarket: 'Choose a market:', chooseSymbol: 'Choose a symbol:' },
    fa: { catalog: 'کاتولوگ', back: '‹ بازگشت', price: 'قیمت', change24: 'تغییر ۲۴ ساعت', high: 'سقف ۲۴ ساعت', low: 'کف ۲۴ ساعت', volume: 'حجم ۲۴ ساعت',
      chart: 'چارت', analysis: 'تحلیل', fundamentals: 'بنیادی', news: 'خبر', impactNews: 'خبرهای مهم و تاثیرگذار',
      notAvailable: 'فعلاً در دسترس نیست.', needProxy: 'به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).',
      iranStockNote: 'سهام ایران به ربات روی PC نیاز دارد — از IP خارجی بلاک است.',
      loading: 'در حال بارگذاری…', noCandles: 'برای این نماد کندل نیست.', noNews: 'خبری پیدا نشد.', noFund: 'برای این نماد بنیادی نیست.',
      trend: 'روند', rsi: 'RSI (14)', bollinger: 'بولینگر (۲۰، ۲σ)', support: 'حمایت', resistance: 'مقاومت', atr: 'ATR (14)',
      change: 'تغییر', bandWidth: 'پهنای باند', range20: 'دامنهٔ نوسان ۲۰ کندل', pos20: 'جای قیمت در بازهٔ ۲۰ کندل', volumeRatio: 'حجم نسبت به میانگین',
      onlyAnalysis: 'فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.',
      impactEst: 'تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', openInBot: 'باز کردن در ربات', chooseMarket: 'بازار را انتخاب کن:', chooseSymbol: 'نماد را انتخاب کن:' }
  };
  var T = function (k) { return (L[lang] && L[lang][k]) || L.en[k] || k; };
  var $ = function (id) { return document.getElementById(id); };
  window.$ = $;

  /* ---- کاتولوگ — همان MARKETS ربات (price.js) ---- */
  var MARKETS = {
    crypto: { label: 'Crypto', emoji: '🪙', quotes: [
      { label: 'BTC', provider: 'binance', symbol: 'BTCUSDT', display: 'BTC/USDT' },
      { label: 'ETH', provider: 'binance', symbol: 'ETHUSDT', display: 'ETH/USDT' },
      { label: 'SOL', provider: 'binance', symbol: 'SOLUSDT', display: 'SOL/USDT' },
      { label: 'BNB', provider: 'binance', symbol: 'BNBUSDT', display: 'BNB/USDT' },
      { label: 'XRP', provider: 'binance', symbol: 'XRPUSDT', display: 'XRP/USDT' },
      { label: 'DOGE', provider: 'binance', symbol: 'DOGEUSDT', display: 'DOGE/USDT' } ] },
    stocks: { label: 'Stocks', emoji: '📈', quotes: [
      { label: 'AAPL', provider: 'yahoo', symbol: 'AAPL', display: 'AAPL' },
      { label: 'MSFT', provider: 'yahoo', symbol: 'MSFT', display: 'MSFT' },
      { label: 'NVDA', provider: 'yahoo', symbol: 'NVDA', display: 'NVDA' },
      { label: 'TSLA', provider: 'yahoo', symbol: 'TSLA', display: 'TSLA' },
      { label: 'AMZN', provider: 'yahoo', symbol: 'AMZN', display: 'AMZN' },
      { label: 'GOOGL', provider: 'yahoo', symbol: 'GOOGL', display: 'GOOGL' } ] },
    forex: { label: 'Forex', emoji: '💱', quotes: [
      { label: 'EUR/USD', provider: 'yahoo', symbol: 'EURUSD=X', display: 'EUR/USD' },
      { label: 'GBP/USD', provider: 'yahoo', symbol: 'GBPUSD=X', display: 'GBP/USD' },
      { label: 'USD/JPY', provider: 'yahoo', symbol: 'USDJPY=X', display: 'USD/JPY' },
      { label: 'AUD/USD', provider: 'yahoo', symbol: 'AUDUSD=X', display: 'AUD/USD' },
      { label: 'USD/CHF', provider: 'yahoo', symbol: 'USDCHF=X', display: 'USD/CHF' },
      { label: 'EUR/GBP', provider: 'yahoo', symbol: 'EURGBP=X', display: 'EUR/GBP' } ] },
    commodities: { label: 'Gold & Commodities', emoji: '🥇', quotes: [
      { label: 'Gold', provider: 'yahoo', symbol: 'GC=F', display: 'Gold (GC=F)' },
      { label: 'Silver', provider: 'yahoo', symbol: 'SI=F', display: 'Silver (SI=F)' },
      { label: 'Oil (WTI)', provider: 'yahoo', symbol: 'CL=F', display: 'Oil (CL=F)' },
      { label: 'Oil (Brent)', provider: 'yahoo', symbol: 'BZ=F', display: 'Oil (BZ=F)' },
      { label: 'Nat. Gas', provider: 'yahoo', symbol: 'NG=F', display: 'Natural Gas (NG=F)' },
      { label: 'Copper', provider: 'yahoo', symbol: 'HG=F', display: 'Copper (HG=F)' } ] },
    iran: { label: 'Iran', emoji: '🇮🇷', quotes: [
      { label: 'USD', provider: 'iran-rate', symbol: 'usd', display: 'دلار (تومان)' },
      { label: 'EUR', provider: 'iran-rate', symbol: 'eur', display: 'یورو (تومان)' },
      { label: 'Gold 18k', provider: 'iran-rate', symbol: 'gold18', display: 'طلا ۱۸ عیار (تومان)' },
      { label: 'Emami Coin', provider: 'iran-rate', symbol: 'emami', display: 'سکه امامی (تومان)' },
      { label: 'Mithqal', provider: 'iran-rate', symbol: 'mithqal', display: 'مثقال طلا (تومان)' },
      { label: 'Foolad', provider: 'iran-stock', symbol: 'فولاد', display: 'فولاد (ریال)' } ] },
    indices: { label: 'Indices', emoji: '📊', quotes: [
      { label: 'S&P 500', provider: 'yahoo', symbol: '^GSPC', display: 'S&P 500' },
      { label: 'Dow', provider: 'yahoo', symbol: '^DJI', display: 'Dow Jones' },
      { label: 'Nasdaq', provider: 'yahoo', symbol: '^IXIC', display: 'Nasdaq' },
      { label: 'DAX', provider: 'yahoo', symbol: '^GDAXI', display: 'DAX' },
      { label: 'FTSE', provider: 'yahoo', symbol: '^FTSE', display: 'FTSE' },
      { label: 'Nikkei', provider: 'yahoo', symbol: '^N225', display: 'Nikkei 225' } ] }
  };
  var TF = { '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };

  /* ---- ابزار کوچک ---- */
  window.fmt = function (p) { return p >= 1000 ? p.toLocaleString('en', { maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(3) : Number(p.toPrecision(4)).toString(); };
  function fmt(n, d) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(d === undefined ? 3 : d);
    return Number(n.toPrecision(4)).toString();
  }
  function fmtPct(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    return (n >= 0 ? '+' : '') + (Math.round(n * 100) / 100) + '%';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function withTimeout(p, ms) {
    return Promise.race([Promise.resolve(p), new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]).catch(function () { return null; });
  }
  async function fetchJSON(url, ms) {
    try {
      var r = await withTimeout(fetch(url, { headers: { Accept: 'application/json' } }), ms || 8000);
      if (!r || !r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }
  function proxyUrl(kind, target) {
    if (!PROXY_URL) return null;
    return PROXY_URL.replace(/\/$/, '') + '/' + kind + '?u=' + encodeURIComponent(target);
  }
  // v1.0.2: گرفتن JSON از ورکر؛ بدون PROXY_URL یعنی null (همان رفتار قبلی، بدون پروکسی).
  async function viaWorker(kind, url, ms) {
    var u = proxyUrl(kind, url);
    if (!u) return null;
    return fetchJSON(u, ms || 10000);
  }

  /* ---- داده: کریپتو (مستقیم Binance) ---- */
  var CG_IDS = { BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', SOLUSDT: 'solana', BNBUSDT: 'binancecoin', XRPUSDT: 'ripple', DOGEUSDT: 'dogecoin' }; // v1.0.1: برای fallback قیمت/کندل کریپتو از ایران
  function parseCgTicker(g, id) {
    var c = g && g[id];
    if (!c || !(c.usd > 0)) return null;
    return { price: c.usd, changePct: (typeof c.usd_24h_change === 'number' ? c.usd_24h_change : null),
      high: (typeof c.usd_24h_high === 'number' ? c.usd_24h_high : null),
      low: (typeof c.usd_24h_low === 'number' ? c.usd_24h_low : null),
      volume: (typeof c.usd_24h_vol === 'number' ? c.usd_24h_vol : null), currency: 'USD' };
  }
  function parseBinanceTicker(j) {
    if (!j || !(+j.lastPrice > 0)) return null;
    return { price: +j.lastPrice, changePct: +j.priceChangePercent, high: +j.highPrice, low: +j.lowPrice, volume: +j.volume, currency: 'USDT' };
  }
  async function binanceTicker(sym) {
    var bUrl = 'https://data-api.binance.vision/api/v3/ticker/24hr?symbol=' + encodeURIComponent(sym);
    var r = parseBinanceTicker(await fetchJSON(bUrl, 8000));
    if (r) return r;
    // v1.0.1: Binance از IP ایران بلاک است — fallback به CoinGecko (قیمت + تغییر ۲۴س + حجم ۲۴س).
    var id = CG_IDS[sym];
    var cgUrl = id ? 'https://api.coingecko.com/api/v3/simple/price?ids=' + id + '&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_24hr_high=true&include_24hr_low=true' : null;
    if (cgUrl) {
      var cg = parseCgTicker(await fetchJSON(cgUrl, 8000), id);
      if (cg) return cg;
    }
    // v1.0.2: مستقیم نشد — از ورکر (Cloudflare)؛ ورکر از IP خودش به Binance/CoinGecko می‌رسد.
    r = parseBinanceTicker(await viaWorker('binance', bUrl, 10000));
    if (r) return r;
    if (cgUrl) {
      var cgw = parseCgTicker(await viaWorker('coingecko', cgUrl, 10000), id);
      if (cgw) return cgw;
    }
    // v1.0.2: قیمت جهانی نیامد — null. قیمت ایرانی «خودکار» جایگزین نمی‌شود؛
    // انتخاب دومِ کاربر است (loadSymbol جداگانه می‌گیرد و با دکمهٔ «دلار | تومان» نشان می‌دهد).
    return null;
  }
  // v1.0.2: قیمت کریپتو از صرافی ایرانی — Exir بعد Wallex بعد Nobitex.
  // واحد: Exir و Wallex «تومان» مستقیم‌اند (پروب ۲۰۲۶-۱۱-۰۹: BTC اکسیر ۲۰٬۳۲۰٬۷۰۰٬۰۰۰، والکس ۲۰٬۱۶۴٬۰۲۷٬۱۸۴)؛
  // فقط Nobitex ریالی است (÷۱۰ = تومان). اگر ورکر نوبیتکس را نگیرد (بلاک IP خارجی)، زنجیره همان‌جا تمام می‌شود.
  var IRAN_BASE = { BTCUSDT: 'btc', ETHUSDT: 'eth', SOLUSDT: 'sol', BNBUSDT: 'bnb', XRPUSDT: 'xrp', DOGEUSDT: 'doge' };
  var WALLEX_SYM = { BTCUSDT: 'BTCTMN', ETHUSDT: 'ETHTMN', SOLUSDT: 'SOLTMN', BNBUSDT: 'BNBTMN', XRPUSDT: 'XRPTMN', DOGEUSDT: 'DOGETMN' };
  async function iranCryptoPrice(sym) {
    var base = IRAN_BASE[sym];
    if (!base) return null;
    var ej = await viaWorker('iran', 'https://api.exir.io/v2/tickers', 10000);
    var t = ej && ej[base + '-irt'];
    if (t && +t.last > 0) {
      var ch = (typeof t.open === 'number' && t.open > 0) ? ((+t.last - t.open) / t.open) * 100 : null;
      return { price: +t.last, changePct: ch,
        high: (typeof t.high === 'number' ? t.high : null),
        low: (typeof t.low === 'number' ? t.low : null),
        volume: null, currency: 'Toman', iran: true };
    }
    var wj = await viaWorker('iran', 'https://api.wallex.ir/v1/markets', 10000);
    var ws = wj && wj.result && wj.result.symbols && wj.result.symbols[WALLEX_SYM[sym]];
    var wst = ws && ws.stats;
    if (wst && +wst.lastPrice > 0) {
      return { price: +wst.lastPrice, changePct: (typeof wst['24h_ch'] === 'number' ? wst['24h_ch'] : null),
        high: null, low: null, volume: null, currency: 'Toman', iran: true };
    }
    var nj = await viaWorker('iran', 'https://api.nobitex.ir/market/stats?srcCurrency=' + base + '&dstCurrency=irt', 10000);
    var ns = nj && nj.stats && nj.stats[base + '-irt'];
    if (ns && +ns.latest > 0) {
      return { price: +ns.latest / 10, changePct: (typeof ns.dayChange === 'number' ? ns.dayChange : null),
        high: (typeof ns.dayHigh === 'number' ? +ns.dayHigh / 10 : null),
        low: (typeof ns.dayLow === 'number' ? +ns.dayLow / 10 : null),
        volume: null, currency: 'Toman', iran: true };
    }
    return null;
  }
  function parseBinanceKlines(j) {
    if (!Array.isArray(j)) return null;
    var out = [];
    for (var i = 0; i < j.length; i++) {
      var k = j[i];
      if (!Array.isArray(k) || k.length < 11) continue;
      out.push({ t: +k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] });
    }
    return out.length >= 2 ? out : null;
  }
  function parseCgOhlc(o) {
    if (!Array.isArray(o)) return null;
    var out = [];
    for (var i = 0; i < o.length; i++) {
      var r = o[i];
      if (!Array.isArray(r) || r.length < 5) continue;
      out.push({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: 0 });
    }
    return out.length >= 2 ? out : null;
  }
  async function binanceKlines(sym, interval, limit) {
    var bUrl = 'https://data-api.binance.vision/api/v3/klines?symbol=' + encodeURIComponent(sym) + '&interval=' + interval + '&limit=' + (limit || 200);
    var out = parseBinanceKlines(await fetchJSON(bUrl, 10000));
    if (out) return out;
    // v1.0.1: Binance از IP ایران بلاک است — fallback به CoinGecko OHLC (کندل ۴ ساعته؛
    // فقط برای تایم‌فریم ۴ ساعته و روزانه قابل استفاده است — برای 15m/1h همان ۴ ساعته را نشان می‌دهیم).
    var id = CG_IDS[sym];
    var days = interval === '1d' ? 30 : 7;
    var cgUrl = id ? 'https://api.coingecko.com/api/v3/coins/' + id + '/ohlc?vs_currency=usd&days=' + days : null;
    if (cgUrl) {
      var o = parseCgOhlc(await fetchJSON(cgUrl, 10000));
      if (o) return o;
    }
    // v1.0.2: مستقیم نشد — از ورکر (Binance بعد CoinGecko).
    out = parseBinanceKlines(await viaWorker('binance', bUrl, 12000));
    if (out) return out;
    if (cgUrl) {
      var ow = parseCgOhlc(await viaWorker('coingecko', cgUrl, 12000));
      if (ow) return ow;
    }
    return null;
  }
  /* ---- داده: Yahoo (فقط با پروکسی — مرورگر مستقیم بلاک است) ---- */
  async function yahooChart(sym, range, interval) {
    var u = proxyUrl('yahoo-chart', 'https://query2.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + range + '&interval=' + interval);
    if (!u) return null;
    var j = await fetchJSON(u, 12000);
    var res0 = j && j.chart && Array.isArray(j.chart.result) && j.chart.result[0];
    if (!res0) return null;
    var ts = res0.timestamp || [], q = (res0.indicators && res0.indicators.quote && res0.indicators.quote[0]) || {};
    var out = [];
    for (var i = 0; i < ts.length; i++) {
      var c = q.close && q.close[i], o = q.open && q.open[i], h = q.high && q.high[i], l = q.low && q.low[i], v = q.volume && q.volume[i];
      if (typeof c !== 'number') continue;
      out.push({ t: ts[i] * 1000, o: (typeof o === 'number' ? o : c), h: (typeof h === 'number' ? h : c), l: (typeof l === 'number' ? l : c), c: c, v: (typeof v === 'number' ? v : 0) });
    }
    return { candles: out.length >= 2 ? out : null, meta: res0.meta || null };
  }
  async function yahooQuote(sym) {
    var u = proxyUrl('yahoo-quote', sym);
    if (!u) return null;
    var j = await fetchJSON(u, 15000);
    return (j && j.quote) ? j.quote : null;
  }
  /* ---- داده: فارکس مستقیم (Frankfurter) — فقط قیمت ---- */
  var FX_PAIRS = { 'EURUSD=X': ['EUR', 'USD'], 'GBPUSD=X': ['GBP', 'USD'], 'USDJPY=X': ['USD', 'JPY'], 'AUDUSD=X': ['AUD', 'USD'], 'USDCHF=X': ['USD', 'CHF'], 'EURGBP=X': ['EUR', 'GBP'] };
  async function frankfurterPrice(sym) {
    var p = FX_PAIRS[sym];
    if (!p) return null;
    var j = await fetchJSON('https://api.frankfurter.app/latest?from=' + p[0] + '&to=' + p[1], 8000);
    if (!j || !j.rates || !(j.rates[p[1]] > 0)) return null;
    return { price: j.rates[p[1]], changePct: null, high: null, low: null, open: null, prevClose: null, volume: null, currency: p[1] };
  }
  /* ---- داده: ایران (Nerkhsanj — فقط با پروکسی) ---- */
  var IRAN_KEYS = { usd: 'dollar', eur: 'euro', gold18: 'gold', emami: 'coin', mithqal: 'mithqal' };
  async function iranRate(key) {
    var u = proxyUrl('nerkhsanj', 'https://nerkh.jahankhahan.shop/data/live.json');
    if (!u) return null;
    var j = await fetchJSON(u, 10000);
    var rates = j && j.rates;
    var k = IRAN_KEYS[key];
    if (!rates || !k || !(rates[k] > 0)) return null;
    return { price: rates[k], changePct: null, high: null, low: null, open: null, prevClose: null, volume: null, currency: 'Toman' };
  }
  /* ---- داده: بنیادی کریپتو (مستقیم CoinGecko) ---- */

  async function coingeckoFund(sym) {
    var id = CG_IDS[sym];
    if (!id) return null;
    var fundUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + id + '&price_change_percentage=24h,7d,30d';
    var j = await fetchJSON(fundUrl, 10000);
    if (!Array.isArray(j) || !j[0]) j = await viaWorker('coingecko', fundUrl, 12000); // v1.0.2: مستقیم نشد — از ورکر.
    if (!Array.isArray(j) || !j[0]) return null;
    var c = j[0];
    return { name: c.name, rank: c.market_cap_rank, marketCap: c.market_cap, fdv: c.fully_diluted_valuation, volume24: c.total_volume,
      chg24: c.price_change_percentage_24h_in_currency, chg7d: c.price_change_percentage_7d_in_currency, chg30d: c.price_change_percentage_30d_in_currency,
      circulating: c.circulating_supply, total: c.total_supply, max: c.max_supply, ath: c.ath, athChange: c.ath_change_percentage, atl: c.atl, atlChange: c.atl_change_percentage };
  }

  /* ---- وضعیت ---- */
  var state = { view: 'catalog', market: null, quote: null, tf: '1h', tab: 'chart', candles: null, quoteRes: null, loading: 0, priceUsd: null, priceIran: null, priceMode: 'usd', candlesDone: false };

  /* ---- سیم‌کشی چارت اونلا (chart-style + native-chart) ---- */
  window.__ov = window.__ov || {};
  /* cs/cur/pair/tf: در native-chart.js روی window نگاشت شده‌اند (shim) — اینجا فقط مقدار می‌دهیم. */
  var nInit = false, demo = false, tvOn = false, tvInit = false;
  function T(fa, en) { return lang === 'fa' ? fa : en; }
  window.T = T;
  window.nInit = false; window.demo = false; window.tvOn = false; window.tvInit = false;
  function marketPairName() { return state.quote ? state.quote.display + '  ' : ''; }
  window.marketPairName = marketPairName;
  async function candlesFor() {
    // همان امضای loadNative اونلا: { d: candles, ... } — داده از همین مینی‌اپ می‌آید.
    if (!state.candles || state.candles.length < 2) return { d: [], error: 'no-candles' };
    return { d: state.candles.slice(), offline: false };
  }
  window.candlesFor = candlesFor;
  // draw() و head() و loadNative() از native-chart.js می‌آیند (global).

  /* ---- رندر: کاتولوگ ---- */
  function show(view) {
    state.view = view;
    $('view-catalog').style.display = view === 'catalog' ? '' : 'none';
    $('view-symbol').style.display = view === 'symbol' ? '' : 'none';
    $('backBtn').style.display = view === 'symbol' ? '' : 'none';
    if (view === 'catalog') renderCatalog();
    if (tg) { try { tg.expand(); } catch (e) {} }
  }
  function renderCatalog() {
    $('catalogTitle').textContent = T('کاتولوگ', 'Catalog');
    var html = '';
    Object.keys(MARKETS).forEach(function (k) {
      var m = MARKETS[k];
      html += '<div class="mkt"><div class="mkt-h">' + m.emoji + ' ' + esc(m.label) + '</div><div class="syms">';
      m.quotes.forEach(function (q) {
        html += '<button class="sym" data-provider="' + q.provider + '" data-symbol="' + esc(q.symbol) + '">' + esc(q.label) + '</button>';
      });
      html += '</div></div>';
    });
    $('catalog').innerHTML = html;
    $('catalog').querySelectorAll('.sym').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = null;
        Object.keys(MARKETS).forEach(function (k) {
          MARKETS[k].quotes.forEach(function (x) { if (x.provider === b.dataset.provider && x.symbol === b.dataset.symbol) q = x; });
        });
        if (q) openSymbol(q);
      });
    });
  }

  /* ---- رندر: نماد ---- */
  function row(label, value) {
    return '<div class="row"><span>' + esc(label) + '</span><b>' + value + '</b></div>';
  }
  function openSymbol(q) {
    state.quote = q;
    state.tab = 'chart';
    state.candles = null; state.quoteRes = null;
    state.priceUsd = null; state.priceIran = null; state.priceMode = 'usd'; state.candlesDone = false;
    window.pair.sym = q.symbol; window.pair.base = q.label; window.pair.kind = (q.provider === 'binance') ? 'crypto' : 'other';
    window.tf = state.tf;
    show('symbol');
    $('symTitle').textContent = q.display;
    $('priceBox').innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    $('tabChart').innerHTML = '';
    $('tabAnalysis').innerHTML = '';
    $('tabFund').innerHTML = '';
    $('tabNews').innerHTML = '';
    setTab('chart');
    loadSymbol();
  }
  function setTab(tab) {
    state.tab = tab;
    ['chart', 'analysis', 'fund', 'news'].forEach(function (t) {
      $('tabBtn-' + t).classList.toggle('on', t === tab);
      $('tab-' + t).style.display = t === tab ? '' : 'none';
    });
    if (tab === 'chart' && state.candles) { setTimeout(function () { try { window.draw(); } catch (e) {} }, 30); }
    if (tab === 'analysis') renderAnalysis();
    if (tab === 'fund') renderFund();
    if (tab === 'news') renderNews();
  }
  function setTf(t) {
    state.tf = t; window.tf = t;
    document.querySelectorAll('#tfRow button').forEach(function (b) { b.classList.toggle('on', b.dataset.tf === t); });
    loadCandles();
  }

  // v1.0.2: قیمت دلاری پیش‌فرض است؛ قیمت ایرانی (تومان) انتخاب دومِ کاربر است —
  // با دکمهٔ «دلار | تومان» عوض می‌شود، نه خودکار. اگر قیمت جهانی نیامد، باکس «در دسترس نیست»
  // می‌شود ولی دکمهٔ تومان (اگر قیمت ایرانی رسید) هنوز هست تا کاربر خودش انتخاب کند.
  function renderPriceBox(needProxy, iranBlocked) {
    var q = state.quote;
    var p = state.priceMode === 'iran' ? state.priceIran : state.priceUsd;
    var canSwitch = !!(state.priceUsd && state.priceIran);
    var iranOnly = !state.priceUsd && !!state.priceIran;
    if (!p) {
      $('priceBox').innerHTML = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>'
        + (iranBlocked ? '<div class="hint">' + esc(T('سهام ایران به ربات روی PC نیاز دارد — از IP خارجی بلاک است.', 'Iran stocks need the bot on your PC — they are blocked from foreign IPs.')) + '</div>'
        : (needProxy ? '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>' : ''))
        + (iranOnly ? '<div class="seg"><button type="button" data-mode="iran">' + esc(T('قیمت ایران (تومان)', 'Iran price (Toman)')) + '</button></div>' : '');
      bindPriceMode();
      return;
    }
    var unit = ' ' + (p.currency || '');
    var ch = (typeof p.changePct === 'number') ? ' <span class="' + (p.changePct >= 0 ? 'up' : 'dn') + '">' + fmtPct(p.changePct) + '</span>' : '';
    $('priceBox').innerHTML = '<div class="big">' + fmt(p.price) + '<span class="unit">' + esc(unit) + '</span></div>'
      + '<div class="sub">' + esc(T('تغییر ۲۴ ساعت', '24h change')) + ': ' + ch + '</div>'
      + ((p.high != null) ? row(T('سقف ۲۴ ساعت', 'High 24h'), fmt(p.high)) : '')
      + ((p.low != null) ? row(T('کف ۲۴ ساعت', 'Low 24h'), fmt(p.low)) : '')
      + ((p.volume != null) ? row(T('حجم ۲۴ ساعت', 'Volume 24h'), fmt(p.volume)) : '')
      + (canSwitch ? '<div class="seg"><button type="button" data-mode="usd"' + (state.priceMode === 'usd' ? ' class="on"' : '') + '>' + esc(T('دلار', 'USD')) + '</button>'
        + '<button type="button" data-mode="iran"' + (state.priceMode === 'iran' ? ' class="on"' : '') + '>' + esc(T('تومان', 'Toman')) + '</button></div>' : '');
    bindPriceMode();
  }
  function bindPriceMode() {
    var btns = $('priceBox').querySelectorAll('[data-mode]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.priceMode = b.dataset.mode;
        renderPriceBox(false, false);
      });
    });
  }
  function naTabs(msgKey) {
    // v1.0.2: وقتی قیمت/کندل نیامد، تب‌ها روی «در حال بارگذاری» گیر نکنند.
    var m = '<div class="na">' + esc(T('فعلاً در دسترس نیست.', 'Not available right now.')) + '</div>';
    $('tabAnalysis').innerHTML = m;
    $('tabFund').innerHTML = m;
    $('tabNews').innerHTML = m;
  }

  async function loadSymbol() {
    var q = state.quote;
    var my = ++state.loading;
    // قیمت — دلاری و ایرانی موازی گرفته می‌شوند؛ دلاری پیش‌فرض است، ایرانی انتخاب دوم.
    var price = null, needProxy = false, iranBlocked = false;
    if (q.provider === 'binance') {
      var both = await Promise.all([binanceTicker(q.symbol), iranCryptoPrice(q.symbol)]);
      price = both[0];
      state.priceUsd = both[0];
      state.priceIran = both[1];
      state.priceMode = 'usd';
    }
    else if (q.provider === 'yahoo') {
      if (FX_PAIRS[q.symbol]) price = await frankfurterPrice(q.symbol);
      if (!price) { var yq = await yahooQuote(q.symbol); if (yq) { price = yq; state.quoteRes = yq; } else needProxy = true; }
      else { var yq2 = await yahooQuote(q.symbol); if (yq2) state.quoteRes = yq2; }
      state.priceUsd = price;
    }
    else if (q.provider === 'iran-rate') { price = await iranRate(q.symbol); if (!price) needProxy = true; state.priceUsd = price; }
    else if (q.provider === 'iran-stock') { iranBlocked = true; }
    if (my !== state.loading) return;
    if (!price) {
      state.candlesDone = true; // کندلی در راه نیست — تب تحلیل «در حال بارگذاری» نماند.
      renderPriceBox(needProxy, iranBlocked);
      $('tabChart').innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      naTabs();
      return;
    }
    renderPriceBox(needProxy, iranBlocked);
    loadCandles();
    renderFund();
    renderNews();
  }

  async function loadCandles() {
    var q = state.quote;
    if (!q) return;
    var my = state.loading;
    var candles = null;
    if (q.provider === 'binance') {
      candles = await binanceKlines(q.symbol, state.tf, 200);
      if (candles && candles.length >= 2) {
        // v1.0.1: اگر کندل‌ها از CoinGecko آمدند، فاصله‌شان ۴ ساعت است — تایم‌فریم واقعی را ثبت کن
        // تا دکمهٔ تایم‌فریم و شمارش معکوس کندل، همان ۴ ساعته را نشان بدهند (نه 1h).
        var gap = candles.length > 1 ? candles[1].t - candles[0].t : 0;
        if (gap >= 3.5 * 3600 * 1000 && gap <= 4.5 * 3600 * 1000 && state.tf !== '4h' && state.tf !== '1d') {
          // renderChartShell از state.tf دکمهٔ درست را روشن می‌کند.
          state.tf = '4h'; window.tf = '4h';
        }
      }
    } else if (q.provider === 'yahoo') {
      var range = { '15m': '5d', '1h': '1mo', '4h': '3mo', '1d': '1y' }[state.tf] || '1mo';
      var interval = state.tf;
      var r = await yahooChart(q.symbol, range, interval);
      if (r && r.candles) {
        candles = r.candles;
        if (state.tf === '4h') candles = aggregateCandles(candles, 4); // Yahoo 4h ندارد — از ۴×۱h می‌سازیم (همان ربات)
      }
    }
    if (my !== state.loading) return;
    state.candles = candles;
    state.candlesDone = true;
    if (state.tab === 'analysis') renderAnalysis();
    if (!candles) {
      $('tabChart').innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      return;
    }
    // چارت اونلا: cs را می‌گیرد و draw می‌کند (همان draw اپ).
    window.cs = candles.slice();
    window.cur = -1;
    renderChartShell();
    try { window.draw(); } catch (e) { $('tabChart').innerHTML = '<div class="na">' + esc(String(e && e.message || e)) + '</div>'; }
    if (state.tab === 'analysis') renderAnalysis();
  }
  function aggregateCandles(csArr, n) {
    var out = [];
    for (var i = 0; i + n - 1 < csArr.length; i += n) {
      var g = csArr.slice(i, i + n);
      out.push({ t: g[0].t, o: g[0].o, h: Math.max.apply(null, g.map(function (c) { return c.h; })), l: Math.min.apply(null, g.map(function (c) { return c.l; })), c: g[g.length - 1].c, v: g.reduce(function (a, c) { return a + (c.v || 0); }, 0) });
    }
    return out.length >= 2 ? out : null;
  }
  function renderChartShell() {
    var types = (window.OnellaChartStyle && window.OnellaChartStyle.types) || ['candle'];
    var typeBtns = types.map(function (t) {
      var cur2 = window.OnellaChartStyle.get().type;
      return '<button class="chip' + (cur2 === t ? ' on' : '') + '" data-type="' + t + '">' + esc(t) + '</button>';
    }).join('');
    $('tabChart').innerHTML =
      '<div id="px" class="px"></div>'
      + '<div class="chartwrap"><div id="nv" style="position:relative;height:260px"><canvas id="cc" style="width:100%;height:260px;display:block"></canvas></div></div>'
      + '<div id="tfRow" class="seg">' + Object.keys(TF).map(function (k) {
          return '<button data-tf="' + k + '"' + (state.tf === k ? ' class="on"' : '') + '>' + k + '</button>';
        }).join('') + '</div>'
      + '<div class="seg">' + typeBtns + '</div>';
    document.querySelectorAll('#tfRow button').forEach(function (b) {
      b.addEventListener('click', function () { setTf(b.dataset.tf); });
    });
    $('tabChart').querySelectorAll('[data-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        try { window.OnellaChartStyle.set({ type: b.dataset.type }); } catch (e) {}
        renderChartShell();
        try { window.draw(); } catch (e2) {}
      });
    });
    // کراس‌هِر: همان pointermove اپ (native-chart.js).
    var cvs = $('cc');
    cvs.addEventListener('pointermove', function (e) {
      var r = cvs.getBoundingClientRect(), st = ((window.__ov || {}).st || 7);
      var n = Math.min(cs.length, Math.floor((r.width - 46) / st));
      var i = Math.floor((e.clientX - r.left) / st);
      window.cur = (i >= 0 && i < n) ? i : -1;
      try { window.head(); window.draw(); } catch (err) {}
    });
    cvs.addEventListener('pointerleave', function () { window.cur = -1; try { window.head(); window.draw(); } catch (err) {} });
    try { window.head(); } catch (e) {}
  }

  /* ---- تحلیل (همان موتور ربات؛ DOM به‌جای HTML تلگرام) ---- */
  function renderAnalysis() {
    var el = $('tabAnalysis');
    if (!state.candles) {
      // v1.0.2: اگر بارگذاری کندل تمام شد و کندلی نیست، «نیست» نشان بده — نه «در حال بارگذاری» برای همیشه.
      if (state.candlesDone) {
        el.innerHTML = '<div class="na">' + esc(T('برای این نماد کندل نیست.', 'No candles for this symbol.')) + '</div>';
      } else {
        el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
      }
      return;
    }
    if (state.candles.length < 35) {
      el.innerHTML = '<div class="na">' + esc(T('برای تحلیل حداقل ۳۵ کندل لازم است.', 'At least 35 candles are needed for analysis.')) + '</div>';
      return;
    }
    var A = window.OnellaAnalysis;
    var a = A.analyze(state.candles, A.marketOf(state.quote));
    var closes = state.candles.map(function (c) { return c.c; });
    var back = { '15m': [96, 672], '1h': [24, 168], '4h': [6, 42], '1d': [1, 7] }[state.tf] || [24, 168];
    var chgS = A.changeBack(closes, back[0]), chgL = A.changeBack(closes, back[1]);
    var ind = A.MARKET_INDICATORS[A.marketOf(state.quote)] || { volume: true, atr: true, macd: true, w52: false };
    var trendTxt = a.trend === 'up' ? T('صعودی', 'Uptrend') : a.trend === 'down' ? T('نزولی', 'Downtrend') : T('خنثی', 'Neutral');
    var html = '<div class="rows">'
      + row(T('تغییر', 'Change') + ' (' + back[0] + ')', fmtPct(chgS))
      + row(T('تغییر', 'Change') + ' (' + back[1] + ')', fmtPct(chgL))
      + row(T('روند', 'Trend'), esc(trendTxt) + ' — EMA20 ' + fmt(a.e20) + ' • EMA50 ' + fmt(a.e50)
        + (a.e200 != null ? ' • EMA200 ' + fmt(a.e200) + ' (' + (a.longTrend === 'up' ? T('صعودی', 'up') : a.longTrend === 'down' ? T('نزولی', 'down') : T('خنثی', 'neutral')) + ')' : '')
        + (a.macd ? ' • MACD ' + fmt(a.macd.hist) : ''))
      + row(T('RSI (14)', 'RSI (14)'), (a.rsi == null ? '—' : a.rsi.toFixed(1)))
      + (a.bb ? row(T('بولینگر (۲۰، ۲σ)', 'Bollinger (20, 2σ)'), fmt(a.bb.upper) + ' • ' + fmt(a.bb.mid) + ' • ' + fmt(a.bb.lower) + ' — ' + Math.round(a.bb.pos) + '%') : '')
      + (a.bb ? row(T('پهنای باند', 'Band width'), (a.bb.widthPct == null ? '—' : a.bb.widthPct.toFixed(2) + '%')) : '')
      + row(T('حمایت', 'Support'), fmt(a.lo20))
      + row(T('مقاومت', 'Resistance'), fmt(a.hi20))
      + row(T('جای قیمت در بازهٔ ۲۰ کندل', 'Position in 20-range'), (a.pos == null ? '—' : Math.round(a.pos) + '%'))
      + row(T('دامنهٔ نوسان ۲۰ کندل', '20-candle range'), (a.rangePct == null ? '—' : a.rangePct.toFixed(2) + '%'))
      + (ind.w52 && state.quoteRes && state.quoteRes.week52High ? row('52W', fmt(state.quoteRes.week52Low) + ' – ' + fmt(state.quoteRes.week52High)) : '')
      + (ind.atr ? row(T('ATR (14)', 'ATR (14)'), (a.atrPct == null ? '—' : a.atrPct.toFixed(2) + '%')) : '')
      + (ind.volume ? row(T('حجم نسبت به میانگین', 'Volume vs avg'), (a.volRatio == null ? '—' : a.volRatio.toFixed(2) + '×')) : '')
      + '</div><div class="warn">' + esc(T('فقط تحلیل است — نه سیگنال، نه پیش‌بینی، نه توصیهٔ معامله.', 'Analysis only — not a signal, not a prediction, not trading advice.')) + '</div>';
    el.innerHTML = html;
  }

  /* ---- بنیادی ---- */
  function renderFund() {
    var el = $('tabFund');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    if (q.provider === 'binance') {
      coingeckoFund(q.symbol).then(function (f) {
        if (!f) { el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>'; return; }
        el.innerHTML = '<div class="rows">'
          + (f.rank ? row('#', String(f.rank)) : '')
          + row(T('ارزش بازار', 'Market cap'), f.marketCap ? '$' + fmt(f.marketCap) : '—')
          + row('FDV', f.fdv ? '$' + fmt(f.fdv) : '—')
          + row(T('حجم ۲۴ ساعت', 'Volume 24h'), f.volume24 ? '$' + fmt(f.volume24) : '—')
          + row(T('تغییر ۲۴ ساعت', 'Change 24h'), fmtPct(f.chg24))
          + row(T('تغییر ۷ روز', 'Change 7d'), fmtPct(f.chg7d))
          + row(T('تغییر ۳۰ روز', 'Change 30d'), fmtPct(f.chg30d))
          + row(T('در گردش', 'Circulating'), f.circulating ? fmt(f.circulating) : '—')
          + row(T('سقف تاریخی', 'ATH'), f.ath ? '$' + fmt(f.ath) + (f.athChange != null ? ' (' + fmtPct(f.athChange) + ')' : '') : '—')
          + row(T('کف تاریخی', 'ATL'), f.atl ? '$' + fmt(f.atl) : '—')
          + '</div>';
      });
      return;
    }
    if (q.provider === 'yahoo') {
      if (!state.quoteRes) {
        el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>'
          + '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>';
        return;
      }
      var r = state.quoteRes;
      var dy = (typeof r.divYield === 'number') ? ((r.divYield > 0.05 ? r.divYield : r.divYield * 100).toFixed(2) + '%') : '—';
      el.innerHTML = '<div class="rows">'
        + (r.name ? row(T('نام', 'Name'), esc(r.name)) : '')
        + row(T('ارزش بازار', 'Market cap'), r.marketCap ? '$' + fmt(r.marketCap) : '—')
        + row('P/E', r.pe != null ? fmt(r.pe) : '—')
        + row('P/E (forward)', r.peForward != null ? fmt(r.peForward) : '—')
        + row('P/B', r.pb != null ? fmt(r.pb) : '—')
        + row('EPS', r.trailingEps != null ? fmt(r.trailingEps) : '—')
        + row('Beta', r.beta != null ? fmt(r.beta) : '—')
        + row(T('سود تقسیمی', 'Dividend'), dy)
        + row(T('سهام در گردش', 'Shares outstanding'), r.sharesOutstanding ? fmt(r.sharesOutstanding) : '—')
        + row(T('میانگین ۵۰ روزه', '50-day avg'), r.avg50 != null ? fmt(r.avg50) : '—')
        + row(T('میانگین ۲۰۰ روزه', '200-day avg'), r.avg200 != null ? fmt(r.avg200) : '—')
        + ((r.week52High != null) ? row('52W', fmt(r.week52Low) + ' – ' + fmt(r.week52High)) : '')
        + (r.exchange ? row(T('بورس', 'Exchange'), esc(r.exchange)) : '')
        + '</div>';
      return;
    }
    el.innerHTML = '<div class="na">' + esc(T('برای این نماد بنیادی نیست.', 'No fundamentals for this symbol.')) + '</div>';
  }

  /* ---- خبر (همان RSS ربات؛ با پروکسی) ---- */
  function renderNews() {
    var el = $('tabNews');
    var q = state.quote;
    if (!q) return;
    el.innerHTML = '<div class="muted">' + esc(T('در حال بارگذاری…', 'Loading…')) + '</div>';
    var N = window.OnellaNews.createNews({ fetchImpl: proxyFetch });
    var symTag = (q.provider === 'binance') ? q.symbol.replace(/USDT$/, '') : q.symbol;
    N.symbolNews(q, lang, 5).then(function (items) {
      if (!items || !items.length) {
        el.innerHTML = '<div class="na">' + esc(T('خبری پیدا نشد.', 'No news found.')) + '</div>'
          + (!PROXY_URL ? '<div class="hint">' + esc(T('به پروکسی نیاز دارد — PROXY_URL را در app.js بگذار (README را ببین).', 'Needs the proxy — set PROXY_URL in app.js (see README).')) + '</div>' : '');
        return;
      }
      var html = '<div class="news">';
      items.forEach(function (it) {
        var tag = symTag;
        var lv = N.impactOf(it.title);
        html += '<div class="news-item"><div class="news-tag">[' + esc(tag) + '] ' + impactBadge(lv) + '</div>'
          + '<div class="news-title">' + esc(it.title) + '</div>'
          + (it.time ? '<div class="news-time">' + new Date(it.time).toUTCString().slice(5, 22) + ' UTC</div>' : '')
          + '</div>';
      });
      html += '</div><div class="warn">' + esc(T('تاثیر از روی کلیدواژهٔ تیتر تخمین زده شده؛ قطعی نیست.', 'Impact is a keyword estimate, not certain.')) + '</div>';
      el.innerHTML = html;
    });
  }
  function impactBadge(lv) {
    if (lv === 'high') return '<span class="imp high">🔴 ' + esc(lang === 'fa' ? 'تاثیر بالا' : 'High impact') + '</span>';
    if (lv === 'medium') return '<span class="imp med">🟡 ' + esc(lang === 'fa' ? 'تاثیر متوسط' : 'Medium impact') + '</span>';
    return '<span class="imp low">⚪ ' + esc(lang === 'fa' ? 'تاثیر کم' : 'Low impact') + '</span>';
  }
  // fetch خبر از پروکسی (RSS گوگل‌نیوز / CoinDesk) — بدون پروکسی مرورگر CORS را بلاک می‌کند
  // و fetchRss ربات [] برمی‌گرداند؛ پس در آن حالت مستقیم امتحان نمی‌کنیم.
  async function proxyFetch(url, opts) {
    var u = proxyUrl('rss', url);
    if (!u) throw new Error('no-proxy');
    return fetch(u, opts);
  }

  /* ---- شروع ---- */
  function init() {
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) {}
      try { tg.BackButton.onClick(function () { show('catalog'); }); } catch (e) {}
    }
    $('backBtn').addEventListener('click', function () { show('catalog'); });
    ['chart', 'analysis', 'fund', 'news'].forEach(function (t) {
      $('tabBtn-' + t).addEventListener('click', function () { setTab(t); });
    });
    $('tabBtn-chart').textContent = T('چارت', 'Chart');
    $('tabBtn-analysis').textContent = T('تحلیل', 'Analysis');
    $('tabBtn-fund').textContent = T('بنیادی', 'Fundamentals');
    $('tabBtn-news').textContent = T('خبر', 'News');
    $('backBtn').textContent = T('‹ بازگشت', '‹ Back');
    show('catalog');
  }
  /* برای تست از کنسول مرورگر: window.__miniApp.openSymbol({provider:'binance',symbol:'BTCUSDT',display:'BTC/USDT',label:'BTC'}) */
  window.__miniApp = { openSymbol: openSymbol, setTf: setTf, setTab: setTab, state: state, renderPriceBox: renderPriceBox };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
